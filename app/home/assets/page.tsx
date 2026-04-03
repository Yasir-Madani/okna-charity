'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', quantity: '', notes: '' })
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('assets').select('*').order('name')
    if (data) setAssets(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ name: '', quantity: '', notes: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = {
      name: form.name,
      quantity: Number(form.quantity),
      notes: form.notes || null,
      created_by: user.id
    }
    if (editing) {
      await supabase.from('assets').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('assets').insert(payload)
    }
    resetForm()
    fetchData()
  }

  const handleEdit = (asset: any) => {
    setForm({ name: asset.name, quantity: asset.quantity.toString(), notes: asset.notes || '' })
    setEditing(asset)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('assets').delete().eq('id', id)
    fetchData()
  }

  const icons: Record<string, string> = {
    'كراسي': '🪑', 'طاولات': '🪵', 'طرابيز': '🪵',
    'أكواب': '☕', 'أطباق': '🍽️', 'ثلاجة': '🧊',
    'مكيف': '❄️', 'مروحة': '💨', 'ستائر': '🪟',
  }

  const getIcon = (name: string) => {
    const match = Object.keys(icons).find(k => name.includes(k))
    return match ? icons[match] : '📦'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-orange-700 via-orange-600 to-orange-500 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
             رجوع
          </button>
          <h1 className="text-lg font-bold">ممتلكات الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-gradient-to-l from-orange-600 to-orange-500 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mb-4 shadow-lg shadow-orange-200 cursor-pointer hover:scale-[1.01] transition-all">
            + إضافة ممتلك
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">{editing ? 'تعديل الممتلك' : 'إضافة ممتلك جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">اسم الممتلك *</label>
                <input required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: كراسي"
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">العدد *</label>
                <input required type="number" min="0" value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">ملاحظات</label>
                <input value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-orange-600 transition-all">
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
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📦</span>
            <p className="text-gray-400">لا توجد ممتلكات مسجلة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map(asset => (
              <div key={asset.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                  {getIcon(asset.name)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{asset.name}</p>
                  {asset.notes && <p className="text-gray-400 text-xs">{asset.notes}</p>}
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{asset.quantity.toLocaleString('ar')}</p>
                  <p className="text-xs text-gray-400">وحدة</p>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleEdit(asset)}
                      className="text-blue-500 text-xs underline cursor-pointer">تعديل</button>
                    <button onClick={() => handleDelete(asset.id, asset.name)}
                      className="text-red-400 text-xs underline cursor-pointer">حذف</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mt-4 text-center">
          <p className="text-gray-500 text-sm">إجمالي الممتلكات المسجلة</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">
            {assets.reduce((sum, a) => sum + a.quantity, 0).toLocaleString('ar')}
          </p>
          <p className="text-gray-400 text-xs">وحدة في {assets.length} صنف</p>
        </div>
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}