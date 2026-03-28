'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function HousePage() {
  const [house, setHouse] = useState<any>(null)
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState({ name: '', sector: '', notes: '' })
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    fetchHouse()
  }

  const fetchHouse = async () => {
    const { data: houseData } = await supabase
      .from('houses')
      .select('*')
      .eq('id', id)
      .single()

    if (!houseData) { router.push('/dashboard'); return }
    setHouse(houseData)
    setForm({ name: houseData.name, sector: houseData.sector, notes: houseData.notes || '' })

    const { data: familiesData } = await supabase
      .from('families')
      .select(`*, individuals(id)`)
      .eq('house_id', id)
      .order('created_at', { ascending: false })

    if (familiesData) setFamilies(familiesData)
    setLoading(false)
  }

  const handleEditHouse = async (e: React.FormEvent) => {
    e.preventDefault()
    await supabase.from('houses').update({
      name: form.name,
      sector: form.sector,
      notes: form.notes || null
    }).eq('id', id)
    setShowEdit(false)
    fetchHouse()
  }

  const handleDeleteHouse = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنزل؟ سيتم حذف كل الأسر والأفراد بداخله.')) return
    await supabase.from('houses').delete().eq('id', id)
    router.push('/dashboard')
  }

  const handleAddFamily = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('families').insert({
      house_id: id,
      created_by: user.id
    }).select().single()
    if (data) router.push(`/dashboard/families/${data.id}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{house?.name}</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white text-green-600 px-3 py-1 rounded text-sm cursor-pointer"
        >
          رجوع
        </button>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">المحور</p>
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                {house?.sector}
              </span>
              {house?.notes && <p className="text-gray-600 text-sm mt-2">{house.notes}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(!showEdit)}
                className="text-blue-600 text-sm underline cursor-pointer"
              >
                تعديل
              </button>
              <button
                onClick={handleDeleteHouse}
                className="text-red-500 text-sm underline cursor-pointer"
              >
                حذف
              </button>
            </div>
          </div>

          {showEdit && (
            <form onSubmit={handleEditHouse} className="mt-4 border-t pt-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-sm text-gray-600">اسم المنزل</label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">المحور</label>
                  <select
                    value={form.sector}
                    onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm cursor-pointer"
                  >
                    <option value="شرق">شرق</option>
                    <option value="شمال">شمال</option>
                    <option value="وسط">وسط</option>
                    <option value="الدوراشاب">الدوراشاب</option>
                  </select>
                </div>
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded p-2 text-right text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded text-sm cursor-pointer">حفظ</button>
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 bg-gray-200 py-2 rounded text-sm cursor-pointer">إلغاء</button>
              </div>
            </form>
          )}
        </div>

        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-700">الأسر ({families.length})</h2>
          <button
            onClick={handleAddFamily}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm cursor-pointer"
          >
            + إضافة أسرة
          </button>
        </div>

        {families.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">لا توجد أسر بعد</p>
        ) : (
          <div className="space-y-2">
            {families.map((family, index) => (
              <div
                key={family.id}
                className="bg-white p-4 rounded-lg shadow flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/dashboard/families/${family.id}`)}
              >
                <div>
                  <p className="font-bold">أسرة {index + 1}</p>
                  <p className="text-gray-500 text-sm">
                    {family.individuals?.length || 0} فرد
                  </p>
                </div>
                <span className="text-green-600 text-sm">عرض ←</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}