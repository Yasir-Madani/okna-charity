'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function RootPage() {
  const router = useRouter()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // بعد 2.5 ثانية ابدأ تأثير التلاشي
    const fadeTimer = setTimeout(() => setFadeOut(true), 2500)
    // بعد 3 ثوانٍ انتقل للصفحة الرئيسية
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
      className="
        flex flex-col items-center justify-center
        min-h-screen bg-white gap-8
      "
    >
      {/* الشعار */}
      <div className="animate-bounce-slow">
        <Image
          src="/logo.jpg"
          alt="شعار الجمعية"
          width={150}
          height={150}
          className="rounded-3xl shadow-lg"
          priority
        />
      </div>

      {/* اسم الجمعية */}
      <div className="text-center px-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#8B1A6B', fontFamily: 'Arial, sans-serif' }}
        >
          جمعية نهضة العكنة الخيرية
        </h1>
        <p className="text-gray-500 text-base">
          نظام الإحصاء السكاني والاشتراكات
        </p>
      </div>

      {/* شريط تحميل */}
      <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: '#14b464',
            animation: 'loading 2.5s ease-in-out forwards',
          }}
        />
      </div>

      <style jsx>{`
        @keyframes loading {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}