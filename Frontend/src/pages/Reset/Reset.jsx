import React, { useState } from 'react'
import axios from 'axios'
import styles from './Reset.module.css'

export default function Reset() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState('')
  const submit = async e => {
    e.preventDefault()
    setMsg('')
    try {
      const res = await axios.post('http://127.0.0.1:5503/api/users/requestReset', { email })
      setMsg(res.data.msg || 'If the account exists, a reset link was sent')
    } catch (err) {
      setMsg('Something went wrong')
    }
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h2>Reset Password</h2>
        <form className={styles.form} onSubmit={submit}>
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <button className={styles.primary}>Send Reset</button>
        </form>
        {msg && <div className={styles.msg}>{msg}</div>}
      </div>
    </div>
  )
}
