'use client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type BankAccount = {
  id: number
  account_number: string
  bank_name: string
  account_name: string
  notice_number: string | null
}

export default function ContactPage() {
  const router = useRouter()

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ account_number: '', bank_name: '', account_name: '', notice_number: '' })
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const whatsappNumber = '249912213182'
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=السلام عليكم، أود التواصل مع جمعية العكنة الخيرية`

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    // تشغيل الطلبين في نفس الوقت لتسريع عملية التحميل
    const [userResponse, accountsResponse] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('bank_accounts').select('*').order('id')
    ])

    setIsAdmin(!!userResponse.data.user)
    
    if (accountsResponse.data) {
      setAccounts(accountsResponse.data)
    }
    
    setLoading(false)
  }

  const openAdd = () => {
    setEditingId(null)
    setForm({ account_number: '', bank_name: '', account_name: '', notice_number: '' })
    setModalOpen(true)
  }

  const openEdit = (acc: BankAccount) => {
    setEditingId(acc.id)
    setForm({
      account_number: acc.account_number,
      bank_name: acc.bank_name,
      account_name: acc.account_name,
      notice_number: acc.notice_number || ''
    })
    setModalOpen(true)
  }

  const saveAccount = async () => {
    if (!form.account_number.trim() || !form.bank_name.trim() || !form.account_name.trim()) return
    setSaving(true)
    const payload = {
      account_number: form.account_number.trim(),
      bank_name: form.bank_name.trim(),
      account_name: form.account_name.trim(),
      notice_number: form.notice_number.trim() || null,
    }
    if (editingId !== null) {
      await supabase.from('bank_accounts').update(payload).eq('id', editingId)
    } else {
      await supabase.from('bank_accounts').insert(payload)
    }
    setSaving(false)
    setModalOpen(false)
    fetchData()
  }

  const deleteAccount = async (id: number) => {
    await supabase.from('bank_accounts').delete().eq('id', id)
    setDeleteConfirmId(null)
    fetchData()
  }

  return (
    <div className="min-h-screen bg-[#f4f2ed] font-cairo" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a5c47 0%, #0d7a60 50%, #0f8c6e 100%)' }}>
        <div className="absolute -top-5 -left-5 w-24 h-24 bg-white/5 rounded-full" />
        <div className="absolute -bottom-4 -right-3 w-16 h-16 bg-white/5 rounded-full" />
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/home')}
              className="bg-white/15 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
            >
              رجوع
            </button>
            <h1 className="text-white text-[17px] font-bold">تواصل معنا</h1>
            <div className="w-[68px]" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* WhatsApp */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[3px] h-5 rounded-full bg-[#0d7a60]" />
            <span className="text-sm font-bold text-gray-900">وسائل التواصل</span>
          </div>
          <button
            onClick={() => window.open(whatsappLink, '_blank')}
            className="w-full rounded-[18px] overflow-hidden cursor-pointer hover:-translate-y-0.5 active:scale-[0.97] transition-all shadow-md"
            style={{ background: 'linear-gradient(135deg, #1a7a3a 0%, #22a04d 100%)' }}
          >
            <div className="flex items-center gap-4 p-[16px_18px]">
              <div className="w-[50px] h-[50px] bg-white/20 rounded-[14px] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="white" className="w-[26px] h-[26px]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M11.99 2C6.469 2 2 6.468 2 12c0 1.99.517 3.857 1.426 5.479L2.05 22l4.637-1.358A9.945 9.945 0 0 0 11.99 22c5.522 0 9.99-4.468 9.99-9.99C21.98 6.468 17.512 2 11.99 2z" />
                </svg>
              </div>
              <div className="flex-1 text-right">
                <p className="text-white text-[15px] font-bold">واتساب</p>
                <p className="text-white/75 text-xs mt-0.5"> ابدأ محادثة الآن مع الجمعية</p>
              </div>
              <span className="text-white/50 text-lg">←</span>
            </div>
          </button>
        </div>

        {/* Bank Accounts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[3px] h-5 rounded-full bg-[#0d7a60]" />
            <span className="text-sm font-bold text-gray-900">حسابات التحويل البنكي : </span>
            <span 
              style={{ fontSize: '11px', color: '#8b0000' }} 
              className="font-bold"
            >
             يرسل الإشعار مع التعليق عبر واتساب أدناه
            </span>
          </div>
          <div className="bg-white rounded-[18px] overflow-hidden shadow-sm border border-black/[0.06]">
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f7] border-b border-black/[0.06]">
              <span className="text-[13px] font-semibold text-gray-900">الحسابات المتاحة</span>
              {isAdmin && (
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 bg-[#eaf6f1] text-[#0d7a60] text-xs font-bold px-3 py-1.5 rounded-[10px] hover:bg-[#d4ede5] transition-colors cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  إضافة حساب
                </button>
              )}
            </div>

            {/* Account Cards */}
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-400">جاري التحميل...</div>
            ) : accounts.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">لا توجد حسابات مضافة بعد</div>
            ) : (
              accounts.map((acc, i) => (
                <div key={acc.id} className={`px-4 py-4 ${i < accounts.length - 1 ? 'border-b border-black/[0.06]' : ''}`}>
                  <div className="flex items-start gap-3">
                    {/* Sequence badge */}
                    <div className="w-7 h-7 bg-[#eaf6f1] text-[#0d7a60] rounded-[8px] flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>

                    {/* Info - label : value format */}
                    <div className="flex-1 min-w-0">
                      {/* Each row: label and value aligned */}
                      <table className="w-full text-right" style={{ borderCollapse: 'collapse' }}>
                        <tbody>
                          <tr>
                            <td className="text-[12px] text-gray-500 font-semibold pb-1 whitespace-nowrap" style={{ width: '1%' }}>الاسم</td>
                            <td className="text-[12px] text-gray-400 pb-1 px-1">:</td>
                            <td className="text-[13px] font-bold text-gray-900 pb-1">{acc.account_name}</td>
                          </tr>
                          <tr>
                            <td className="text-[12px] text-gray-500 font-semibold pb-1 whitespace-nowrap">البنك</td>
                            <td className="text-[12px] text-gray-400 pb-1 px-1">:</td>
                            <td className="text-[12px] text-gray-700 pb-1">{acc.bank_name}</td>
                          </tr>
                          <tr>
                            <td className="text-[12px] text-gray-500 font-semibold pb-1 whitespace-nowrap">رقم الحساب</td>
                            <td className="text-[12px] text-gray-400 pb-1 px-1">:</td>
                            <td className="text-[12px] font-semibold text-[#0d7a60] pb-1 tracking-wide" dir="ltr" style={{ textAlign: 'right' }}>{acc.account_number}</td>
                          </tr>
                          {acc.notice_number && (
                            <tr>
                              <td className="text-[12px] text-gray-500 font-semibold whitespace-nowrap">رقم الإشعار</td>
                              <td className="text-[12px] text-gray-400 px-1">:</td>
                              <td className="text-[12px] font-semibold text-gray-800">
                                <div className="flex items-center gap-2">
                                  <span dir="ltr">{acc.notice_number}</span>
                                  <a
                                    href={`https://wa.me/${acc.notice_number.replace(/\D/g, '')}?text=السلام عليكم`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-[#25d366] rounded-[7px] p-1.5 hover:bg-[#1fb855] transition-colors shrink-0"
                                    title="فتح محادثة واتساب"
                                  >
                                    <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                      <path d="M11.99 2C6.469 2 2 6.468 2 12c0 1.99.517 3.857 1.426 5.479L2.05 22l4.637-1.358A9.945 9.945 0 0 0 11.99 22c5.522 0 9.99-4.468 9.99-9.99C21.98 6.468 17.512 2 11.99 2z" />
                                    </svg>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex gap-1.5 shrink-0 mt-0.5">
                        <button
                          onClick={() => openEdit(acc)}
                          className="w-8 h-8 bg-[#eaf6f1] rounded-[9px] flex items-center justify-center hover:bg-[#d4ede5] transition-colors cursor-pointer"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#0d7a60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(acc.id)}
                          className="w-8 h-8 bg-[#fdecea] rounded-[9px] flex items-center justify-center hover:bg-[#fcd5d2] transition-colors cursor-pointer"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="#d63031" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* In-kind Donation */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-[3px] h-5 rounded-full bg-[#0d7a60]" />
            <span className="text-sm font-bold text-gray-900">التبرع العيني</span>
          </div>
          <div className="bg-white rounded-[18px] p-4 shadow-sm border border-black/[0.06] flex items-start gap-3.5">
            <div className="w-[44px] h-[44px] bg-[#eaf6f1] rounded-[13px] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0d7a60" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[22px] h-[22px]">
                <path d="M21 10c0 6-9 11-9 11s-9-5-9-11a9 9 0 1 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-gray-900">التبرع العيني</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">يمكن تسليم التبرعات مباشرةً في مقر الجمعية بالقرية بالتواصل مع السيد / عبدالباسط محمد محمدأحمد الفكي - رقم الهاتف : 0126462333</p>
            </div>
          </div>
        </div>

      </div>

      <footer className="text-center pb-6">
        <p className="text-xs text-black-500">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </footer>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/45 flex items-end z-50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-t-[22px] w-full px-5 pt-6 pb-8"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-[16px] font-bold text-gray-900 text-center mb-5">
              {editingId !== null ? 'تعديل الحساب' : 'إضافة حساب بنكي'}
            </h2>

            <label className="block text-[12px] font-semibold text-gray-500 mb-1">الاسم</label>
            <input
              className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:border-[#0d7a60] focus:ring-2 focus:ring-[#0d7a60]/10"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="الاسم المسجل للحساب"
              value={form.account_name}
              onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
            />

            <label className="block text-[12px] font-semibold text-gray-500 mb-1">البنك</label>
            <input
              className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:border-[#0d7a60] focus:ring-2 focus:ring-[#0d7a60]/10"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="مثال: بنك الخرطوم"
              value={form.bank_name}
              onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))}
            />

            <label className="block text-[12px] font-semibold text-gray-500 mb-1">رقم الحساب</label>
            <input
              className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm mb-3 outline-none focus:border-[#0d7a60] focus:ring-2 focus:ring-[#0d7a60]/10"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="أدخل رقم الحساب"
              value={form.account_number}
              onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))}
            />

            <label className="block text-[12px] font-semibold text-gray-500 mb-1">رقم الإشعار <span className="text-gray-400 font-normal">(اختياري)</span></label>
            <input
              className="w-full border border-black/15 rounded-xl px-4 py-2.5 text-sm mb-5 outline-none focus:border-[#0d7a60] focus:ring-2 focus:ring-[#0d7a60]/10"
              style={{ fontFamily: "'Cairo', sans-serif" }}
              placeholder="رقم واتساب للإشعار"
              value={form.notice_number}
              onChange={e => setForm(f => ({ ...f, notice_number: e.target.value }))}
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-none w-20 bg-[#f0efeb] text-gray-600 text-sm font-semibold py-3 rounded-[13px] cursor-pointer hover:bg-[#e4e2dc] transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={saveAccount}
                disabled={saving}
                className="flex-1 text-white text-sm font-bold py-3 rounded-[13px] cursor-pointer transition-colors disabled:opacity-60"
                style={{ background: '#0d7a60' }}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId !== null && (
        <div
          className="fixed inset-0 bg-black/45 flex items-end z-50"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-t-[22px] w-full px-5 pt-6 pb-8"
            dir="rtl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-[#fdecea] rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d63031" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </div>
            </div>
            <h2 className="text-[16px] font-bold text-gray-900 text-center mb-1">حذف الحساب</h2>
            <p className="text-sm text-gray-500 text-center mb-6">هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-none w-20 bg-[#f0efeb] text-gray-600 text-sm font-semibold py-3 rounded-[13px] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => deleteAccount(deleteConfirmId)}
                className="flex-1 bg-[#d63031] text-white text-sm font-bold py-3 rounded-[13px] cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}