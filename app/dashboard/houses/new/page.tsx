'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewHouse() {
  const [form, setForm] = useState({
    house_number: '',
    name: '',
    sector: 'شرق',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // أخبار تجريبية (يمكنك جلبها من قاعدة البيانات لاحقاً)
  const news = [
    "تم توزيع الإغاثة في حي الشرق",
    "بدء تسجيل الأسر الجديدة",
    "يرجى تحديث بيانات المنازل",
    "اجتماع اللجنة يوم الجمعة"
  ]

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // تحقق رقم المنزل
    const { data: existingByNumber } = await supabase
      .from('houses')
      .select('id')
      .eq('house_number', form.house_number)
      .eq('sector', form.sector)
      .maybeSingle()

    if (existingByNumber) {
      setError(`⚠️ رقم المنزل "${form.house_number}" موجود مسبقاً`)
      setLoading(false)
      return
    }

    // تحقق الاسم
    const { data: existingByName } = await supabase
      .from('houses')
      .select('id')
      .eq('name', form.name.trim())
      .eq('sector', form.sector)
      .maybeSingle()

    if (existingByName) {
      setError(`⚠️ اسم المنزل "${form.name}" موجود مسبقاً`)
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('houses').insert({
      house_number: form.house_number,
      name: form.name.trim(),
      sector: form.sector,
      notes: form.notes || null,
      created_by: user.id
    })

    if (insertError) {
      setError('حدث خطأ أثناء الحفظ')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100" dir="rtl">

      {/* 🔥 شريط الأخبار */}
      <div className="bg-black text-white overflow-hidden whitespace-nowrap">
        <div className="animate-marquee py-2 text-sm">
          {news.join("  •  ")}
        </div>
      </div>

      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-lg md:text-xl font-bold">إضافة منزل جديد</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm"
        >
          رجوع
        </button>
      </div>

      {/* Form */}
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="bg-white p-5 md:p-6 rounded-2xl shadow-lg">

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* رقم المنزل */}
            <input
              required
              placeholder="رقم المنزل (مثال: 12 أو A5)"
              value={form.house_number}
              onChange={e => {
                setForm({ ...form, house_number: e.target.value })
                setError('')
              }}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
            />

            {/* اسم المنزل */}
            <input
              required
              placeholder="اسم المنزل"
              value={form.name}
              onChange={e => {
                setForm({ ...form, name: e.target.value })
                setError('')
              }}
              className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
            />

            {/* المحور */}
            <select
              value={form.sector}
              onChange={e => setForm({ ...form, sector: e.target.value })}
              className="w-full p-3 border rounded-xl"
            >
              <option value="شرق">شرق</option>
              <option value="شمال">شمال</option>
              <option value="وسط">وسط</option>
              <option value="الدوراشاب">الدوراشاب</option>
            </select>

            {/* ملاحظات */}
            <textarea
              placeholder="ملاحظات"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full p-3 border rounded-xl"
              rows={3}
            />

            {/* الخطأ */}
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* أزرار */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                إلغاء
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* 🔥 CSS للحركة */}
      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 15s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}</style>

    </div>
  )
}