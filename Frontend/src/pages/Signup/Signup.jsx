import React, { useContext, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../App'
import styles from './Signup.module.css'

export default function Signup() {
  const navigate = useNavigate()
  const { setToken, setUsername } = useContext(AuthContext)
  const { t } = useTranslation()
  const [form, setForm] = useState({ email: '', first_name: '', last_name: '', username: '', password: '' })
  const [error, setError] = useState('')

  const change = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    const { email, first_name, last_name, username, password } = form
    if (!email || !first_name || !last_name || !username || !password) {
      setError(t('errors.fillAll'))
      
      return
    }
    try {
      if (password.length < 8) {
        setError(t('errors.passwordLength'))
        return
      }
      await axios.post('/api/users/register', form)
      const res = await axios.post('/api/users/login', { email, password })
      setToken(res.data.token)
      setUsername(res.data.username)
      navigate('/')
    } catch (err) {
      setError(t('errors.registrationFailed'))
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h2>{t('signup.title')}</h2>
        <form className={styles.form} onSubmit={submit}>
          <input className={styles.input} name="email" type="email" autoComplete="email" placeholder={t('signup.email')} value={form.email} onChange={change} />
          <input className={styles.input} name="first_name" autoComplete="given-name" placeholder={t('signup.firstName')} value={form.first_name} onChange={change} />
          <input className={styles.input} name="last_name" autoComplete="family-name" placeholder={t('signup.lastName')} value={form.last_name} onChange={change} />
          <input className={styles.input} name="username" autoComplete="username" placeholder={t('signup.username')} value={form.username} onChange={change} />
          <input className={styles.input} name="password" type="password" autoComplete="new-password" placeholder={t('signup.password')} value={form.password} onChange={change} />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.primary}>{t('signup.agreeJoin')}</button>
        </form>
        <div className={styles.links}>
          <span>{t('signup.haveAccount')} </span>
          <Link to="/login">{t('signup.signIn')}</Link>
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
