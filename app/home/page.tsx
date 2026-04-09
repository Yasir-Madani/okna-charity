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
      shadow: 'shadow-amber-100',
    },
    {
      label: 'تواصل واستفسر وتبرع',
      icon: '🤝',
      path: '/home/contact',
      gradient: 'from-teal-600 to-teal-800',
      shadow: 'shadow-teal-100',
    },
    {
      label: 'إحصائيات السكان',
      icon: '📊',
      path: '/public-dashboard',
      gradient: 'from-indigo-700 to-indigo-900',
      shadow: 'shadow-indigo-100',
    },
    {
      label: 'إحصائيات عامة',
      icon: '📈',
      path: '/home/general-stats',
      gradient: 'from-indigo-600 to-indigo-800',
      shadow: 'shadow-indigo-100',
    },
    {
      label: 'ممتلكات الجمعية',
      icon: '🏗️',
      path: '/home/assets',
      gradient: 'from-emerald-600 to-emerald-900',
      shadow: 'shadow-emerald-100',
    },
    {
      label: 'حوجة الجمعية',
      icon: '📋',
      path: '/home/needs',
      gradient: 'from-rose-500 to-rose-700',
      shadow: 'shadow-rose-100',
    },
    {
      label: 'إدارة الجمعية',
      icon: '👥',
      path: '/home/members',
      gradient: 'from-purple-600 to-purple-800',
      shadow: 'shadow-purple-100',
    },
    {
      label: 'أخبار الجمعية',
      icon: '📰',
      path: '/home/news',
      gradient: 'from-teal-600 to-teal-800',
      shadow: 'shadow-teal-100',
    },
  ]

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-lg mx-auto px-4 pt-3 flex justify-between items-center">
          <div className="flex items-center gap-1 bg-blue-700 bg-opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white border-opacity-30">
            {isLoggedIn ? `👤 ${username}` : '👤 زائر'}
          </div>

          {isLoggedIn && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-1 bg-blue-700 bg-opacity-60 hover:bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white border-opacity-30 transition-all"
              >
                <span>🖥️</span>
                <span>إضافة</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <span>🚪</span>
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pb-6 text-center mt-3">
          <h1 className="text-xl font-bold mb-0.5">جمعية العكنة الخيرية</h1>
          <p className="text-blue-200 text-xs">بوابة المعلومات والخدمات</p>
        </div>
      </div>

      {/* شريط الأخبار */}
      <NewsTicker />

      {/* البطاقات */}
      <div className="max-w-lg mx-auto px-3 py-3 space-y-2">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => router.push(btn.path)}
            className={`w-full bg-gradient-to-l ${btn.gradient} text-white rounded-xl py-2.5 px-4 flex items-center gap-3 shadow-md ${btn.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer`}
          >
            <span className="text-2xl leading-none">{btn.icon}</span>
            <p className="text-sm font-bold text-right flex-1">{btn.label}</p>
            <span className="text-white opacity-50 text-base leading-none">←</span>
          </button>
        ))}

        {/* زر دخول الإداريين */}
        <button
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          className="w-full bg-white border border-gray-200 text-gray-600 rounded-xl py-2.5 px-4 flex items-center gap-3 hover:border-gray-300 hover:bg-gray-50 transition-all duration-150 cursor-pointer mt-1"
        >
          <span className="text-2xl leading-none">🔐</span>
          <div className="text-right flex-1">
            <p className="text-sm font-bold">دخول الإداريين</p>
            <p className="text-xs text-gray-400">للمستخدمين المصرح لهم فقط</p>
          </div>
          <span className="text-gray-400 text-base leading-none">←</span>
        </button>
      </div>

      <footer className="text-center py-4 mt-2">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  )
}
