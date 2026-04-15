'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RootPage() {
  const router = useRouter()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // البدء في التلاشي قبل الانتقال بنصف ثانية
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500)
    // الانتقال للصفحة الرئيسية
    const navTimer = setTimeout(() => router.push('/home'), 3000)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [router])

  return (
    <div
      style={{
        transition: 'opacity 0.5s ease',
        opacity: fadeOut ? 0 : 1,
      }}
      className="flex flex-col items-center justify-center min-h-screen bg-white font-sans"
    >
      <div className="flex flex-col items-center gap-4">
        {/* النص فوق شريط التحميل */}
        <p className="text-gray-600 text-lg font-medium animate-pulse">
          جاري تحميل البيانات...
        </p>

        {/* شريط التحميل */}
        <div className="w-56 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-sm">
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: '#14b464',
              animation: 'loading 2.5s ease-in-out forwards',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes loading {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}