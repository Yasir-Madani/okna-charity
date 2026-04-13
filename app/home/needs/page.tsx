'use client'
import { useRouter } from 'next/navigation'

export default function NeedsHubPage() {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex flex-col"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif", background: '#f0f4ff' }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ── */}
      <div className="bg-[#0f2a5e] px-4 pt-5 pb-10 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-4 left-20 w-16 h-16 rounded-full bg-white/5" />

        <button
          onClick={() => router.push('/home')}
          className="text-white/70 text-sm mb-6 flex items-center gap-1 hover:text-white transition-colors"
        >
          ← رجوع
        </button>

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl mx-auto mb-3">
            📋
          </div>
          <h1 className="text-white text-xl font-extrabold tracking-tight">حوجة الجمعية</h1>
          <p className="text-white/50 text-xs mt-1">اختر نوع الاحتياجات</p>
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="flex-1 px-5 -mt-5 pb-10 space-y-4">

        {/* Card 1: حوجات عامة */}
        <button
          onClick={() => router.push('/home/needs/general')}
          className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 active:scale-[0.97] transition-all duration-150 text-right"
          style={{ boxShadow: '0 4px 20px rgba(15,42,94,0.10)' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl flex-shrink-0">
            📦
          </div>
          <div className="flex-1">
            <p className="text-base font-extrabold text-gray-800">الحوجات العامة</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              احتياجات الجمعية من مواد ومستلزمات
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
            <span className="text-rose-400 text-sm">←</span>
          </div>
        </button>

        {/* Card 2: حوجات طبية */}
        <button
          onClick={() => router.push('/home/needs/medical')}
          className="w-full bg-white rounded-2xl p-5 flex items-center gap-4 active:scale-[0.97] transition-all duration-150 text-right"
          style={{ boxShadow: '0 4px 20px rgba(15,42,94,0.10)' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">
            🏥
          </div>
          <div className="flex-1">
            <p className="text-base font-extrabold text-gray-800">الحوجات الطبية</p>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">
              الاحتياجات الصحية والطبية للجمعية
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-400 text-sm">←</span>
          </div>
        </button>

      </div>

      <footer className="text-center pb-6">
        <p className="text-gray-400 text-xs">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </footer>
    </div>
  )
}
