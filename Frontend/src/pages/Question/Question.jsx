import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../../App'
import styles from './Question.module.css'
import Pagination from '../../components/Pagination/Pagination'

export default function Question() {
  const { token, username } = useContext(AuthContext)
  const { t } = useTranslation()
  const { questionid } = useParams()
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [commentsByAnswer, setCommentsByAnswer] = useState({})
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [answer, setAnswer] = useState('')
  const [msg, setMsg] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [draft, setDraft] = useState('')
  const [summary, setSummary] = useState('')
  const [copilotAnswer, setCopilotAnswer] = useState('')
  const [lang, setLang] = useState('')
  const [translatedQuestion, setTranslatedQuestion] = useState('')
  const [translatedAnswers, setTranslatedAnswers] = useState({})
  const [chat, setChat] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [typing, setTyping] = useState('')

  const formatTimeAgo = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const diffSec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000))
    const units = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1]
    ]
    const rtf = new Intl.RelativeTimeFormat(navigator.language || 'en', { numeric: 'auto' })
    for (const [unit, sec] of units) {
      if (diffSec >= sec) {
        const value = Math.floor(diffSec / sec)
        return rtf.format(-value, unit)
      }
    }
    return ''
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    try {
      return new Intl.DateTimeFormat(navigator.language || 'en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(ts))
    } catch (_) { return '' }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const qRes = await axios.get(`/api/questions/${questionid}`, { headers: { Authorization: `Bearer ${token}` } })
        setQuestion(qRes.data.question)
      } catch (err) {}
      try {
        const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
        setAnswers(aRes.data.answers || [])
        setTotalPages(aRes.data.totalPages || 1)
      } catch (err) {}
    }
    load()
  }, [questionid, token, page])

  useEffect(() => {
    if (!token) return
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`)
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data || '{}')
        if (data.type === 'answer_added' && String(data.questionid) === String(questionid)) {
          const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
          setAnswers(aRes.data.answers || [])
        }
        if (data.type === 'answer_accepted' && String(data.questionid) === String(questionid)) {
          const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
          setAnswers(aRes.data.answers || [])
        }
        if (data.type === 'chat' && data.room === `question:${questionid}`) {
          setChat(prev => [{ username: data.username, message: data.message, ts: Date.now() }, ...prev].slice(0, 100))
        }
        if (data.type === 'draft_typing' && data.room === `question:${questionid}`) {
          setTyping(t('question.typing', { username: data.username }))
          setTimeout(() => setTyping(''), 1200)
        }
      } catch (_) {}
    }
    return () => es.close()
  }, [questionid, token, page])

  useEffect(() => {
    if (!token) return
    const t = setTimeout(async () => {
      try { await axios.post('/api/users/collab/typing', { room: `question:${questionid}`, text: answer }, { headers: { Authorization: `Bearer ${token}` } }) } catch (_) {}
    }, 350)
    return () => clearTimeout(t)
  }, [answer, token, questionid])

  const askCopilot = async () => {
    try {
      const res = await axios.post('/api/ai/copilot-answer', { 
        title: question?.title, 
        description: question?.description 
      })
      setCopilotAnswer(res.data.answer || '')
    } catch (_) {}
  }

  const translateAll = async () => {
    if (!lang) return
    try {
      const qRes = await axios.post('/api/ai/translate', { text: question?.description || '', target: lang })
      setTranslatedQuestion(qRes.data.translated)
      const newAns = {}
      for (const a of answers) {
        const aRes = await axios.post('/api/ai/translate', { text: a.answer || '', target: lang })
        newAns[a.answerid] = aRes.data.translated
      }
      setTranslatedAnswers(newAns)
    } catch (_) {}
  }

  const summarize = async () => {
    try {
      const res = await axios.post('/api/ai/summary', { questionid })
      setSummary(res.data.summary)
    } catch (_) {}
  }

  const generateDraft = async () => {
    try {
      const res = await axios.post('/api/ai/answer-draft', { questionid })
      setDraft(res.data.draft)
    } catch (_) {}
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!answer) return
    try {
      await axios.post('/api/answers', { questionid, answer, image_url: imageUrl }, { headers: { Authorization: `Bearer ${token}` } })
      setAnswer('')
      setImageUrl('')
      setDraft('')
      setMsg('Answer posted successfully')
      setTimeout(() => setMsg(''), 3000)
      const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
      setAnswers(aRes.data.answers || [])
    } catch (_) {
      setMsg('Error posting answer')
    }
  }

  const vote = async (answerid, value) => {
    try {
      await axios.post(`/api/answers/${answerid}/vote`, { value }, { headers: { Authorization: `Bearer ${token}` } })
      const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
      setAnswers(aRes.data.answers || [])
    } catch (_) {}
  }

  const accept = async (answerid) => {
    try {
      await axios.post(`/api/answers/${answerid}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } })
      const qRes = await axios.get(`/api/questions/${questionid}`, { headers: { Authorization: `Bearer ${token}` } })
      setQuestion(qRes.data.question)
      const aRes = await axios.get(`/api/answers/${questionid}?page=${page}&limit=10`, { headers: { Authorization: `Bearer ${token}` } })
      setAnswers(aRes.data.answers || [])
    } catch (_) {}
  }

  const sendChat = async (e) => {
    e.preventDefault()
    if (!chatMsg) return
    try {
      await axios.post('/api/users/chat/send', { room: `question:${questionid}`, message: chatMsg }, { headers: { Authorization: `Bearer ${token}` } })
      setChatMsg('')
    } catch (_) {}
  }

  const loadComments = async (answerid) => {
    try {
      const res = await axios.get(`/api/answers/${answerid}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      setCommentsByAnswer(prev => ({ ...prev, [answerid]: res.data.comments || [] }))
    } catch (_) {}
  }

  const addComment = async (answerid, comment) => {
    if (!comment) return
    try {
      await axios.post(`/api/answers/${answerid}/comments`, { comment }, { headers: { Authorization: `Bearer ${token}` } })
      loadComments(answerid)
    } catch (_) {}
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.block}>
        <h3>{t('question.heading')}</h3>
        <div className={styles.title}>{question?.title}</div>
        <div className={styles.user}>{question?.username} • {formatTimeAgo(question?.created_at)} • {formatDate(question?.created_at)}</div>
        <div className={styles.desc}>{translatedQuestion || question?.description}</div>
        {question?.image_url && <img className={styles.image} alt="" src={question.image_url} />}
        <div className={styles.row}>
          <select value={lang} onChange={e => setLang(e.target.value)}>
            <option value="">{t('question.translatePrompt')}</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ar">Arabic</option>
            <option value="am">Amharic</option>
          </select>
          <button className={styles.secondary} type="button" onClick={translateAll}>{t('question.translatePrompt')}</button>
          <button className={styles.secondary} type="button" onClick={summarize}>{t('question.aiSummary')}</button>
          <button className={styles.secondary} type="button" onClick={askCopilot}>{t('question.askCopilot')}</button>
        </div>
        {summary && <div className={styles.draft}>{summary}</div>}
        {copilotAnswer && (
          <div className={styles.copilotBox}>
            <div className={styles.copilotTitle}>🤖 Copilot Answer</div>
            <div className={styles.copilotContent}>{copilotAnswer}</div>
          </div>
        )}
      </div>
      <div className={styles.block}>
        <h3>{t('question.community')}</h3>
        <div className={styles.liveBox}>
          <div className={styles.liveHeader}>{t('question.liveQA')}</div>
          <form onSubmit={sendChat} className={styles.liveForm}>
            <input placeholder={t('question.sendMessage')} value={chatMsg} onChange={e => setChatMsg(e.target.value)} />
            <button className={styles.secondary} type="submit">{t('question.send')}</button>
          </form>
          {typing && <div className={styles.typing}>{typing}</div>}
          <ul className={styles.liveList}>
            {chat.map((m,i) => (
              <li key={i}><span className={styles.commentUser}>{m.username}</span> {m.message}</li>
            ))}
          </ul>
        </div>
        <ul className={styles.answers}>
          {answers.map(a => (
            <li key={a.answerid} className={styles.answerItem}>
              <div className={styles.avatar} />
              <div className="text">{translatedAnswers[a.answerid] || a.answer}</div>
              {a.image_url && <img className={styles.image} alt="" src={a.image_url} />}
              <div className={styles.user}>{a.username} • {formatTimeAgo(a.created_at)} • {formatDate(a.created_at)}</div>
              {question?.username === username && !a.accepted && (
                <button className={styles.btn} onClick={() => accept(a.answerid)}>Mark as Best</button>
              )}
              {a.accepted ? <span className={styles.badge}>Best Answer</span> : null}
              <div className={styles.votes}>
                <button className={styles.voteBtn} onClick={() => vote(a.answerid, 1)}>▲</button>
                <div className={styles.score}>{a.score || 0}</div>
                <button className={styles.voteBtn} onClick={() => vote(a.answerid, -1)}>▼</button>
              </div>
              <div className={styles.comments}>
                <button className={styles.link} onClick={() => loadComments(a.answerid)}>{t('question.showComments') || 'Comments'}</button>
                <ul className={styles.commentList}>
                  {(commentsByAnswer[a.answerid] || []).map(c => (
                    <li key={c.commentid} className={styles.commentItem}><span className={styles.commentUser}>{c.username}</span> {c.comment} — {formatTimeAgo(c.created_at)} • {formatDate(c.created_at)}</li>
                  ))}
                </ul>
                <form onSubmit={e => { e.preventDefault(); const txt = e.target.elements[`c_${a.answerid}`].value; e.target.reset(); addComment(a.answerid, txt) }}>
                  <input name={`c_${a.answerid}`} placeholder={t('question.commentPlaceholder') || 'Add a comment'} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} labels={{ prev: t('pagination.prev'), next: t('pagination.next') }} />
      <div className={styles.block}>
        <h3>{t('question.answerTop')}</h3>
        <form className={styles.form} onSubmit={submit}>
          <textarea placeholder={t('question.answerPlaceholder')} value={answer} onChange={e => setAnswer(e.target.value)} />
          <input placeholder={t('ask.imageUrlOptional')} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          <div className={styles.row}>
            <button className={styles.secondary} type="button" onClick={generateDraft}>Generate Answer Draft</button>
          </div>
          {draft && <div className={styles.draft}>{draft}</div>}
          {msg && <div className={styles.status}>{msg}</div>}
          <button className={styles.primary} type="submit">{t('question.postButton')}</button>
        </form>
      </div>
    </div>
  )
}
