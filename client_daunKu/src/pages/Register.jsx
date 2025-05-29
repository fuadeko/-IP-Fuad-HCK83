import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../store/slices/authSlice'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      alert('Password tidak cocok')
      return
    }

    const { confirmPassword, ...registerData } = formData
    const result = await dispatch(registerUser(registerData))
    
    if (result.type === 'auth/register/fulfilled') {
      alert('Registrasi berhasil! Silakan login.')
      navigate('/login')
    }
  }

  return (
    <div className="register-container">
      <div className="register-background">
        <div className="register-pattern"></div>
      </div>
      
      <div className="register-card">
        <div className="register-header">
          <div className="register-icon">
            🌱
          </div>
          <h2 className="register-title">Bergabung dengan DaunKu</h2>
          <p className="register-subtitle">
            Buat akun untuk mulai mengelola tanaman Anda
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                name="userName"
                type="text"
                required
                className="form-input"
                placeholder="Nama Pengguna"
                value={formData.userName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                name="email"
                type="email"
                required
                className="form-input"
                placeholder="Alamat Email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                name="password"
                type="password"
                required
                className="form-input"
                placeholder="Kata Sandi"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-container">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="form-input"
                placeholder="Konfirmasi Kata Sandi"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Membuat akun...
              </>
            ) : (
              'Daftar'
            )}
          </button>

          <div className="login-link">
            <p>
              Sudah punya akun?{' '}
              <Link to="/login" className="login-link-text">
                Masuk di sini
              </Link>
            </p>
          </div>
        </form>

        <div className="register-footer">
          <p>© 2024 DaunKu - Platform Manajemen Tanaman</p>
        </div>
      </div>
    </div>
  )
}

export default Register