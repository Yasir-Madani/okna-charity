'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function GeneralStatsPage() {
  const [stats, setStats] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', quantity: '', notes: '' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: visData } = await supabase
      .from('page_visibility')
      .select('is_visible')
      .eq('page_key', 'general_stats')
      .single()
    if (visData) setIsVisible(visData.is_visible)

    const { data } = await supabase.from('general_stats').select('*').order('name')
    if (data) setStats(data)
    setLoading(false)
  }

  const toggleVisibility = async () => {
    setTogglingVisibility(true)
    const newVal = !isVisible
    await supabase
      .from('page_visibility')
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq('page_key', 'general_stats')
    setIsVisible(newVal)
    setTogglingVisibility(false)
  }

  const resetForm = () => {
    setForm({ name: '', quantity: '', notes: '' })
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
      .ilike('name', form.name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.name.trim()}" موجود مسبقاً في قائمة الإحصائيات`)
      return
    }

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
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
    setForm({ name: stat.name, quantity: stat.quantity.toString(), notes: stat.notes || '' })
    setEditing(stat)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('general_stats').delete().eq('id', id)
    fetchData()
  }

  const icons: Record<string, string> = {
    'كراسي': '🪑', 'طاولات': '🪵', 'طرابيز': '🪵',
    'أكواب': '☕', 'أطباق': '🍽️', 'ثلاجة': '🧊',
    'مكيف': '❄️', 'مروحة': '💨', 'ستائر': '🪟',
  }

  const getIcon = (name: string) => {
    const match = Object.keys(icons).find(k => name.includes(k))
    return match ? icons[match] : '📊'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-indigo-700 via-indigo-600 to-indigo-500 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            رجوع
          </button>
          <h1 className="text-lg font-bold">إحصائيات عامة</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 relative min-h-[60vh]">

        {/* ===== شاشة التغطية للزائر ===== */}
        {!loading && !isAdmin && !isVisible && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-6 px-0">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm rounded-2xl"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl border border-indigo-100 p-8 text-center w-full">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">🔄</div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">البيانات قيد الإدخال</h2>
              <p className="text-gray-500 text-sm leading-loose mb-6">
                يتم حالياً إدخال وتدقيق البيانات الإحصائية
                <br />
                ستتوفر هذه الإحصائيات للعرض بعد اكتمال عملية الحصر
              </p>
              <div className="bg-indigo-50 rounded-2xl p-4 flex items-center gap-3 mb-5">
                <span className="text-2xl">⏳</span>
                <p className="text-indigo-700 text-sm font-bold text-right flex-1">
                  نعتذر عن عدم توفر البيانات مؤقتاً
                </p>
              </div>
              <button onClick={() => router.push('/home')}
                className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-all">
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        )}
        {/* ===== نهاية شاشة التغطية ===== */}

        {/* زر التحكم بالرؤية — للمستخدم فقط */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4">
            <div>
              <p className="font-bold text-gray-700 text-sm">حالة الصفحة للزوار</p>
              <p className={`text-xs mt-0.5 font-bold ${isVisible ? 'text-green-600' : 'text-red-500'}`}>
                {isVisible ? '✅ مرئية للزوار' : '🔒 مخفية — تغطية نشطة'}
              </p>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${
                isVisible
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {togglingVisibility ? '...' : isVisible ? '🔒 إخفاء الصفحة' : '🔓 إظهار الصفحة'}
            </button>
          </div>
        )}

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
                <label className="text-sm text-gray-600 block mb-1">اسم الإحصائية *</label>
                <input required value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                  placeholder="مثال: عدد الأسر المستفيدة"
                  className={`w-full border rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`} />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    ⚠️ {duplicateError}
                  </p>
                )}
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">العدد *</label>
                <input required type="number" min="0" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
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
          <div className="space-y-3">
            {stats.map(stat => (
              <div key={stat.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {getIcon(stat.name)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{stat.name}</p>
                  {stat.notes && <p className="text-gray-400 text-xs">{stat.notes}</p>}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{stat.quantity.toLocaleString('ar')}</p>
                  <p className="text-xs text-gray-400">وحدة</p>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEdit(stat)}
                      className="text-blue-500 text-xs underline cursor-pointer">تعديل</button>
                    <button onClick={() => handleDelete(stat.id, stat.name)}
                      className="text-red-400 text-xs underline cursor-pointer">حذف</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4 text-center">
          <p className="text-gray-500 text-sm">إجمالي الإحصائيات المسجلة</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">
            {stats.reduce((sum, s) => sum + s.quantity, 0).toLocaleString('ar')}
          </p>
          <p className="text-gray-400 text-xs">وحدة في {stats.length} صنف</p>
        </div>
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}
