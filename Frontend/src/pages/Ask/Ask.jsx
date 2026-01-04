
import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../../App'
import { Link } from 'react-router-dom'
import styles from './Ask.module.css'

export default function Ask() {
  const { token } = useContext(AuthContext)
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tag, setTag] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [suggestedTags, setSuggestedTags] = useState([])
  const [related, setRelated] = useState([])
  const [assistTitle, setAssistTitle] = useState([])
  const [assistDesc, setAssistDesc] = useState([])
  const [typingTimer, setTypingTimer] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setMsg('')
    setMsgType('')
    if (!title || !description) {
      setMsg(t('errors.fillRequired'))
      setMsgType('error')
      return
    }
    try {
      await axios.post('/api/questions', { title, description, tag, imageUrl }, { headers: { Authorization: `Bearer ${token}` } })
      setTitle('')
      setDescription('')
      setTag('')
      setImageUrl('')
      setMsg(t('ask.postSuccess'))
      setMsgType('success')
    } catch (err) {
      setMsg(err.response?.data?.msg || t('ask.postFailed'))
      setMsgType('error')
    }
  }

  const suggestTags = async () => {
    try {
      const res = await axios.post('/api/ai/suggest-tags', { title, description })
      setSuggestedTags(res.data.tags || [])
    } catch (_) {}
  }

  const findRelated = async () => {
    try {
      const res = await axios.get(`/api/questions/search/suggest?title=${encodeURIComponent(title)}`)
      setRelated(res.data.questions || [])
    } catch (_) {}
  }

  useEffect(() => {
    if (typingTimer) clearTimeout(typingTimer)
    const t = setTimeout(async () => {
      if (title || description) {
        try {
          const tagRes = await axios.post('/api/ai/suggest-tags', { title, description })
          setSuggestedTags(tagRes.data.tags || [])
        } catch (_) {}
        try {
          const relRes = await axios.get(`/api/questions/search/suggest?title=${encodeURIComponent(title)}`)
          setRelated(relRes.data.questions || [])
        } catch (_) {}
        try {
          const a1 = await axios.post('/api/ai/write-assist', { text: title })
          setAssistTitle(a1.data.suggestions || [])
        } catch (_) { setAssistTitle([]) }
        try {
          const a2 = await axios.post('/api/ai/write-assist', { text: description })
          setAssistDesc(a2.data.suggestions || [])
        } catch (_) { setAssistDesc([]) }
      } else {
        setSuggestedTags([]); setRelated([]); setAssistTitle([]); setAssistDesc([])
      }
    }, 400)
    setTypingTimer(t)
    return () => clearTimeout(t)
  }, [title, description])

  return (
    <div className={styles.wrap}>
      <h3>{t('ask.stepsTitle')}</h3>
      <ul className={styles.list}>
        <li>{t('ask.step1')}</li>
        <li>{t('ask.step2')}</li>
        <li>{t('ask.step3')}</li>
        <li>{t('ask.step4')}</li>
      </ul>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3>{t('ask.askTitle')}</h3>
          <Link to="/">{t('ask.goToQuestions')}</Link>
        </div>
        <form className={styles.form} onSubmit={submit}>
          <input className={styles.input} placeholder={t('ask.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
          {assistTitle.length>0 && <div className={styles.assist}>{assistTitle.join(' ')}</div>}
          <textarea className={styles.textarea} placeholder={t('ask.descriptionPlaceholder')} value={description} onChange={e => setDescription(e.target.value)} />
          {assistDesc.length>0 && <div className={styles.assist}>{assistDesc.join(' ')}</div>}
          <input className={styles.input} placeholder={t('ask.tagPlaceholder')} value={tag} onChange={e => setTag(e.target.value)} />
          <input className={styles.input} placeholder={t('ask.imageUrlOptional')} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
          <div className={styles.row}>
            <button className={styles.secondary} type="button" onClick={suggestTags}>{t('ask.suggestTags')}</button>
            <button className={styles.secondary} type="button" onClick={findRelated}>{t('ask.findSimilar')}</button>
          </div>
          {suggestedTags.length > 0 && (
            <div className={styles.suggests}>
              {suggestedTags.map(s => (
                <button key={s} type="button" className={styles.suggest} onClick={() => setTag(s)}>{s}</button>
              ))}
            </div>
          )}
          {related.length > 0 && (
            <ul className={styles.related}>
              {related.map(r => (
                <li key={r.questionid}><Link to={`/question/${r.questionid}`}>{r.title}</Link> — {r.username} {r.accepted_answerid ? `• ${t('ask.answered')}` : (r.answers>0 ? `• ${t('ask.answersCount', { count: r.answers })}` : '')}</li>
              ))}
            </ul>
          )}
          {msg && <div className={`${styles.status} ${msgType === 'success' ? styles.success : styles.error}`}>{msg}</div>}
          <button className={styles.primary} type="submit">{t('ask.postButton')}</button>
        </form>
      </div>
    </div>
  )
}
