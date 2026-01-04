import React, { useContext, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../../App'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

export default function Login() {
  const { setToken, setUsername, setRole } = useContext(AuthContext)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError(t('errors.fillAll'))
      return
    }
    try {
      const res = await axios.post('/api/users/login', { email, password })
      setToken(res.data.token)
      setUsername(res.data.username)
      setRole(res.data.role || 'user')
      navigate('/')
    } catch (err) {
      setError(t('errors.invalidCredentials'))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2>{t('login.title')}</h2>
        <form className={styles.form} onSubmit={submit}>
          <input className={styles.input} type="email" autoComplete="email" placeholder={t('login.email')} value={email} onChange={e => setEmail(e.target.value)} />
          <input className={styles.input} type="password" autoComplete="current-password" placeholder={t('login.password')} value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.primary}>{t('login.submit')}</button>
        </form>
        <div className={styles.links}>
          <span>{t('login.noAccount')} </span>
          <Link to="/signup">{t('login.createAccount')}</Link>
          <span> · </span>
          <Link to="/reset">Forgot password?</Link>
        </div>
      </div>
      <aside className={styles.hero}>
        <h3>{t('about.title')}</h3>
        <p>{t('about.body')}</p>
        <Link to="/about" className={styles.cta}>{t('header.howItWorks')}</Link>
      </aside>
    </div>
  )
}
