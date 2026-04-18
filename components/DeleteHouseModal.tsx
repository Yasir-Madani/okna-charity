'use client'
// ============================================================
// DeleteHouseModal.tsx
// مكوّن تحذير الحذف — يُستخدم في صفحة تفاصيل المنزل
// الاستخدام:
//   import DeleteHouseModal from '@/components/DeleteHouseModal'
//   <DeleteHouseModal houseId={id} houseName={name} onDeleted={() => router.push('/dashboard')} />
// ============================================================

import { useState } from 'react'
import { supabase } from './../app/lib/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  houseId: string
  houseName: string
  houseNumber: number | null
  onDeleted?: () => void
}

type BlockingData = {
  families: number
  individuals: number
  subscriptions: number
}

export default function DeleteHouseModal({ houseId, houseName, houseNumber, onDeleted }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [blocking, setBlocking] = useState<BlockingData | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const openModal = async () => {
    setOpen(true)
    setChecking(true)
    setConfirmText('')
    setError('')
    setBlocking(null)

    // جلب البيانات المرتبطة
    const { data: families } = await supabase
      .from('families')
      .select('id, individuals(id)')
      .eq('house_id', houseId)

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('house_id', houseId)

    const familyCount = families?.length || 0
    const individualCount = families?.reduce((s: number, f: any) => s + (f.individuals?.length || 0), 0) || 0
    const subCount = subscriptions?.length || 0

    setBlocking({ families: familyCount, individuals: individualCount, subscriptions: subCount })
    setChecking(false)
  }

  const closeModal = () => {
    if (deleting) return
    setOpen(false)
    setConfirmText('')
    setError('')
  }

  const hasData = blocking && (blocking.families > 0 || blocking.subscriptions > 0)
  const canDelete = confirmText === 'حذف' && !hasData

  const handleDelete = async () => {
    if (!canDelete) return
    setDeleting(true)
    setError('')

    // حذف المنزل (الـ cascade في Supabase يحذف المرتبطات إن كان مفعّلاً)
    const { error: err } = await supabase
      .from('houses')
      .delete()
      .eq('id', houseId)

    if (err) {
      setError('حدث خطأ أثناء الحذف: ' + err.message)
      setDeleting(false)
      return
    }

    setDeleting(false)
    setOpen(false)
    if (onDeleted) onDeleted()
    else router.push('/dashboard')
  }

  return (
    <>
      {/* زر الحذف */}
      <button
        onClick={openModal}
        className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors"
      >
        🗑️ حذف المنزل
      </button>

      {/* المودال */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
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
                  #{houseNumber} — {houseName}
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
                  {/* إحصاء البيانات المرتبطة */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'أسرة', value: blocking?.families || 0, icon: '👨‍👩‍👧', color: blocking?.families ? 'text-orange-600' : 'text-gray-400' },
                      { label: 'فرد', value: blocking?.individuals || 0, icon: '👤', color: blocking?.individuals ? 'text-orange-600' : 'text-gray-400' },
                      { label: 'اشتراك', value: blocking?.subscriptions || 0, icon: '💳', color: blocking?.subscriptions ? 'text-red-600' : 'text-gray-400' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl border p-3 text-center ${item.value > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="text-lg">{item.icon}</div>
                        <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* تحذير إذا في بيانات */}
                  {hasData ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-bold text-sm mb-1">⛔ لا يمكن الحذف</p>
                      <p className="text-red-600 text-xs leading-relaxed">
                        هذا المنزل لديه بيانات مرتبطة به.
                        يجب حذف جميع الأسر والاشتراكات أولاً قبل حذف المنزل.
                      </p>
                      {blocking.subscriptions > 0 && (
                        <p className="text-red-500 text-xs mt-2 font-bold">
                          ⚠️ يوجد {blocking.subscriptions} اشتراك مسجّل — احذفها أولاً من صفحة الاشتراكات
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-amber-700 text-xs leading-relaxed">
                          ⚠️ هذا الإجراء <strong>لا يمكن التراجع عنه.</strong> سيتم حذف المنزل نهائياً.
                        </p>
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
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

// ============================================================
// طريقة الاستخدام في صفحة تفاصيل المنزل:
//
// import DeleteHouseModal from '@/components/DeleteHouseModal'
//
// <DeleteHouseModal
//   houseId={house.id}
//   houseName={house.name}
//   houseNumber={house.house_number}
//   onDeleted={() => router.push('/dashboard')}
// />
// ============================================================
