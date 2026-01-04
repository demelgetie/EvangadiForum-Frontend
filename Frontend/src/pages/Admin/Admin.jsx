import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { AuthContext } from '../../App'
import styles from './Admin.module.css'
import { useTranslation } from 'react-i18next'

export default function Admin() {
  const { token } = useContext(AuthContext)
  const { t } = useTranslation()
  const [tab, setTab] = useState('overview')
  const [error, setError] = useState('')

  const [overview, setOverview] = useState({ users: [], questions: [], answers: [], notifications: [] })
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalQuestions: 0, totalAnswers: 0, last24hUsers: 0, last24hQuestions: 0, last24hAnswers: 0 })
  const [health, setHealth] = useState({ api: 'up', db: 'up', uptimeSec: 0, port: '' })
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userStatus, setUserStatus] = useState('')
  const [reports, setReports] = useState([])
  const [activity, setActivity] = useState({ questions: [], answers: [], users: [] })
  const [showQ, setShowQ] = useState(true)
  const [showA, setShowA] = useState(true)
  const [hover, setHover] = useState(null)
  const [contentTab, setContentTab] = useState('questions')
  const [contentUser, setContentUser] = useState('')
  const [contentReported, setContentReported] = useState(false)
  const [contentQuestions, setContentQuestions] = useState([])
  const [contentAnswers, setContentAnswers] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [categories, setCategories] = useState([])
  const [newCat, setNewCat] = useState({ name: '', description: '' })
  const [settings, setSettings] = useState({ announcement_banner: '' })
  const [logs, setLogs] = useState({ audit: [], recentLogins: [], errors: [] })

  const auth = { headers: { Authorization: `Bearer ${token}` } }

  const loadOverview = async () => {
    setError('')
    try {
      const res = await axios.get('/api/users/admin/overview', auth)
      setOverview(res.data || { users: [], questions: [], answers: [], notifications: [] })
    } catch (err) { setError(err.response?.data?.msg || t('common.error')) }
    try { const res2 = await axios.get('/api/users/admin/metrics', auth); setMetrics(res2.data || metrics) } catch (_) {}
    try { const res3 = await axios.get('/api/users/admin/health', auth); setHealth(res3.data || health) } catch (_) {}
    try { const res4 = await axios.get('/api/users/admin/activity', auth); setActivity(res4.data || { questions: [], answers: [], users: [] }) } catch (_) {}
  }

  const loadUsers = async () => {
    try {
      const res = await axios.get(`/api/users/admin/users?search=${encodeURIComponent(userSearch)}&status=${encodeURIComponent(userStatus || '')}`, auth)
      setUsers(res.data.users || [])
    } catch (err) { setError(err.response?.data?.msg || t('common.error')) }
  }
  const setRole = async (targetUserid, role) => {
    try { await axios.post('/api/users/admin/users/role', { targetUserid, role }, auth); loadUsers() } catch (_) {}
  }
  const setSuspended = async (targetUserid, suspended) => {
    try { await axios.post('/api/users/admin/users/suspend', { targetUserid, suspended }, auth); loadUsers() } catch (_) {}
  }
  const deleteUser = async (id) => { try { await axios.delete(`/api/users/admin/users/${id}`, auth); loadUsers() } catch (_) {} }
  const viewActivity = async (id) => { try { const res = await axios.get(`/api/users/admin/users/${id}/activity`, auth); alert(`Questions: ${res.data.questions.length}, Answers: ${res.data.answers.length}`) } catch (_) {} }
  const loadContent = async () => {
    try {
      const params = `?user=${encodeURIComponent(contentUser)}&reported=${contentReported?'true':'false'}`
      if (contentTab === 'questions') {
        const res = await axios.get(`/api/users/admin/content/questions${params}`, auth)
        setContentQuestions(res.data.questions || [])
      } else {
        const res = await axios.get(`/api/users/admin/content/answers${params}`, auth)
        setContentAnswers(res.data.answers || [])
      }
    } catch (err) { setError(err.response?.data?.msg || t('common.error')) }
  }
  const toggleSelected = (id) => { setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]) }
  const bulkDelete = async () => {
    try {
      if (contentTab === 'questions') await axios.post('/api/users/admin/content/questions/bulk-delete', { ids: selectedIds }, auth)
      else await axios.post('/api/users/admin/content/answers/bulk-delete', { ids: selectedIds }, auth)
      setSelectedIds([]); loadContent()
    } catch (_) {}
  }

  const loadReports = async () => {
    try { const res = await axios.get('/api/users/admin/reports', auth); setReports(res.data.reports || []) } catch (err) { setError(err.response?.data?.msg || 'Unable to load reports') }
  }
  const handleReportAction = async (id, action) => {
    try { await axios.post(`/api/users/admin/reports/${id}/action`, { action }, auth); loadReports() } catch (_) {}
  }

  const loadCategories = async () => {
    try { const res = await axios.get('/api/users/admin/categories', auth); setCategories(res.data.categories || []) } catch (err) { setError(err.response?.data?.msg || 'Unable to load categories') }
  }
  const createCategory = async () => {
    if (!newCat.name) return
    try { await axios.post('/api/users/admin/categories', newCat, auth); setNewCat({ name: '', description: '' }); loadCategories() } catch (_) {}
  }
  const updateCategory = async (id, name, description) => {
    try { await axios.put(`/api/users/admin/categories/${id}`, { name, description }, auth); loadCategories() } catch (_) {}
  }
  const deleteCategory = async (id) => {
    try { await axios.delete(`/api/users/admin/categories/${id}`, auth); loadCategories() } catch (_) {}
  }

  const loadSettings = async () => {
    try { const res = await axios.get('/api/users/admin/settings', auth); setSettings(res.data.settings || {}) } catch (err) { setError(err.response?.data?.msg || t('common.error')) }
  }
  const setSetting = async (k, v) => {
    try { await axios.post('/api/users/admin/settings', { k, v }, auth); loadSettings() } catch (_) {}
  }

  const loadLogs = async () => {
    try { const res = await axios.get('/api/users/admin/logs', auth); const errs = await axios.get('/api/users/admin/error-logs', auth); setLogs({ ...(res.data || { audit: [], recentLogins: [] }), errors: errs.data.errors || [] }) } catch (err) { setError(err.response?.data?.msg || t('common.error')) }
  }

  useEffect(() => { loadOverview() }, [token])
  useEffect(() => { if (tab === 'users') loadUsers() }, [tab, userSearch])
  useEffect(() => { if (tab === 'moderation') loadReports() }, [tab])
  useEffect(() => { if (tab === 'content') loadContent() }, [tab, contentTab, contentUser, contentReported])
  const loadTags = async () => { try { const res = await axios.get('/api/users/admin/tags', auth); setSettings(s => ({ ...s, _tags: res.data.tags || [] })) } catch (_) {} }
  useEffect(() => { if (tab === 'system') { loadCategories(); loadSettings(); loadTags() } }, [tab])
  useEffect(() => { if (tab === 'logs') loadLogs() }, [tab])

  return (
    <div className={styles.wrap}>
      <h2>{t('admin.title')}</h2>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab==='overview'?styles.active:''}`} onClick={() => setTab('overview')}>{t('admin.tabs.dashboard')}</button>
        <button className={`${styles.tab} ${tab==='users'?styles.active:''}`} onClick={() => setTab('users')}>{t('admin.tabs.users')}</button>
        <button className={`${styles.tab} ${tab==='moderation'?styles.active:''}`} onClick={() => setTab('moderation')}>{t('admin.tabs.moderation')}</button>
        <button className={`${styles.tab} ${tab==='content'?styles.active:''}`} onClick={() => setTab('content')}>{t('admin.tabs.qa')}</button>
        <button className={`${styles.tab} ${tab==='system'?styles.active:''}`} onClick={() => setTab('system')}>{t('admin.tabs.system')}</button>
        <button className={`${styles.tab} ${tab==='logs'?styles.active:''}`} onClick={() => setTab('logs')}>{t('admin.tabs.logs')}</button>
      </div>

      {tab === 'overview' && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>{t('admin.latestUsers')}</h3>
            <ul>{(overview.users || []).map(u => <li key={u.userid}>{u.username} ({u.email})</li>)}</ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.latestQuestions')}</h3>
            <ul>{(overview.questions || []).map(q => <li key={q.questionid}>{q.title} — {q.username} <button className={styles.linkBtn} onClick={() => axios.post(`/api/questions/${q.questionid}/pin`, { pinned: true }, auth).then(loadOverview)}>{t('admin.actions.pin')}</button> <button className={styles.linkBtn} onClick={() => axios.post(`/api/questions/${q.questionid}/pin`, { pinned: false }, auth).then(loadOverview)}>{t('admin.actions.unpin')}</button></li>)}</ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.latestAnswers')}</h3>
            <ul>{(overview.answers || []).map(a => <li key={a.answerid}>{a.username}: {a.answer?.slice(0, 80)}{(a.answer||'').length>80?'…':''}</li>)}</ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.latestNotifications')}</h3>
            <ul>{(overview.notifications || []).map(n => <li key={n.id}>{n.type}: {n.message}</li>)}</ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.metrics.title')}</h3>
            <ul>
              <li>{t('admin.metrics.totalUsers')}: {metrics.totalUsers}</li>
              <li>{t('admin.metrics.totalQuestions')}: {metrics.totalQuestions}</li>
              <li>{t('admin.metrics.totalAnswers')}: {metrics.totalAnswers}</li>
              <li>{t('admin.metrics.last24hUsers')}: {metrics.last24hUsers}</li>
              <li>{t('admin.metrics.last24hQuestions')}: {metrics.last24hQuestions}</li>
              <li>{t('admin.metrics.last24hAnswers')}: {metrics.last24hAnswers}</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>Community Analytics</h3>
            <div className={styles.row}><button className={styles.secondary} onClick={async () => { try { const res = await axios.get('/api/users/admin/community-analytics', auth); setOverview(o => ({ ...o, _analytics: res.data })) } catch (_) {} }}>Refresh</button></div>
            {overview._analytics && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div>
                  <h4>Top Influencers</h4>
                  <ul className={styles.list}>{(overview._analytics.influential||[]).map(u => <li key={u.userid} className={styles.listItem}><div><div className={styles.bold}>{u.username}</div><div className={styles.small}>Reputation {u.reputation} • Accepted {u.accepted_count}</div></div></li>)}</ul>
                </div>
                <div>
                  <h4>At-Risk Users</h4>
                  <ul className={styles.list}>{(overview._analytics.atRisk||[]).map(u => <li key={u.userid} className={styles.listItem}><div><div className={styles.bold}>{u.username}</div><div className={styles.small}>Rep {u.reputation} • Inactive {u.days_inactive}d {u.suspended? '• Suspended':''}</div></div></li>)}</ul>
                </div>
              </div>
            )}
          </div>
          <div className={styles.card}>
            <h3>{t('admin.health.title')}</h3>
            <ul>
              <li>{t('admin.health.api')}: {health.api}</li>
              <li>{t('admin.health.db')}: {health.db}</li>
              <li>{t('admin.health.uptime')}: {health.uptimeSec}s</li>
              <li>{t('admin.health.port')}: {health.port}</li>
            </ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.activity')}</h3>
            <div className={styles.chartWrap}>
              {(() => {
                const dq = activity.questions || []
                const da = activity.answers || []
                const n = Math.max(dq.length, da.length)
                const pad = 20
                const W = 600
                const H = 180
                const step = n > 1 ? (W - pad*2) / (n - 1) : 0
                const max = Math.max(...Array.from({ length: n }, (_, i) => Math.max(dq[i]?.c || 0, da[i]?.c || 0, 1)))
                const pointsQ = Array.from({ length: n }, (_, i) => {
                  const x = pad + i*step
                  const y = H - pad - ((dq[i]?.c || 0) / max) * (H - pad*2)
                  return { x, y, v: dq[i]?.c || 0, d: dq[i]?.d }
                })
                const pointsA = Array.from({ length: n }, (_, i) => {
                  const x = pad + i*step
                  const y = H - pad - ((da[i]?.c || 0) / max) * (H - pad*2)
                  return { x, y, v: da[i]?.c || 0, d: da[i]?.d }
                })
                const path = pts => pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
                const leftPct = hover ? (hover.x / W * 100) + '%' : '0%'
                const topPct = hover ? (hover.y / H * 100) + '%' : '0%'
                return (
                  <div>
                    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                      <rect x="0" y="0" width={W} height={H} fill="#fff" />
                      {[0,1,2,3,4].map(i => (
                        <line key={i} x1={pad} x2={W-pad} y1={pad + i*((H-pad*2)/4)} y2={pad + i*((H-pad*2)/4)} stroke="#eef2f7" />
                      ))}
                      {showQ && <path d={path(pointsQ)} fill="none" stroke="#6366f1" strokeWidth="2" />}
                      {showA && <path d={path(pointsA)} fill="none" stroke="#22c55e" strokeWidth="2" />}
                      {showQ && pointsQ.map((p,i) => (
                        <circle key={`q_${i}`} cx={p.x} cy={p.y} r="3.5" fill="#6366f1" onMouseEnter={() => setHover({ x: p.x, y: p.y, label: `${p.d || ''} • Q ${p.v}` })} onMouseLeave={() => setHover(null)} />
                      ))}
                      {showA && pointsA.map((p,i) => (
                        <circle key={`a_${i}`} cx={p.x} cy={p.y} r="3.5" fill="#22c55e" onMouseEnter={() => setHover({ x: p.x, y: p.y, label: `${p.d || ''} • A ${p.v}` })} onMouseLeave={() => setHover(null)} />
                      ))}
                    </svg>
                    {hover && <div className={styles.tooltip} style={{ left: leftPct, top: topPct }}>{hover.label}</div>}
                  </div>
                )
              })()}
            </div>
            <div className={styles.legend}>
              <button className={styles.chip} onClick={() => setShowQ(s => !s)}><span className={styles.chipDot} style={{ background:'#6366f1' }} /> {t('admin.chartLegend.questions')} {showQ ? '✓' : '✗'}</button>
              <button className={styles.chip} onClick={() => setShowA(s => !s)}><span className={styles.chipDot} style={{ background:'#22c55e' }} /> {t('admin.chartLegend.answers')} {showA ? '✓' : '✗'}</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'content' && (
        <div className={styles.card}>
          <h3>{t('admin.contentOversight')}</h3>
          <div className={styles.row}>
            <button className={styles.secondary} onClick={() => setContentTab('questions')}>{t('admin.chartLegend.questions')}</button>
            <button className={styles.secondary} onClick={() => setContentTab('answers')}>{t('admin.chartLegend.answers')}</button>
            <input className={styles.input} placeholder={t('admin.filters.byUserEmail')} value={contentUser} onChange={e => setContentUser(e.target.value)} />
            <label style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={contentReported} onChange={e => setContentReported(e.target.checked)} /> {t('admin.filters.reportedOnly')}</label>
            <button className={styles.primary} onClick={loadContent}>{t('admin.filters.filter')}</button>
          </div>
          {contentTab === 'questions' && (
            <table className={styles.table}>
              <thead><tr><th></th><th>{t('admin.table.title')}</th><th>{t('admin.table.user')}</th><th>{t('admin.table.date')}</th><th>{t('admin.table.actions')}</th></tr></thead>
              <tbody>
                {contentQuestions.map(q => (
                  <tr key={q.questionid}>
                    <td><input type="checkbox" checked={selectedIds.includes(q.questionid)} onChange={() => toggleSelected(q.questionid)} /></td>
                    <td>{q.title}</td>
                    <td>{q.username}</td>
                    <td>{new Date(q.created_at).toLocaleString()}</td>
                    <td>
                      <button className={styles.linkBtn} onClick={async () => { const title = prompt(t('admin.table.title'), q.title); const description = prompt(t('admin.system.description'), q.description || ''); await axios.patch(`/api/questions/${q.questionid}`, { title, description }, auth); loadContent() }}>{t('admin.actions.edit')}</button>
                      <button className={styles.linkBtn} onClick={() => axios.post(`/api/questions/${q.questionid}/pin`, { pinned: !q.is_pinned }, auth).then(loadContent)}>{q.is_pinned?t('admin.actions.unpin'):t('admin.actions.pin')}</button>
                      <button className={styles.danger} onClick={() => { setSelectedIds([q.questionid]); bulkDelete() }}>{t('admin.actions.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {contentTab === 'answers' && (
            <table className={styles.table}>
              <thead><tr><th></th><th>{t('admin.table.answer')}</th><th>{t('admin.table.user')}</th><th>{t('admin.table.date')}</th><th>{t('admin.table.actions')}</th></tr></thead>
              <tbody>
                {contentAnswers.map(a => (
                  <tr key={a.answerid}>
                    <td><input type="checkbox" checked={selectedIds.includes(a.answerid)} onChange={() => toggleSelected(a.answerid)} /></td>
                    <td>{(a.answer||'').slice(0,120)}{(a.answer||'').length>120?'…':''}</td>
                    <td>{a.username}</td>
                    <td>{new Date(a.created_at).toLocaleString()}</td>
                    <td>
                      <button className={styles.linkBtn} onClick={async () => { const answer = prompt(t('admin.table.answer'), a.answer || ''); if (answer != null) await axios.patch(`/api/answers/${a.answerid}`, { answer }, auth); loadContent() }}>{t('admin.actions.edit')}</button>
                      <button className={styles.danger} onClick={() => { setSelectedIds([a.answerid]); bulkDelete() }}>{t('admin.actions.delete')}</button>
                      <Link className={styles.linkBtn} to={`/question/${a.questionid}`}>{t('admin.actions.open')}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className={styles.row}>
            <button className={styles.danger} onClick={bulkDelete}>{t('admin.actions.bulkDelete')}</button>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className={styles.card}>
          <h3>{t('admin.users.title')}</h3>
          <div className={styles.row}>
            <input className={styles.input} placeholder={t('admin.users.searchPlaceholder')} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            <select className={styles.input} value={userStatus} onChange={e => setUserStatus(e.target.value)}>
              <option value="">{t('admin.users.status.all')}</option>
              <option value="admin">{t('admin.users.status.admins')}</option>
              <option value="suspended">{t('admin.users.status.suspended')}</option>
              <option value="active">{t('admin.users.status.active')}</option>
            </select>
            <button className={styles.secondary} onClick={loadUsers}>{t('admin.actions.search')}</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr><th>{t('admin.table.username')}</th><th>{t('admin.table.email')}</th><th>{t('admin.table.role')}</th><th>{t('admin.table.status')}</th><th>{t('admin.table.lastLogin')}</th><th>{t('admin.table.actions')}</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userid}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.suspended ? t('admin.users.status.suspended') : t('admin.users.status.active')}</td>
                  <td>{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td>
                  <td>
                    <button className={styles.linkBtn} onClick={() => setRole(u.userid, u.role === 'admin' ? 'user' : 'admin')}>{u.role==='admin'?t('admin.actions.revokeAdmin'):t('admin.actions.grantAdmin')}</button>
                    <button className={styles.linkBtn} onClick={() => setRole(u.userid, u.role === 'moderator' ? 'user' : 'moderator')}>{u.role==='moderator'?t('admin.actions.revokeModerator'):t('admin.actions.grantModerator')}</button>
                    <button className={styles.linkBtn} onClick={() => setSuspended(u.userid, !u.suspended)}>{u.suspended?t('admin.actions.unsuspend'):t('admin.actions.suspend')}</button>
                    <button className={styles.linkBtn} onClick={() => deleteUser(u.userid)}>{t('admin.actions.delete')}</button>
                    <button className={styles.linkBtn} onClick={() => viewActivity(u.userid)}>{t('admin.actions.viewActivity')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'moderation' && (
        <div className={styles.card}>
          <h3>{t('admin.tabs.moderation')}</h3>
          <ul className={styles.list}> 
            {(reports || []).map(r => (
              <li key={r.id} className={styles.listItem}>
                <div>
                  <div className={styles.small}>Report #{r.id} • {r.type} #{r.refid} • {r.status}</div>
                  <div>By {r.reporter} — {r.reason}</div>
                  {r.preview && <div className={styles.small}>{r.preview}</div>}
                  {r.link && <Link className={styles.link} to={r.link}>{t('admin.actions.open')}</Link>}
                </div>
                <div className={styles.row}>
                  <button className={styles.secondary} onClick={() => handleReportAction(r.id, 'dismiss')}>{t('admin.actions.dismiss')}</button>
                  <button className={styles.danger} onClick={() => handleReportAction(r.id, 'delete')}>{t('admin.actions.delete')}</button>
                  {r.type === 'question' && <button className={styles.secondary} onClick={async () => { const title = prompt(t('admin.table.title')); const description = prompt(t('admin.system.description')); if (title || description) await axios.patch(`/api/questions/${r.refid}`, { title, description }, auth); loadReports() }}>{t('admin.actions.edit')}</button>}
                  {r.type === 'answer' && <button className={styles.secondary} onClick={async () => { const answer = prompt(t('admin.table.answer')); if (answer) await axios.patch(`/api/answers/${r.refid}`, { answer }, auth); loadReports() }}>{t('admin.actions.edit')}</button>}
                  {r.type === 'comment' && r.answerid && <button className={styles.secondary} onClick={async () => { const comment = prompt(t('admin.table.answer')); if (comment) await axios.patch(`/api/answers/${r.answerid}/comments/${r.refid}`, { comment }, auth); loadReports() }}>{t('admin.actions.edit')}</button>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'system' && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Categories</h3>
            <div className={styles.row}>
              <input className={styles.input} placeholder="Name" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} />
              <input className={styles.input} placeholder="Description" value={newCat.description} onChange={e => setNewCat({ ...newCat, description: e.target.value })} />
              <button className={styles.primary} onClick={createCategory}>Add</button>
            </div>
            <ul className={styles.list}>
              {categories.map(c => (
                <li key={c.id} className={styles.listItem}>
                  <div>
                    <div className={styles.bold}>{c.name}</div>
                    <div className={styles.small}>{c.description}</div>
                  </div>
                  <div className={styles.row}>
                    <button className={styles.secondary} onClick={() => { const name = prompt('Name', c.name) || c.name; const description = prompt('Description', c.description || '') || c.description; updateCategory(c.id, name, description); }}>Edit</button>
                    <button className={styles.danger} onClick={() => deleteCategory(c.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.card}>
            <h3>Site Settings</h3>
            <label className={styles.label}>Announcement Banner</label>
            <textarea className={styles.textarea} value={settings.announcement_banner || ''} onChange={e => setSettings(s => ({ ...s, announcement_banner: e.target.value }))} />
            <div className={styles.row}>
              <button className={styles.primary} onClick={() => setSetting('announcement_banner', settings.announcement_banner || '')}>Save</button>
            </div>
            <label className={styles.label}>Reset Email Subject</label>
            <input className={styles.input} value={settings.email_reset_subject || ''} onChange={e => setSettings(s => ({ ...s, email_reset_subject: e.target.value }))} />
            <label className={styles.label}>{'Reset Email Body (use {{link}})'}</label>
            <textarea className={styles.textarea} value={settings.email_reset_body || ''} onChange={e => setSettings(s => ({ ...s, email_reset_body: e.target.value }))} />
            <div className={styles.row}>
              <button className={styles.primary} onClick={() => setSetting('email_reset_subject', settings.email_reset_subject || '')}>Save Subject</button>
              <button className={styles.primary} onClick={() => setSetting('email_reset_body', settings.email_reset_body || '')}>Save Body</button>
            </div>
            <label className={styles.label}>Maintenance Mode</label>
            <select className={styles.input} value={settings.maintenance_mode || 'off'} onChange={e => setSettings(s => ({ ...s, maintenance_mode: e.target.value }))}>
              <option value="off">Off</option>
              <option value="on">On</option>
            </select>
            <div className={styles.row}><button className={styles.primary} onClick={() => setSetting('maintenance_mode', settings.maintenance_mode || 'off')}>Save</button></div>
            <label className={styles.label}>Site Name</label>
            <input className={styles.input} value={settings.site_name || ''} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
            <div className={styles.row}><button className={styles.primary} onClick={() => setSetting('site_name', settings.site_name || '')}>Save</button></div>
          </div>
          <div className={styles.card}>
            <h3>Tags</h3>
            <div className={styles.row}>
              <input className={styles.input} placeholder="New tag" value={settings._newTag || ''} onChange={e => setSettings(s => ({ ...s, _newTag: e.target.value }))} />
              <button className={styles.primary} onClick={async () => { if (!settings._newTag) return; await axios.post('/api/users/admin/tags', { name: settings._newTag }, auth); setSettings(s => ({ ...s, _newTag: '' })); loadTags() }}>Add</button>
            </div>
            <ul className={styles.list}>
              {(settings._tags || []).map(t => (
                <li key={t.id} className={styles.listItem}>
                  <div className={styles.bold}>{t.name}</div>
                  <div className={styles.row}>
                    <button className={styles.secondary} onClick={async () => { const name = prompt('Tag', t.name) || t.name; await axios.put(`/api/users/admin/tags/${t.id}`, { name }, auth); loadTags() }}>Rename</button>
                    <button className={styles.danger} onClick={async () => { await axios.delete(`/api/users/admin/tags/${t.id}`, auth); loadTags() }}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'logs' && (
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>{t('admin.logs.audit')}</h3>
            <ul className={styles.list}>
              {(logs.audit || []).map(a => (
                <li key={a.id} className={styles.listItem}><span className={styles.small}>#{a.id} • {a.action} • {a.target}</span> — {a.details}</li>
              ))}
            </ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.logs.recentLogins')}</h3>
            <ul className={styles.list}>
              {(logs.recentLogins || []).map(l => (
                <li key={l.userid} className={styles.listItem}><span className={styles.bold}>{l.username}</span> — {l.last_login ? new Date(l.last_login).toLocaleString() : '-'}</li>
              ))}
            </ul>
          </div>
          <div className={styles.card}>
            <h3>{t('admin.logs.errors')}</h3>
            <ul className={styles.list}>
              {(logs.errors || []).map(e => (
                <li key={e.id} className={styles.listItem}><span className={styles.small}>{e.level}</span> — {e.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}


