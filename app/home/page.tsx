'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    getUser()
    fetchNews()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const name = user.email?.split('@')[0]
      setUsername(name || '')
      setIsLoggedIn(true)
    }
  }

  // جلب الأخبار من جدول news
  const fetchNews = async () => {
    const { data } = await supabase
      .from('news')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (data) setNews(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    setUsername('')
    router.push('/home')
  }

  const buttons = [
    { label: 'عن الجمعية', desc: 'تعرف على جمعية العكنة الخيرية', icon: '🏛️', path: '/home/about', gradient: 'from-amber-500 to-amber-700', shadow: 'shadow-amber-200' },
    { label: 'تواصل واستفسر وتبرع', desc: 'تواصل مع الجمعية', icon: '🤝', path: '/home/contact', gradient: 'from-teal-600 to-teal-800', shadow: 'shadow-teal-200' },
    { label: 'إحصائيات السكان', desc: 'بيانات سكانية عامة للقرية', icon: '📊', path: '/public-dashboard', gradient: 'from-indigo-700 to-indigo-900', shadow: 'shadow-indig-200' },
    { label: 'إحصائيات عامة', desc: 'أرقام وإحصائيات عامة', icon: '📈', path: '/home/general-stats', gradient: 'from-indigo-600 to-indigo-800', shadow: 'shadow-indigo-200' },
    { label: 'ممتلكات الجمعية', desc: 'قائمة ممتلكات وأصول الجمعية', icon: '🏗️', path: '/home/assets', gradient: 'from-emerald-600 to-emerald-900', shadow: 'shadow-emerald-200' },
    { label: 'حوجة الجمعية', desc: 'احتياجات الجمعية الحالية', icon: '📋', path: '/home/needs', gradient: 'from-rose-500 to-rose-700', shadow: 'shadow-rose-200' },
    { label: 'إدارة الجمعية', desc: 'أعضاء المكتب التنفيذي', icon: '👥', path: '/home/members', gradient: 'from-purple-600 to-purple-800', shadow: 'shadow-purple-200' },
    { label: 'أخبار الجمعية', desc: 'آخر الأخبار والإعلانات', icon: '📰', path: '/home/news', gradient: 'from-teal-600 to-teal-800', shadow: 'shadow-teal-200' },
  ]

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      
      {/* أنيميشن مخصص لشريط الأخبار */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marquee 30s linear infinite;
        }
      `}} />

      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white shadow-lg">
        {/* Top Bar */}
        <div className="max-w-lg mx-auto px-4 pt-4 flex justify-between items-center">
          <div className="bg-white/10 text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/20">
            {isLoggedIn ? `👤 ${username}` : '👤 زائر'}
          </div>
          {isLoggedIn && (
            <div className="flex gap-2">
              <button onClick={() => router.push('/dashboard')} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg border border-white/20 text-xs font-bold">🖥️ لوحة التحكم</button>
              <button onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 p-2 rounded-lg text-xs font-bold transition-all">🚪 خروج</button>
            </div>
          )}
        </div>

        {/* Title Section */}
        <div className="max-w-lg mx-auto px-4 pt-6 pb-4 text-center">
          <h1 className="text-2xl font-extrabold mb-1 tracking-tight">جمعية العكنة الخيرية</h1>
          <p className="text-blue-200 text-xs opacity-80">بوابة المعلومات والخدمات الرقمية</p>
        </div>

        {/* --- شريط الأخبار اللانهائي --- */}
        <div className="bg-black/20 border-y border-white/10 overflow-hidden py-2 relative">
          <div className="animate-marquee flex flex-row-reverse items-center gap-8 px-4">
            {/* نكرر المحتوى مرتين لضمان استمرارية الحركة دون انقطاع */}
            {[...news, ...news].map((item, index) => (
              <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-blue-300">✦</span>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            ))}
            {/* في حال كانت القائمة فارغة */}
            {news.length === 0 && (
              <p className="text-xs opacity-50">لا توجد أخبار عاجلة حالياً...</p>
            )}
          </div>
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={() => router.push(btn.path)}
            className={`w-full bg-gradient-to-l ${btn.gradient} text-white rounded-2xl p-5 flex items-center gap-4 shadow-xl ${btn.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer border-r-4 border-white/20`}
          >
            <span className="text-4xl filter drop-shadow-md">{btn.icon}</span>
            <div className="text-right">
              <p className="text-lg font-bold leading-tight">{btn.label}</p>
              <p className="text-sm opacity-80 mt-1">{btn.desc}</p>
            </div>
            <span className="mr-auto text-white/40 text-xl font-light">←</span>
          </button>
        ))}

        <button
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/login')}
          className="w-full bg-white border border-gray-200 text-gray-600 rounded-2xl p-4 flex items-center gap-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer mt-4 shadow-sm"
        >
          <span className="text-2xl">🔐</span>
          <div className="text-right flex-1">
            <p className="text-sm font-bold">دخول الإداريين</p>
            <p className="text-[10px] text-gray-400">نظام إدارة البيانات الموحد</p>
          </div>
          <span className="text-gray-300 text-lg">←</span>
        </button>
      </div>

      <footer className="text-center py-8 opacity-40">
        <p className="text-[10px]">© 2026 جمعية العكنة الخيرية — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  )
}