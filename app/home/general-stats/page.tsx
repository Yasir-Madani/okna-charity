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
          <h1 className="text-base font-semibold tracking-wide">إحصائيات عامة</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 relative min-h-[60vh]">

        {/* شاشة التغطية */}
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
              <button
                onClick={() => router.push('/home')}
                className="w-full bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* زر إضافة */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold mb-4"
          >
            + إضافة إحصائية
          </button>
        )}

        {/* 🔥 شريط العنوان (إضافة فقط بدون تغيير التصميم) */}
        {!loading && stats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 mb-2 flex items-center">
            <div className="flex-1 text-sm font-semibold text-gray-500">الصنف</div>
            <div className="w-12 text-center text-sm font-semibold text-gray-500">العدد</div>
          </div>
        )}

        {/* البيانات */}
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{stat.name}</p>
                  {stat.notes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{stat.notes}</p>
                  )}
                </div>

                <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

                <div className="text-center flex-shrink-0 min-w-[40px]">
                  <p className="text-lg font-bold text-indigo-700 leading-tight">
                    {stat.quantity.toLocaleString('en-US')}
                  </p>
                </div>

                {isAdmin && (
                  <>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button onClick={() => handleEdit(stat)} className="text-xs text-blue-500">تعديل</button>
                      <button onClick={() => handleDelete(stat.id, stat.name)} className="text-xs text-red-400">حذف</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 🔥 الإجمالي (محاذاة تحت العدد) */}
        {stats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center gap-3">
            
            <div className="flex-1">
              <p className="text-xs text-gray-400">إجمالي الإحصائيات</p>
              <p className="text-xs text-gray-300 mt-0.5">{stats.length} صنف مسجل</p>
            </div>

            <div className="w-px h-8 bg-gray-100" />

            <div className="text-center min-w-[40px]">
              <p className="text-2xl font-bold text-indigo-700">
                {stats.reduce((sum, s) => sum + s.quantity, 0).toLocaleString('en-US')}
              </p>
            </div>

          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-6">© 2026 جمعية العكنة الخيرية</p>
      </div>
    </div>
  )
}