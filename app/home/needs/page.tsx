'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NeedsPage() {
  const [needs, setNeeds] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', quantity: '', unit: '', priority: 'متوسطة', notes: '' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('needs').select('*').order('created_at', { ascending: false })
    if (data) setNeeds(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ name: '', quantity: '', unit: '', priority: 'متوسطة', notes: '' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('needs')
      .select('id')
      .ilike('name', form.name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.name.trim()}" موجود مسبقاً في قائمة الاحتياجات`)
      return
    }

    const payload = {
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unit: form.unit.trim() || 'وحدة',
      priority: form.priority,
      notes: form.notes || null,
      created_by: user.id
    }

    if (editing) {
      await supabase.from('needs').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('needs').insert(payload)
    }

    resetForm()
    fetchData()
  }

  const handleEdit = (need: any) => {
    setForm({
      name: need.name,
      quantity: need.quantity.toString(),
      unit: need.unit || '',
      priority: need.priority || 'متوسطة',
      notes: need.notes || ''
    })
    setEditing(need)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('needs').delete().eq('id', id)
    fetchData()
  }

  const priorityConfig: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    'عاجلة':   { color: 'text-red-600',    bg: 'bg-red-50',    dot: 'bg-red-500',    label: '🔴 عاجلة' },
    'متوسطة':  { color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-400', label: '🟠 متوسطة' },
    'منخفضة':  { color: 'text-green-600',  bg: 'bg-green-50',  dot: 'bg-green-500',  label: '🟢 منخفضة' },
  }

  const icons: Record<string, string> = {
    'كراسي': '🪑', 'طاولات': '🪵', 'أكواب': '☕', 'أطباق': '🍽️',
    'ثلاجة': '🧊', 'مكيف': '❄️', 'مروحة': '💨', 'ملابس': '👕',
    'غذاء': '🥫', 'دواء': '💊', 'حقيبة': '🎒', 'كتب': '📚',
  }
  const getIcon = (name: string) => {
    const match = Object.keys(icons).find(k => name.includes(k))
    return match ? icons[match] : '📋'
  }

  const urgentCount = needs.filter(n => n.priority === 'عاجلة').length

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-rose-800 via-rose-700 to-rose-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            رجوع
          </button>
          <h1 className="text-lg font-bold">حوجة الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* إشعار العاجل */}
        {urgentCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="font-bold text-red-700 text-sm">يوجد {urgentCount} احتياج عاجل</p>
              <p className="text-red-500 text-xs">يرجى المساهمة في تلبيتها في أقرب وقت</p>
            </div>
          </div>
        )}

        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-gradient-to-l from-rose-600 to-rose-500 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mb-4 shadow-lg shadow-rose-200 cursor-pointer hover:scale-[1.01] transition-all">
            + إضافة احتياج
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">{editing ? 'تعديل الاحتياج' : 'إضافة احتياج جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">اسم الاحتياج *</label>
                <input required value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                  placeholder="مثال: كراسي بلاستيكية"
                  className={`w-full border rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`} />
                {duplicateError && <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">الكمية المطلوبة *</label>
                  <input required type="number" min="1" value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">الوحدة</label>
                  <input value={form.unit} placeholder="قطعة / كيلو..."
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">الأولوية</label>
                <select value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer">
                  <option value="عاجلة">🔴 عاجلة</option>
                  <option value="متوسطة">🟠 متوسطة</option>
                  <option value="منخفضة">🟢 منخفضة</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">ملاحظات</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
              </div>
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 bg-rose-500 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-rose-600 transition-all">
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
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : needs.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">✅</span>
            <p className="text-gray-400">لا توجد احتياجات مسجلة حالياً</p>
          </div>
        ) : (
          <div className="space-y-3">
            {needs.map(need => {
              const pc = priorityConfig[need.priority] || priorityConfig['متوسطة']
              return (
                <div key={need.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                    {getIcon(need.name)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{need.name}</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 font-bold ${pc.bg} ${pc.color}`}>
                      {pc.label}
                    </span>
                    {need.notes && <p className="text-gray-400 text-xs mt-1">{need.notes}</p>}
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-rose-600">{Number(need.quantity).toLocaleString('ar')}</p>
                    <p className="text-xs text-gray-400">{need.unit || 'وحدة'}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleEdit(need)}
                        className="text-blue-500 text-xs underline cursor-pointer">تعديل</button>
                      <button onClick={() => handleDelete(need.id, need.name)}
                        className="text-red-400 text-xs underline cursor-pointer">حذف</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {needs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4 text-center">
            <p className="text-gray-500 text-sm">إجمالي الاحتياجات المسجلة</p>
            <p className="text-3xl font-bold text-rose-600 mt-1">{needs.length}</p>
            <p className="text-gray-400 text-xs">صنف من الاحتياجات</p>
          </div>
        )}
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}
