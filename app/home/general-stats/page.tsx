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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-indigo-700 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ← رجوع
          </button>

          <p className="text-[10px] text-red-800 font-medium mb-2 pr-1">
    ⚠️ تنبيه: البيانات لا تزال قيد الحصر والإدخال
  </p>
          <h1 className="text-base font-semibold tracking-wide">إحصائيات عامة</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 relative min-h-[60vh]">

        {/* شاشة التغطية للزائر */}
        {!loading && !isAdmin && !isVisible && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-6 px-0">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm rounded-2xl" />
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 text-center w-full shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-2">البيانات قيد الإدخال</h2>
              <p className="text-gray-400 text-sm leading-loose mb-5">
                يتم حالياً إدخال وتدقيق البيانات الإحصائية
                <br />
                ستتوفر للعرض بعد اكتمال عملية الحصر
              </p>
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3 mb-5">
                <p className="text-indigo-600 text-sm text-right flex-1">
                  نعتذر عن عدم توفر البيانات مؤقتاً
                </p>
              </div>
              <button
                onClick={() => router.push('/home')}
                className="w-full bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-indigo-800 transition-colors"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* التحكم بالرؤية — للأدمن فقط */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">حالة الصفحة للزوار</p>
              <p className={`text-xs mt-0.5 font-medium ${isVisible ? 'text-green-600' : 'text-red-500'}`}>
                {isVisible ? '✅ مرئية للزوار' : '🔒 مخفية — تغطية نشطة'}
              </p>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isVisible
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {togglingVisibility ? '...' : isVisible ? '🔒 إخفاء' : '🔓 إظهار'}
            </button>
          </div>
        )}

        {/* Add Button */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            + إضافة إحصائية
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editing ? 'تعديل الإحصائية' : 'إضافة إحصائية جديدة'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم الإحصائية *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                  className={`w-full border rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">العدد *</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-800 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">📊</p>
            <p className="text-gray-400 text-sm">لا توجد إحصائيات مسجلة بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map(stat => (
              <div
                key={stat.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                {/* Name & Notes */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{stat.name}</p>
                  {stat.notes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{stat.notes}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

                {/* Quantity */}
                <div className="text-center flex-shrink-0 min-w-[40px]">
                  <p className="text-lg font-bold text-indigo-700 leading-tight">
                    {stat.quantity.toLocaleString('en-US')}
                  </p>
                
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(stat)}
                        className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(stat.id, stat.name)}
                        className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {stats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">إجمالي الإحصائيات</p>
              <p className="text-xs text-gray-300 mt-0.5">{stats.length} صنف مسجل</p>
            </div>
            <p className="text-2xl font-bold text-indigo-700">
              {stats.reduce((sum, s) => sum + s.quantity, 0).toLocaleString('ar-EG')}
            </p>
          </div>
        )}

        <p className="text-center text-black-300 text-xs mt-6">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </div>
    </div>
  )
}