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
      setDuplicateError(`"${form.full_name.trim()}" موجود مسبقاً في قائمة الأعضاء`)
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

  const roleColors: Record<string, string> = {
    'رئيس': 'bg-orange-100 text-orange-800',
    'نائب': 'bg-blue-100 text-blue-800',
    'أمين': 'bg-green-100 text-green-800',
    'عضو': 'bg-gray-100 text-gray-700',
  }

  const getRoleColor = (role: string) => {
    const match = Object.keys(roleColors).find(k => role.includes(k))
    return match ? roleColors[match] : 'bg-gray-100 text-gray-700'
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
          <h1 className="text-base font-semibold tracking-wide">إدارة الجمعية</h1>
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
            + إضافة عضو
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editing ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">الاسم الكامل *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setDuplicateError('') }}
                  placeholder="مثال: محمد أحمد"
                  className={`w-full border rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">المنصب / الوظيفة *</label>
                <input
                  required
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  placeholder="مثال: رئيس الجمعية"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">رقم الهاتف</label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  dir="ltr"
                  placeholder="05X XXX XXXX"
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">ترتيب الظهور</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: e.target.value })}
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
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">👥</p>
            <p className="text-gray-400 text-sm">لا يوجد أعضاء مسجلون بعد</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((member, index) => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
              >
                {/* Sequential Number */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-700">
                    {index + 1}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{member.full_name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium whitespace-nowrap ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    {member.phone && (
                      <p className="text-xs text-gray-400 truncate" dir="ltr">
                        {member.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <>
                    <div className="w-px h-8 bg-gray-100 flex-shrink-0" />
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(member.id, member.full_name)}
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

        {/* Summary Card */}
        {members.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">إجمالي الأعضاء</p>
            </div>
            <p className="text-2xl font-bold text-orange-700">
              {members.length.toLocaleString('ar-EG')}
            </p>
          </div>
        )}

        <p className="text-center text-gray-300 text-xs mt-6 mb-4">© 2026 جمعية العكنة الخيرية</p>
      </div>
    </div>
  )
}
