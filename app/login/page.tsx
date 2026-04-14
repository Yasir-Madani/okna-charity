'use client'
import { useState } from 'react'
import { supabase } from '.././lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #0f2a5e 0%, #0f4c75 40%, #0f766e 100%)',
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-120px', right: '-120px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', left: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(15,118,110,0.25)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '10%',
          width: '180px', height: '180px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        {/* خطوط شبكية خفيفة */}
        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* البطاقة الرئيسية */}
      <div
        className="relative w-full mx-4"
        style={{
          maxWidth: '420px',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* شريط علوي ملون */}
        <div style={{
          height: '5px',
          background: 'linear-gradient(90deg, #0f2a5e, #0f766e)',
        }} />

        <div className="px-8 pt-7 pb-8">

          {/* زر الرجوع */}
          <button
            onClick={() => router.push('/home')}
            className="flex items-center gap-1.5 mb-6 group"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 10px 6px 6px',
              borderRadius: '10px',
              transition: 'background 0.2s',
              color: '#64748b',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f766e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" transform="scale(-1,1) translate(-24,0)" />
            </svg>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f766e' }}>رجوع</span>
          </button>

          {/* الشعار والعنوان */}
          <div className="text-center mb-8">
            <div
              className="mx-auto mb-4 flex items-center justify-center"
              style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: 'linear-gradient(135deg, #0f2a5e, #0f766e)',
                boxShadow: '0 8px 24px rgba(15,42,94,0.3)',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12h6v10" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f2a5e', marginBottom: '4px' }}>
              جمعية نهضة العكنة الخيرية
            </h1>
            <p style={{ fontSize: '12.5px', color: '#141618', fontWeight: '500' }}>
              نظام الإحصاء السكاني والاشتراكات
            </p>
          </div>

          {/* الفاصل */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
            marginBottom: '28px',
          }} />

          {/* النموذج */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* البريد الإلكتروني */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '7px' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="example@email.com"
                  style={{
                    width: '100%', padding: '12px 42px 12px 14px',
                    border: '1.5px solid #e2e8f0', borderRadius: '14px',
                    fontSize: '13.5px', textAlign: 'right', outline: 'none',
                    color: '#1e293b', background: '#f8fafc',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0f766e'
                    e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.1)'
                    e.target.style.background = '#fff'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = '#f8fafc'
                  }}
                />
                <span style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '7px' }}>
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '12px 42px 12px 42px',
                    border: '1.5px solid #e2e8f0', borderRadius: '14px',
                    fontSize: '13.5px', textAlign: 'right', outline: 'none',
                    color: '#1e293b', background: '#f8fafc',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#0f766e'
                    e.target.style.boxShadow = '0 0 0 3px rgba(15,118,110,0.1)'
                    e.target.style.background = '#fff'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#e2e8f0'
                    e.target.style.boxShadow = 'none'
                    e.target.style.background = '#f8fafc'
                  }}
                />
                <span style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', left: '13px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: '0',
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '12px', padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: '500', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f2a5e, #0f766e)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontSize: '14px', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px',
                boxShadow: loading ? 'none' : '0 8px 20px rgba(15,118,110,0.35)',
                transition: 'opacity 0.2s, transform 0.1s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.92' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  جاري تسجيل الدخول...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>

          {/* التذييل */}
          <p style={{
            textAlign: 'center', marginTop: '24px',
            fontSize: '11px', color: '#1b232c', fontWeight: '400',
          }}>
            جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
