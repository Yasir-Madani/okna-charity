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
  const [duplicateError, setDuplicateError] = useState('')
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
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('assets')
      .select('id')
      .ilike('name', form.name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.name.trim()}" موجود مسبقاً في قائمة الممتلكات`)
      return
    }

    const payload = {
      name: form.name.trim(),
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
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('assets').delete().eq('id', id)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-orange-700 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ← رجوع
          </button>
          <h1 className="text-base font-semibold tracking-wide">ممتلكات الجمعية</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Add Button */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-orange-700 hover:bg-orange-800 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            + إضافة ممتلك
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editing ? 'تعديل الممتلك' : 'إضافة ممتلك جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم الممتلك *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                  placeholder="مثال: كراسي"
                  className={`w-full border rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
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
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                <input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-orange-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-orange-800 transition-colors"
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
            <div className="w-7 h-7 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">📦</p>
            <p className="text-gray-400 text-sm">لا توجد ممتلكات مسجلة بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {assets.map(asset => (
              <div
                key={asset.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                {/* Name & Notes */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{asset.name}</p>
                  {asset.notes && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{asset.notes}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-100 flex-shrink-0" />

                {/* Quantity */}
                <div className="text-center flex-shrink-0 min-w-[40px]">
                  <p className="text-lg font-bold text-orange-700 leading-tight">
                    {asset.quantity.toLocaleString('ar-EG')}
                  </p>
                  <p className="text-xs text-gray-400">وحدة</p>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id, asset.name)}
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
        {assets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">إجمالي الممتلكات</p>
              <p className="text-xs text-gray-300 mt-0.5">{assets.length} صنف مسجل</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {assets.reduce((sum, a) => sum + a.quantity, 0).toLocaleString('ar-EG')}
            </p>
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-6">© 2026 جمعية العكنة الخيرية</p>
      </div>
    </div>
  )
}