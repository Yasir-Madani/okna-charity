'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', role: '', phone: '', sort_order: '0' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('members').select('*').order('sort_order')
    if (data) setMembers(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ full_name: '', role: '', phone: '', sort_order: '0' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .ilike('full_name', form.full_name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.full_name.trim()}" موجود مسبقاً`)
      return
    }

    const payload = {
      full_name: form.full_name.trim(),
      role: form.role,
      phone: form.phone || null,
      sort_order: Number(form.sort_order),
      created_by: user.id
    }

    if (editing) {
      await supabase.from('members').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('members').insert(payload)
    }

    resetForm()
    fetchData()
  }

  const handleEdit = (member: any) => {
    setForm({
      full_name: member.full_name,
      role: member.role,
      phone: member.phone || '',
      sort_order: member.sort_order?.toString() || '0'
    })
    setEditing(member)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('members').delete().eq('id', id)
    fetchData()
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-indigo-700 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-white/80 hover:text-white"
          >
            ← رجوع
          </button>
          <h1 className="text-base font-semibold">أعضاء الجمعية</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Add Button */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl py-3 text-sm font-semibold mb-4"
          >
            + إضافة عضو
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editing ? 'تعديل العضو' : 'إضافة عضو جديد'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">

              <div>
                <label className="text-xs text-gray-500 block mb-1">الاسم *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setDuplicateError('') }}
                  className={`w-full border rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">المنصب *</label>
                <input
                  required
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">الهاتف</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-800"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm hover:bg-gray-200"
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
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">👥</p>
            <p className="text-gray-400 text-sm">لا يوجد أعضاء بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >

                {/* Name + Role */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {member.full_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {member.role}
                  </p>
                  {member.phone && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      📞 {member.phone}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-100" />

                {/* Initials */}
                <div className="text-center min-w-[40px]">
                  <div className="w-9 h-9 bg-indigo-700 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                    {getInitials(member.full_name)}
                  </div>
                </div>

                {/* Admin */}
                {isAdmin && (
                  <>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex flex-col gap-1 text-xs">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.full_name)}
                        className="text-red-400 hover:text-red-600"
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
        {members.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">عدد الأعضاء</p>
              <p className="text-xs text-gray-300 mt-0.5">
                {members.length} عضو
              </p>
            </div>
            <p className="text-2xl font-bold text-indigo-700">
              {members.length}
            </p>
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-6">
          © 2026 جمعية العكنة الخيرية
        </p>

      </div>
    </div>
  )
}