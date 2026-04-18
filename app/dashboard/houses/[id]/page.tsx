'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

// ============================================================
// مكوّن تحذير الحذف — مدمج مباشرة في الصفحة
// ============================================================
function DeleteHouseModal({
  houseId,
  houseName,
  houseNumber,
  onDeleted,
}: {
  houseId: string
  houseName: string
  houseNumber: number | null
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [families, setFamilies] = useState(0)
  const [individuals, setIndividuals] = useState(0)
  const [subscriptions, setSubscriptions] = useState(0)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const openModal = async () => {
    setOpen(true)
    setChecking(true)
    setConfirmText('')
    setError('')

    const { data: fams } = await supabase
      .from('families')
      .select('id, individuals(id)')
      .eq('house_id', houseId)

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('house_id', houseId)

    setFamilies(fams?.length || 0)
    setIndividuals(fams?.reduce((s: number, f: any) => s + (f.individuals?.length || 0), 0) || 0)
    setSubscriptions(subs?.length || 0)
    setChecking(false)
  }

  const closeModal = () => {
    if (deleting) return
    setOpen(false)
    setConfirmText('')
    setError('')
  }

  const hasData = families > 0 || subscriptions > 0
  const canDelete = confirmText === 'حذف' && !hasData

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    const { error: err } = await supabase.from('houses').delete().eq('id', houseId)
    if (err) {
      setError('حدث خطأ أثناء الحذف: ' + err.message)
      setDeleting(false)
      return
    }
    setDeleting(false)
    setOpen(false)
    onDeleted()
  }

  return (
    <>
      {/* زر الحذف */}
      <button
        onClick={openModal}
        className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg cursor-pointer border border-red-100"
      >
        حذف
      </button>

      {/* المودال */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            dir="rtl"
            style={{ animation: 'popIn 0.2s ease' }}
          >
            {/* هيدر */}
            <div className="bg-red-600 px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                🗑️
              </div>
              <div>
                <h2 className="text-white font-bold text-base">حذف المنزل</h2>
                <p className="text-red-100 text-xs mt-0.5">
                  {houseNumber ? `#${houseNumber} — ` : ''}{houseName}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {checking ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">جاري فحص البيانات المرتبطة...</p>
                </div>
              ) : (
                <>
                  {/* إحصاء البيانات */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'أسرة', value: families, icon: '👨‍👩‍👧' },
                      { label: 'فرد', value: individuals, icon: '👤' },
                      { label: 'اشتراك', value: subscriptions, icon: '💳' },
                    ].map(item => (
                      <div
                        key={item.label}
                        className={`rounded-xl border p-3 text-center ${item.value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}
                      >
                        <div className="text-lg">{item.icon}</div>
                        <div className={`text-xl font-bold ${item.value > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {item.value}
                        </div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* تحذير إذا في بيانات */}
                  {hasData ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
                      <p className="text-red-700 font-bold text-sm">⛔ لا يمكن الحذف الآن</p>
                      {families > 0 && (
                        <p className="text-red-600 text-xs">
                          • يوجد <strong>{families} أسرة</strong> و <strong>{individuals} فرد</strong> — احذفهم أولاً من صفحة الأسر
                        </p>
                      )}
                      {subscriptions > 0 && (
                        <p className="text-red-600 text-xs">
                          • يوجد <strong>{subscriptions} اشتراك</strong> مسجّل — قم بإلغاء تحديدهم من صفحة الاشتراكات وحفظ
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-green-700 text-xs">✅ المنزل فارغ — يمكن حذفه بأمان</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-amber-700 text-xs">⚠️ هذا الإجراء <strong>لا يمكن التراجع عنه</strong></p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1.5">
                          اكتب <strong className="text-red-600">حذف</strong> للتأكيد:
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={e => setConfirmText(e.target.value)}
                          placeholder="اكتب: حذف"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                  )}
                </>
              )}
            </div>

            {/* أزرار */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={closeModal}
                disabled={deleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              {!hasData && !checking && (
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-bold cursor-pointer transition-colors"
                >
                  {deleting ? 'جاري الحذف...' : '🗑️ تأكيد الحذف'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </>
  )
}

// ============================================================
// الصفحة الرئيسية
// ============================================================
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

      {/* شريط العنوان */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-green-200">تفاصيل المنزل</p>
          <h1 className="text-sm font-bold truncate">منزل {house?.name}</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 mr-2"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* بطاقة معلومات المنزل */}
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

              {/* ✅ زر الحذف الآمن — يحل محل handleDeleteHouse القديم */}
              <DeleteHouseModal
                houseId={String(id)}
                houseName={house?.name || ''}
                houseNumber={house?.house_number || null}
                onDeleted={() => router.push('/dashboard')}
              />
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
                <button type="submit" className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                  حفظ
                </button>
                <button type="button" onClick={() => setShowEdit(false)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>

        {/* رأس قسم الأسر */}
        <div className="flex justify-between items-center px-1">
          <h2 className="font-bold text-gray-700 text-sm">
            الأسر
            <span className="text-gray-400 font-normal mr-1">({families.length})</span>
          </h2>
          <button
            onClick={() => { setShowFamilyForm(!showFamilyForm); setFamilyError('') }}
            className="bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-sm"
          >
            + إضافة أسرة
          </button>
        </div>

        {/* نموذج إضافة أسرة */}
        {showFamilyForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <form onSubmit={handleAddFamily} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم الأسرة *</label>
                <input
                  required
                  value={familyName}
                  onChange={e => { setFamilyName(e.target.value); setFamilyError('') }}
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
                <button type="submit" className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer">
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => { setShowFamilyForm(false); setFamilyError(''); setFamilyName('') }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* قائمة الأسر */}
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
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">أسرة {family.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{family.individuals?.length || 0} فرد</p>
                </div>
                <span className="text-black-300 text-lg flex-shrink-0">← عرض</span>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
