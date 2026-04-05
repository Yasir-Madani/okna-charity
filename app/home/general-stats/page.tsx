'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function GeneralStatsPage() {
  const [stats, setStats] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ label: '', value: '', unit: '', icon: '', notes: '' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('general_stats').select('*').order('created_at', { ascending: true })
    if (data) setStats(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ label: '', value: '', unit: '', icon: '', notes: '' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('general_stats')
      .select('id')
      .ilike('label', form.label.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.label.trim()}" موجود مسبقاً في الإحصائيات`)
      return
    }

    const payload = {
      label: form.label.trim(),
      value: form.value.trim(),
      unit: form.unit.trim() || null,
      icon: form.icon.trim() || '📊',
      notes: form.notes || null,
      created_by: user.id
    }

    if (editing) {
      await supabase.from('general_stats').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('general_stats').insert(payload)
    }

    resetForm()
    fetchData()
  }

  const handleEdit = (stat: any) => {
    setForm({
      label: stat.label,
      value: stat.value,
      unit: stat.unit || '',
      icon: stat.icon || '',
      notes: stat.notes || ''
    })
    setEditing(stat)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${label}"؟`)) return
    await supabase.from('general_stats').delete().eq('id', id)
    fetchData()
  }

  const colorPalette = [
    { bg: 'bg-blue-50',   text: 'text-blue-700',   num: 'text-blue-600',   icon_bg: 'bg-blue-100' },
    { bg: 'bg-green-50',  text: 'text-green-700',  num: 'text-green-600',  icon_bg: 'bg-green-100' },
    { bg: 'bg-purple-50', text: 'text-purple-700', num: 'text-purple-600', icon_bg: 'bg-purple-100' },
    { bg: 'bg-orange-50', text: 'text-orange-700', num: 'text-orange-600', icon_bg: 'bg-orange-100' },
    { bg: 'bg-teal-50',   text: 'text-teal-700',   num: 'text-teal-600',   icon_bg: 'bg-teal-100' },
    { bg: 'bg-rose-50',   text: 'text-rose-700',   num: 'text-rose-600',   icon_bg: 'bg-rose-100' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-indigo-800 via-indigo-700 to-indigo-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            رجوع
          </button>
          <h1 className="text-lg font-bold">إحصائيات عامة</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-gradient-to-l from-indigo-600 to-indigo-500 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mb-4 shadow-lg shadow-indigo-200 cursor-pointer hover:scale-[1.01] transition-all">
            + إضافة إحصائية
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">{editing ? 'تعديل الإحصائية' : 'إضافة إحصائية جديدة'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">العنوان *</label>
                <input required value={form.label}
                  onChange={e => { setForm({ ...form, label: e.target.value }); setDuplicateError('') }}
                  placeholder="مثال: عدد الأسر المستفيدة"
                  className={`w-full border rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`} />
                {duplicateError && <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">القيمة *</label>
                  <input required value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder="مثال: 250"
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">الوحدة</label>
                  <input value={form.unit} placeholder="أسرة / شخص..."
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">الأيقونة (إيموجي)</label>
                <input value={form.icon} placeholder="مثال: 👨‍👩‍👧"
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">ملاحظات</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
              </div>
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-indigo-600 transition-all">
                  حفظ
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📊</span>
            <p className="text-gray-400">لا توجد إحصائيات مسجلة بعد</p>
          </div>
        ) : (
          <>
            {/* عرض شبكي للإحصائيات */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {stats.map((stat, i) => {
                const palette = colorPalette[i % colorPalette.length]
                return (
                  <div key={stat.id}
                    className={`${palette.bg} rounded-2xl p-4 border border-white shadow-sm relative`}>
                    {isAdmin && (
                      <div className="absolute top-2 left-2 flex gap-2">
                        <button onClick={() => handleEdit(stat)} className="text-blue-500 text-xs underline cursor-pointer">تعديل</button>
                        <button onClick={() => handleDelete(stat.id, stat.label)} className="text-red-400 text-xs underline cursor-pointer">حذف</button>
                      </div>
                    )}
                    <div className={`w-10 h-10 ${palette.icon_bg} rounded-xl flex items-center justify-center text-xl mb-3`}>
                      {stat.icon || '📊'}
                    </div>
                    <p className={`text-3xl font-bold ${palette.num}`}>
                      {stat.value}
                    </p>
                    {stat.unit && <p className={`text-xs ${palette.text} opacity-70`}>{stat.unit}</p>}
                    <p className={`text-sm font-bold ${palette.text} mt-1`}>{stat.label}</p>
                    {stat.notes && <p className="text-xs text-gray-400 mt-1">{stat.notes}</p>}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}
