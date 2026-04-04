'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
      desc: 'تعرف على جمعية العكنة الخيرية',
      icon: '🏛️',
      path: '/home/about',
      gradient: 'from-blue-600 to-blue-800',
      shadow: 'shadow-blue-200',
    },
    {
      label: 'إحصائيات السكان',
      desc: 'بيانات سكانية عامة للقرية',
      icon: '📊',
      path: '/public-dashboard',
      gradient: 'from-green-600 to-green-800',
      shadow: 'shadow-green-200',
    },
    {
      label: 'ممتلكات الجمعية',
      desc: 'قائمة ممتلكات وأصول الجمعية',
      icon: '🏗️',
      path: '/home/assets',
      gradient: 'from-orange-500 to-orange-700',
      shadow: 'shadow-orange-200',
    },
    {
      label: 'إدارة الجمعية',
      desc: 'أعضاء المكتب التنفيذي',
      icon: '👥',
      path: '/home/members',
      gradient: 'from-purple-600 to-purple-800',
      shadow: 'shadow-purple-200',
    },
    {
      label: 'أخبار الجمعية',
      desc: 'آخر الأخبار والإعلانات',
      icon: '📰',
      path: '/home/news',
      gradient: 'from-teal-600 to-teal-800',
      shadow: 'shadow-teal-200',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white">
        
        <div className="max-w-lg mx-auto px-4 pt-4 flex justify-between items-center">
          {/* اسم المستخدم */}
          <div className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl border border-white border-opacity-40">
  {isLoggedIn ? `👤 ${username}` : '👤 زائر'}
</div>

          {/* أزرار Dashboard و Logout للمستخدم المصرح له فقط */}
          {isLoggedIn && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
               className="flex items-center gap-1 bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-xl border border-white border-opacity-40 ..."
              >
                <span>🖥️</span>
                <span>لوحة التحكم</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-md"
              >
                <span>🚪</span>
                <span>خروج</span>
              </button>
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pb-10 text-center mt-4">
          <h1 className="text-2xl font-bold mb-1">جمعية العكنة الخيرية</h1>
          <p className="text-blue-200 text-sm">بوابة المعلومات والخدمات</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => router.push(btn.path)}
            className={`w-full bg-gradient-to-l ${btn.gradient} text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg ${btn.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer`}
          >
            <span className="text-4xl">{btn.icon}</span>
            <div className="text-right">
              <p className="text-lg font-bold">{btn.label}</p>
              <p className="text-sm opacity-80">{btn.desc}</p>
            </div>
            <span className="mr-auto text-white opacity-60 text-xl">←</span>
          </button>
        ))}

        <button
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          className="w-full bg-white border-2 border-gray-200 text-gray-600 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 cursor-pointer mt-2"
        >
          <span className="text-3xl">🔐</span>
          <div className="text-right">
            <p className="text-base font-bold">دخول الإداريين</p>
            <p className="text-xs text-gray-400">للمستخدمين المصرح لهم فقط</p>
          </div>
          <span className="mr-auto text-gray-400 text-xl">←</span>
        </button>
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  )
}