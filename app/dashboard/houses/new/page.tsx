'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewHouse() {
  const [form, setForm] = useState({ name: '', sector: 'شرق', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('houses').insert({
      name: form.name,
      sector: form.sector,
      notes: form.notes || null,
      created_by: user.id
    })

    if (error) {
      setError('حدث خطأ أثناء الحفظ')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">إضافة منزل جديد</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-green-600 px-3 py-1 rounded text-sm cursor-pointer"
        >
          رجوع
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm">اسم المنزل *</label>
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg p-3 text-right"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 text-sm">المحور *</label>
              <select
                value={form.sector}
                onChange={e => setForm({ ...form, sector: e.target.value })}
                className="w-full border rounded-lg p-3 text-right cursor-pointer"
              >
                <option value="شرق">شرق</option>
                <option value="شمال">شمال</option>
                <option value="وسط">وسط</option>
                <option value="الدوراشاب">الدوراشاب</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 text-sm">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full border rounded-lg p-3 text-right"
                rows={3}
              />
            </div>

            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold cursor-pointer hover:bg-green-700"
              >
                {loading ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-gray-200 py-3 rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}