'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function HousePage() {
  const [house, setHouse] = useState<any>(null)
  const [families, setFamilies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [familyError, setFamilyError] = useState('')
  const [form, setForm] = useState({ name: '', sector: '', notes: '' })
  const router = useRouter()
  const { id } = useParams()

  useEffect(() => { checkUser() }, [])

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
      .order('created_at', { ascending: true })

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

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    setFamilyError('')

    const trimmedName = familyName.trim()
    const alreadyExists = families.some(
      f => f.name.trim().toLowerCase() === trimmedName.toLowerCase()
    )

    if (alreadyExists) {
      setFamilyError(`⚠️ أسرة "${trimmedName}" موجودة مسبقاً في هذا المنزل!`)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('families').insert({
      house_id: id,
      name: trimmedName,
      created_by: user.id
    })

    setFamilyName('')
    setFamilyError('')
    setShowFamilyForm(false)
    fetchHouse()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <p className="text-gray-400 text-sm">جاري التحميل...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ===== شريط العنوان ===== */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-green-200">تفاصيل المنزل</p>
          <h1 className="text-sm font-bold truncate">
            منزل {house?.name}
            
  
          </h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 mr-2"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* ===== بطاقة معلومات المنزل ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {house?.sector}
              </span>
              {house?.notes && (
                <p className="text-xs text-gray-400 mt-1.5">{house.notes}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowEdit(!showEdit)}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg cursor-pointer border border-blue-100"
              >
                تعديل
              </button>
              <button
                onClick={handleDeleteHouse}
                className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg cursor-pointer border border-red-100"
              >
                حذف
              </button>
            </div>
          </div>

          {/* نموذج التعديل */}
          {showEdit && (
            <form onSubmit={handleEditHouse} className="border-t border-gray-100 px-4 py-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم المنزل *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">المحور</label>
                <select
                  value={form.sector}
                  onChange={e => setForm({ ...form, sector: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="شرق">شرق</option>
                  <option value="شمال">شمال</option>
                  <option value="وسط">وسط</option>
                  <option value="الدوراشاب">الدوراشاب</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ===== رأس قسم الأسر ===== */}
        <div className="flex justify-between items-center px-1">
          <h2 className="font-bold text-gray-700 text-sm">
            الأسر
            <span className="text-gray-400 font-normal mr-1">({families.length})</span>
          </h2>
          <button
            onClick={() => {
              setShowFamilyForm(!showFamilyForm)
              setFamilyError('')
            }}
            className="bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
          >
            + إضافة أسرة
          </button>
        </div>

        {/* ===== نموذج إضافة أسرة ===== */}
        {showFamilyForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <form onSubmit={handleAddFamily} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم الأسرة *</label>
                <input
                  required
                  value={familyName}
                  onChange={e => {
                    setFamilyName(e.target.value)
                    setFamilyError('')
                  }}
                  placeholder="مثال: أسرة علي محمدين"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                    ${familyError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {familyError && (
                  <p className="text-red-600 text-xs mt-1.5 bg-red-50 border border-red-200 rounded-lg p-2">
                    {familyError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFamilyForm(false)
                    setFamilyError('')
                    setFamilyName('')
                  }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== قائمة الأسر ===== */}
        {families.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">لا توجد أسر بعد</p>
        ) : (
          <div className="space-y-2">
            {families.map(family => (
              <div
                key={family.id}
                onClick={() => router.push(`/dashboard/families/${family.id}`)}
                className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-green-300 active:bg-green-50 transition-all"
              >
                {/* أيقونة الأسرة */}
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-lg">👨‍👩‍👧</span>
                </div>

                {/* المعلومات */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">أسرة {family.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {family.individuals?.length || 0} فرد
                  </p>
                </div>

                {/* سهم */}
                <span className="text-gray-300 text-lg flex-shrink-0">← عرض</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
