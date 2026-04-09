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
      setDuplicateError(`"${form.name.trim()}" موجود مسبقاً`)
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

  const total = stats.reduce((sum, s) => sum + s.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>

      {/* Header */}
      <div className="bg-indigo-700 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button onClick={() => router.push('/home')} className="text-sm text-white/80">
            ← رجوع
          </button>
          <h1 className="text-base font-semibold">إحصائيات عامة</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Add Button */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-indigo-700 text-white rounded-xl py-3 text-sm font-semibold mb-4"
          >
            + إضافة إحصائية
          </button>
        )}

        {/* Header Row */}
        {stats.length > 0 && (
          <div className="bg-gray-100 rounded-xl px-4 py-2 flex items-center text-xs text-gray-500 font-semibold">
            <div className="flex-1 text-right">الصنف</div>
            <div className="w-16 text-center">العدد</div>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2 mt-2">
          {stats.map(stat => (
            <div key={stat.id} className="bg-white rounded-xl border px-4 py-3 flex items-center">

              {/* Name */}
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold text-gray-800">{stat.name}</p>
              </div>

              {/* Quantity */}
              <div className="w-16 text-center">
                <p className="text-lg font-bold text-indigo-700">
                  {stat.quantity.toLocaleString('en-US')}
                </p>
              </div>

              {/* Admin */}
              {isAdmin && (
                <div className="flex gap-2 mr-2">
                  <button onClick={() => handleEdit(stat)} className="text-xs text-blue-500">
                    تعديل
                  </button>
                  <button onClick={() => handleDelete(stat.id, stat.name)} className="text-xs text-red-500">
                    حذف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary تحت العدد */}
        {stats.length > 0 && (
          <div className="bg-white rounded-xl border px-4 py-3 mt-3 flex items-center">

            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400">الإجمالي</p>
            </div>

            <div className="w-16 text-center">
              <p className="text-xl font-bold text-indigo-700">
                {total.toLocaleString('en-US')}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}