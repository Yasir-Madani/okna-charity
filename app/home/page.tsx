'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewsTicker from '../../components/NewsTicker'

export default function HomePage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getUser()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const name = user.email?.split('@')[0]
      setUsername(name || '')
      setIsLoggedIn(true)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUsername('')
    router.push('/home')
  }

  const buttons = [
    {
      label: 'عن الجمعية',
      icon: '🏛️',
      path: '/home/about',
      gradient: 'from-amber-500 to-amber-700',
    },
    {
      label: 'تواصل واستفسر وتبرع',
      icon: '🤝',
      path: '/home/contact',
      gradient: 'from-teal-600 to-teal-800',
    },
    {
      label: 'إحصائيات السكان',
      icon: '📊',
      path: '/public-dashboard',
      gradient: 'from-indigo-700 to-indigo-900',
    },
    {
      label: 'إحصائيات عامة',
      icon: '📈',
      path: '/home/general-stats',
      gradient: 'from-indigo-600 to-indigo-800',
    },
    {
      label: 'ممتلكات الجمعية',
      icon: '🏗️',
      path: '/home/assets',
      gradient: 'from-emerald-600 to-emerald-900',
    },
    {
      label: 'حوجة الجمعية',
      icon: '📋',
      path: '/home/needs',
      gradient: 'from-rose-500 to-rose-700',
    },
    {
      label: 'إدارة الجمعية',
      icon: '👥',
      path: '/home/members',
      gradient: 'from-purple-600 to-purple-800',
    },
    {
      label: 'أخبار الجمعية',
      icon: '📰',
      path: '/home/news',
      gradient: 'from-teal-600 to-teal-800',
    },
  ]

  return (
    <div
      className="min-h-screen bg-gray-100"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-lg mx-auto px-5 pt-3 flex justify-between items-center">
          <div className="flex items-center gap-1 bg-white bg-opacity-10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white border-opacity-20">
            {isLoggedIn ? `👤 ${username}` : '👤 زائر'}
          </div>

          {isLoggedIn && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white border-opacity-20 transition-all"
              >
                <span>🖥️</span>
                <span>إضافة</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95"
              >
                <span>🚪</span>
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto px-5 pb-5 text-center mt-2">
          <h1 className="text-lg font-bold mb-0.5">جمعية العكنة الخيرية</h1>
          <p className="text-blue-200 text-xs">بوابة المعلومات والخدمات</p>
        </div>
      </div>

      {/* شريط الأخبار */}
      <NewsTicker />

      {/* البطاقات — هامش جانبي أوسع لتضييق عرضها */}
      <div className="max-w-lg mx-auto px-6 pt-3 pb-5 space-y-3">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => router.push(btn.path)}
            className={`w-full bg-gradient-to-l ${btn.gradient} text-white rounded-2xl px-5 flex items-center gap-3 active:scale-[0.98] transition-all duration-150 cursor-pointer`}
            style={{ height: '46px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <span style={{ fontSize: '18px', lineHeight: 1 }}>{btn.icon}</span>
            <p className="text-sm font-bold text-right flex-1 truncate">{btn.label}</p>
            <span className="text-white opacity-40 text-sm leading-none flex-shrink-0">←</span>
          </button>
        ))}

        {/* زر دخول الإداريين */}
        <button
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          className="w-full bg-white border border-gray-200 text-gray-600 rounded-2xl px-5 flex items-center gap-3 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 cursor-pointer"
          style={{ height: '46px' }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>🔐</span>
          <p className="text-sm font-bold text-right flex-1">دخول الإداريين</p>
          <span className="text-gray-400 text-sm leading-none flex-shrink-0">←</span>
        </button>
      </div>

      <footer className="text-center pb-5">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  )
}
