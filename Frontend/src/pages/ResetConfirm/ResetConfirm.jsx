import React, { useState } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'
import styles from './ResetConfirm.module.css'

export default function ResetConfirm() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async e => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await axios.post('/api/users/resetPassword', { token, password })
      setMsg(res.data.msg || 'Password updated')
    } catch (err) {
      setMsg('Failed to update password')
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Set New Password</h2>
        <form className={styles.form} onSubmit={submit}>
          <input className={styles.input} type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className={styles.primary}>Update Password</button>
        </form>
        {msg && <div className={styles.msg}>{msg}</div>}
      </div>
    </div>
  )
}
