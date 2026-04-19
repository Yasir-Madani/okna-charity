'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function GeneralNeedsPage() {
  const [stats, setStats] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', quantity: '', notes: '' })
  const [duplicateError, setDuplicateError] = useState('')
  const [reordering, setReordering] = useState(false)
  const [savedScrollY, setSavedScrollY] = useState(0)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (!loading && highlightId && cardRefs.current[highlightId]) {
      setTimeout(() => {
        cardRefs.current[highlightId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => setHighlightId(null), 2000)
      }, 100)
    }
  }, [loading, highlightId])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: visData } = await supabase
      .from('page_visibility')
      .select('is_visible')
      .eq('page_key', 'general_stats')
      .single()
    if (visData) setIsVisible(visData.is_visible)

    const { data } = await supabase
      .from('general_stats')
      .select('*')
      .order('number', { ascending: true })
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

  const moveStat = async (index: number, direction: 'up' | 'down') => {
    const newStats = [...stats]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newStats.length) return

    ;[newStats[index], newStats[swapIndex]] = [newStats[swapIndex], newStats[index]]
    const renumbered = newStats.map((item, i) => ({ ...item, number: i + 1 }))
    setStats(renumbered)

    setReordering(true)
    await Promise.all(
      renumbered.map(n =>
        supabase.from('general_stats').update({ number: n.number }).eq('id', n.id)
      )
    )
    setReordering(false)
  }

  const reorderNumbers = async (items: any[]) => {
    for (let i = 0; i < items.length; i++) {
      await supabase.from('general_stats').update({ number: i + 1 }).eq('id', items[i].id)
    }
  }

  const openAddForm = () => {
    setSavedScrollY(window.scrollY)
    setForm({ name: '', quantity: '', notes: '' })
    setEditing(null)
    setShowForm(true)
    setDuplicateError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEdit = (stat: any) => {
    setSavedScrollY(window.scrollY)
    setForm({ name: stat.name, quantity: stat.quantity.toString(), notes: stat.notes || '' })
    setEditing(stat)
    setShowForm(true)
    setDuplicateError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditing(null)
    setForm({ name: '', quantity: '', notes: '' })
    setDuplicateError('')
    setTimeout(() => {
      window.scrollTo({ top: savedScrollY, behavior: 'smooth' })
    }, 50)
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

    let savedId: string | null = null

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      notes: form.notes || null,
      created_by: user.id
    }

    if (editing) {
      await supabase.from('general_stats').update(payload).eq('id', editing.id)
      savedId = editing.id
    } else {
      const nextNumber = stats.length + 1
      const { data: inserted } = await supabase
        .from('general_stats')
        .insert({ ...payload, number: nextNumber })
        .select()
        .single()
      if (inserted) savedId = inserted.id
    }

    setShowForm(false)
    setEditing(null)
    setForm({ name: '', quantity: '', notes: '' })
    setDuplicateError('')
    if (savedId) setHighlightId(savedId)
    await fetchData()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('general_stats').delete().eq('id', id)
    const remaining = stats.filter(s => s.id !== id)
    await reorderNumbers(remaining)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ══ شاشة النموذج الكاملة ══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto" dir="rtl">
          <div className="bg-rose-600 text-white sticky top-0 z-10">
            <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <h1 className="text-base font-semibold tracking-wide">
                {editing ? 'تعديل الحوجة' : 'إضافة حوجة'}
              </h1>
              <div className="w-16" />
            </div>
          </div>

          <div className="max-w-lg mx-auto px-4 py-6">
            {editing && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
                <div>
                  <p className="text-xs text-rose-500 font-medium">تعديل الحوجة</p>
                  <p className="text-sm font-bold text-rose-900">{editing.name}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">اسم الحوجة *</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                    className={`w-full border rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
                  />
                  {duplicateError && <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">العدد *</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1.5">ملاحظات</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 text-white py-3.5 rounded-2xl text-sm font-bold cursor-pointer hover:bg-rose-700 transition-colors shadow-sm"
              >
                ✓ حفظ التغييرات
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl text-sm cursor-pointer hover:bg-gray-50 transition-colors"
              >
                إلغاء والعودة
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-rose-600 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home/needs')}
            className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
          >
            رجوع
          </button>
          <h1 className="text-base font-semibold tracking-wide">الحوجات العامة</h1>
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
              <p className="text-gray-700 text-sm leading-loose mb-5">
                يتم حالياً إدخال وتدقيق البيانات
                <br />
                ستتوفر للعرض بعد اكتمال عملية الإدخال
              </p>
              <div className="bg-rose-50 rounded-xl p-3 flex items-center gap-3 mb-5">
                <p className="text-rose-600 text-sm text-center flex-1">
                  نعتذر عن عدم توفر البيانات مؤقتاً
                </p>
              </div>
              <button
                onClick={() => router.push('/home/needs')}
                className="w-full bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-rose-700 transition-colors"
              >
                العودة للصفحة السابقة
              </button>
            </div>
          </div>
        )}

        {/* التحكم بالرؤية */}
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

        {/* زر إضافة */}
        {isAdmin && (
          <button
            onClick={openAddForm}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            + إضافة حوجة
          </button>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : stats.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">لا توجد حوجات مسجلة بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div
                key={stat.id}
                ref={el => { cardRefs.current[stat.id] = el }}
                className="bg-white rounded-xl border overflow-hidden transition-all duration-500"
                style={{
                  boxShadow: highlightId === stat.id
                    ? '0 0 0 2px #e11d48, 0 4px 16px rgba(225,29,72,0.15)'
                    : '0 1px 3px rgba(0,0,0,0.05)',
                  borderColor: highlightId === stat.id ? '#e11d48' : '#f3f4f6',
                }}
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* الاسم والملاحظات */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{stat.name}</p>
                    {stat.notes && (
                      <p className="text-xs text-gray-400 mt-0.5">{stat.notes}</p>
                    )}
                  </div>

                  {/* العدد */}
                  <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                  <div className="text-center flex-shrink-0 min-w-[40px]">
                    <p className="text-lg font-bold text-rose-600 leading-tight">
                      {stat.quantity.toLocaleString('ar-EG')}
                    </p>
                  </div>

                  {/* أزرار الترتيب + تعديل/حذف — أدمن فقط */}
                  {isAdmin && (
                    <>
                      <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                      {/* ترتيب */}
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => moveStat(index, 'up')}
                          disabled={index === 0 || reordering}
                          className={`w-6 h-6 rounded border text-[10px] flex items-center justify-center transition-colors cursor-pointer
                            ${index === 0
                              ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                              : 'border-rose-200 text-rose-400 hover:bg-rose-50'
                            }`}
                        >↑</button>
                        <button
                          onClick={() => moveStat(index, 'down')}
                          disabled={index === stats.length - 1 || reordering}
                          className={`w-6 h-6 rounded border text-[10px] flex items-center justify-center transition-colors cursor-pointer
                            ${index === stats.length - 1
                              ? 'border-gray-100 text-gray-200 cursor-not-allowed'
                              : 'border-rose-200 text-rose-400 hover:bg-rose-50'
                            }`}
                        >↓</button>
                      </div>
                      <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                      {/* تعديل / حذف */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(stat)}
                          className="text-[11px] text-blue-500 hover:text-blue-700 cursor-pointer transition-colors font-medium leading-tight"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(stat.id, stat.name)}
                          className="text-[11px] text-red-400 hover:text-red-600 cursor-pointer transition-colors font-medium leading-tight"
                        >
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-6 pb-4">
          جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
        </p>
      </div>
    </div>
  )
}
