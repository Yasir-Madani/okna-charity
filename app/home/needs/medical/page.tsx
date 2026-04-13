'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface MedicalNeed {
  id: string
  number: number
  category: string
  description: string
  quantity: string // نص يقبل "غير محدد" وأرقام
}

export default function MedicalNeedsPage() {
  const [needs, setNeeds] = useState<MedicalNeed[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MedicalNeed | null>(null)
  const [form, setForm] = useState({ category: '', description: '', quantity: '' })
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
    loadNeeds()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
  }

  // ── تخزين محلي فقط (بدون قاعدة بيانات) ──
  const STORAGE_KEY = 'medical_needs_data'

  const loadNeeds = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setNeeds(JSON.parse(stored))
    } catch {}
  }

  const saveNeeds = (updated: MedicalNeed[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setNeeds(updated)
  }

  const resetForm = () => {
    setForm({ category: '', description: '', quantity: '' })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      const updated = needs.map(n =>
        n.id === editing.id
          ? { ...n, category: form.category.trim(), description: form.description.trim(), quantity: form.quantity.trim() }
          : n
      )
      saveNeeds(updated)
    } else {
      const newItem: MedicalNeed = {
        id: Date.now().toString(),
        number: needs.length + 1,
        category: form.category.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
      }
      const updated = [...needs, newItem]
      // إعادة ترقيم
      const reNumbered = updated.map((n, i) => ({ ...n, number: i + 1 }))
      saveNeeds(reNumbered)
    }
    resetForm()
  }

  const handleEdit = (need: MedicalNeed) => {
    setForm({ category: need.category, description: need.description, quantity: need.quantity })
    setEditing(need)
    setShowForm(true)
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    const updated = needs.filter(n => n.id !== id).map((n, i) => ({ ...n, number: i + 1 }))
    saveNeeds(updated)
  }

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* ── Header ── */}
      <div className="bg-teal-700 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home/needs')}
            className="text-sm text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            ← رجوع
          </button>
          <h1 className="text-base font-semibold tracking-wide">الحوجات الطبية</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Add Button */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            + إضافة حوجة طبية
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4">
              {editing ? '✏️ تعديل الحوجة الطبية' : '➕ إضافة حوجة طبية جديدة'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">الصنف *</label>
                <input
                  required
                  placeholder="مثال: دواء، جهاز، مستلزم..."
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">الوصف *</label>
                <input
                  required
                  placeholder="وصف تفصيلي للحوجة"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">العدد *</label>
                <input
                  required
                  placeholder='مثال: 10 أو "غير محدد"'
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-teal-800 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty State */}
        {needs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏥</p>
            <p className="text-gray-400 text-sm font-medium">لا توجد حوجات طبية مسجلة بعد</p>
            {isAdmin && (
              <p className="text-gray-300 text-xs mt-1">اضغط "إضافة حوجة طبية" للبدء</p>
            )}
          </div>
        ) : (
          <>
            {/* Column Headers */}
            <div className="grid grid-cols-12 gap-2 px-3 pb-1">
              <div className="col-span-1 text-center">
                <p className="text-xs font-bold text-gray-400">#</p>
              </div>
              <div className="col-span-4">
                <p className="text-xs font-bold text-gray-400">الصنف</p>
              </div>
              <div className="col-span-4">
                <p className="text-xs font-bold text-gray-400">الوصف</p>
              </div>
              <div className="col-span-3 text-center">
                <p className="text-xs font-bold text-gray-400">العدد</p>
              </div>
            </div>

            {/* List */}
            <div className="space-y-2">
              {needs.map(need => (
                <div
                  key={need.id}
                  className="bg-white rounded-2xl border border-gray-100 px-3 py-3.5"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    {/* Number */}
                    <div className="col-span-1 flex justify-center">
                      <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">
                        {need.number}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="col-span-4">
                      <p className="text-sm font-bold text-gray-800 leading-tight">{need.category}</p>
                    </div>

                    {/* Description */}
                    <div className="col-span-4">
                      <p className="text-xs text-gray-500 leading-tight">{need.description}</p>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-3 text-center">
                      <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {need.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex gap-3 justify-end mt-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleEdit(need)}
                        className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(need.id, need.category)}
                        className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-teal-700 rounded-2xl px-4 py-3 mt-4 flex items-center justify-between">
              <p className="text-white/80 text-xs font-medium">إجمالي الحوجات الطبية</p>
              <span className="bg-white text-teal-700 text-sm font-extrabold px-3 py-1 rounded-full">
                {needs.length} صنف
              </span>
            </div>
          </>
        )}

        <p className="text-center text-gray-300 text-xs mt-6 pb-4">
          جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
        </p>
      </div>
    </div>
  )
}
