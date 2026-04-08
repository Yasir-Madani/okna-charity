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
    'رئيس': 'bg-purple-100 text-purple-800',
    'نائب': 'bg-blue-100 text-blue-800',
    'أمين': 'bg-green-100 text-green-800',
    'عضو': 'bg-gray-100 text-gray-700',
  }

  const getRoleColor = (role: string) => {
    const match = Object.keys(roleColors).find(k => role.includes(k))
    return match ? roleColors[match] : 'bg-gray-100 text-gray-700'
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0]
  }

  const bgColors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-teal-500',
    'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-purple-900 via-purple-800 to-purple-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
             رجوع
          </button>
          <h1 className="text-lg font-bold">إدارة الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-gradient-to-l from-purple-700 to-purple-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mb-4 shadow-lg shadow-purple-200 cursor-pointer hover:scale-[1.01] transition-all">
            + إضافة عضو
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">{editing ? 'تعديل العضو' : 'إضافة عضو جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">الاسم الكامل *</label>
                <input required value={form.full_name}
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setDuplicateError('') }}
                  className={`w-full border rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`} />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    ⚠️ {duplicateError}
                  </p>
                )}
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">المنصب / الوظيفة *</label>
                <input required value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  placeholder="مثال: رئيس الجمعية"
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">رقم الهاتف</label>
                <input value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">ترتيب الظهور</label>
                <input type="number" value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-purple-700 transition-all">
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
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">👥</span>
            <p className="text-gray-400">لا يوجد أعضاء مسجلون بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, i) => (
              <div key={member.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center">
                
             <div className="flex-1 text-right">
                  <p className="font-bold text-gray-800">{member.full_name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                  {member.phone && (
                    <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                      <span>📞</span> {member.phone}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => handleEdit(member)}
                      className="text-blue-500 text-xs underline cursor-pointer">تعديل</button>
                    <button onClick={() => handleDelete(member.id, member.full_name)}
                      className="text-red-400 text-xs underline cursor-pointer">حذف</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}

