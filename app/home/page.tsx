'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewsTicker from '../../components/NewsTicker'

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

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
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUsername('')
    router.push('/home')
  }

  const buttons = [
    { label: 'عن الجمعية',           icon: '🏛️', path: '/home/about',        iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',  bar: 'bg-amber-400',   sub: 'تعرف علينا'    },
    { label: 'تواصل وتبرع',          icon: '🤝', path: '/home/contact',       iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',   bar: 'bg-teal-400',    sub: 'ساهم معنا'     },
    { label: 'إحصائيات السكان',      icon: '📊', path: '/public-dashboard',   iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600', bar: 'bg-indigo-400',  sub: 'بيانات المجتمع' },
    { label: 'مشاريع الجمعية',       icon: '🏗️', path: '/home/projects',      iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',   bar: 'bg-blue-400',    sub: 'إنجازاتنا ومبادراتنا' },
    { label: 'ممتلكات الجمعية',      icon: '🏗️', path: '/home/assets',        iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',bar: 'bg-emerald-400', sub: 'الأصول والعقار' },
    { label: 'حوجة الجمعية',         icon: '📋', path: '/home/needs',         iconBg: 'bg-rose-50',    iconColor: 'text-rose-600',   bar: 'bg-rose-400',    sub: 'الاحتياجات'    },
    { label: 'إدارة الجمعية',        icon: '👥', path: '/home/members',       iconBg: 'bg-purple-50',  iconColor: 'text-purple-600', bar: 'bg-purple-400',  sub: 'الهيئة الإدارية'},
    { label: 'أسماء المنازل والأسر', icon: '🏘️', path: '/dashboard/overview',           iconBg: 'bg-orange-50',  iconColor: 'text-orange-600', bar: 'bg-orange-400',  sub: 'دليل الأسر والمنازل' },
  ]

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* ───── Header ───── */}
      <div className="bg-[#0f2a5e] px-4 pt-4 pb-8">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-5 min-h-[36px]">
          {!loading && (
            <>
              <div className="flex items-center gap-2 bg-white/10 border border-white/15 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                {isLoggedIn ? `${username}` : 'زائر'}
              </div>

              {isLoggedIn && (
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-1 bg-white/10 border border-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    🖥️ إضافة
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 bg-red-500/30 border border-red-400/30 text-red-200 text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    🚪 خروج
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Logo + title */}
        <div className="text-center">
          <h1 className="text-white text-xl font-extrabold mb-1 tracking-tight">
           جمعية نهضة العكنة الخيرية
          </h1>
          <p className="text-white/50 text-xs">بوابة الإحصاء والمعلومات</p>
        </div>
      </div>

      {/* ───── News Ticker ───── */}
      <NewsTicker />

      {/* ───── Cards Grid ───── */}
      <div className="px-4 pt-4 pb-4 grid grid-cols-2 gap-3">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => router.push(btn.path)}
            className="bg-white border border-gray-100 rounded-2xl p-3.5 flex flex-col items-start gap-2.5 active:scale-95 transition-all duration-150 text-right relative overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          >
            {/* colour accent bar on the right side */}
            <span className={`absolute top-0 right-0 w-1 h-full rounded-r-2xl ${btn.bar}`} />

            {/* icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${btn.iconBg}`}>
              {btn.icon}
            </div>

            {/* label */}
            <p className="text-sm font-bold text-gray-800 leading-tight pr-1">
              {btn.label}
            </p>

            {/* sub-label */}
            <p className="text-xs text-gray-600 font-medium pr-1 -mt-1">
              {btn.sub}
            </p>
          </button>
        ))}
      </div>

      {/* ───── News button ───── */}
      <div className="px-4 pb-3">
        <button
          onClick={() => router.push('/home/news')}
          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-150 relative overflow-hidden"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <span className="absolute top-0 right-0 w-1 h-full rounded-r-2xl bg-orange-400" />
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-base">
            📰
          </div>
          <div className="flex-1 text-right pr-1">
            <p className="text-sm font-bold text-gray-800">أخبار الجمعية</p>
            <p className="text-xs text-gray-400 font-medium">آخر المستجدات</p>
          </div>
          <span className="text-gray-300 text-sm">←</span>
        </button>
      </div>

      {/* ───── Admin button ───── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 flex items-center gap-3 active:scale-[0.98] transition-all duration-150"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-base">
            🔐
          </div>
          <p className="text-sm font-bold text-gray-700 flex-1 text-right">
            دخول الإداريين
          </p>
          <span className="text-gray-300 text-sm">←</span>
        </button>
      </div>

      <footer className="text-center pb-6 pt-1">
        <p className="text-black text-xs">
          جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
        </p>
      </footer>
    </div>
  )
}