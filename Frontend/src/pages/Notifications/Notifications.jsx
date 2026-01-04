import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../../App'
import styles from './Notifications.module.css'
import { useTranslation } from 'react-i18next'

export default function Notifications() {
  const { token } = useContext(AuthContext)
  const [items, setItems] = useState([])
  const { t } = useTranslation()

  useEffect(() => {
    const load = async () => {
      const res = await axios.get('/api/users/notifications', { headers: { Authorization: `Bearer ${token}` } })
      setItems(res.data.notifications || [])
    }
    load()
  }, [token])

  useEffect(() => {
    if (!token) return
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`)
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data || '{}')
        if (data.type === 'notification') {
          setItems(prev => [{ id: Date.now(), type: 'live', message: data.message, read: 0 }, ...prev])
        }
        if (data.type === 'question_added') {
          setItems(prev => [{ id: Date.now() + Math.random(), type: 'feed', message: t('notifications.newQuestion', { title: data.title }), read: 0 }, ...prev])
        }
        if (data.type === 'answer_added') {
          setItems(prev => [{ id: Date.now() + Math.random(), type: 'feed', message: t('notifications.newAnswerBy', { username: data.username }), read: 0 }, ...prev])
        }
        if (data.type === 'answer_accepted') {
          setItems(prev => [{ id: Date.now() + Math.random(), type: 'feed', message: t('notifications.bestAnswerSelected'), read: 0 }, ...prev])
        }
      } catch (_) {}
    }
    return () => es.close()
  }, [token])

  const read = async id => {
    await axios.post(`/api/users/notifications/read/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
    setItems(prev => prev.map(x => x.id === id ? { ...x, read: 1 } : x))
  }

  return (
    <div className={styles.wrap}>
      <h2>{t('notifications.title')}</h2>
      <ul className={styles.list}>
        {items.map(n => (
          <li key={n.id} className={styles.item}>
            <div className={styles.meta}>{n.type}</div>
            <div className={styles.text}>{n.message}</div>
            {!n.read && <button className={styles.btn} onClick={() => read(n.id)}>{t('notifications.markRead')}</button>}
          </li>
        ))}
      </ul>
    </div>
  )
}
