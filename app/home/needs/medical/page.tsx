'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

interface MedicalNeed {
  id: string
  number: number
  category: string
  description: string
  quantity: string
  created_by?: string
  created_at?: string
}

export default function MedicalNeedsPage() {
  const [needs, setNeeds] = useState<MedicalNeed[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MedicalNeed | null>(null)
  const [form, setForm] = useState({ category: '', description: '', quantity: '' })
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: visData } = await supabase
      .from('page_visibility')
      .select('is_visible')
      .eq('page_key', 'medical_needs')
      .single()
    if (visData) setIsVisible(visData.is_visible)

    const { data } = await supabase
      .from('medical_needs')
      .select('*')
      .order('number', { ascending: true })
    if (data) setNeeds(data)
    setLoading(false)
  }

  const toggleVisibility = async () => {
    setTogglingVisibility(true)
    const newVal = !isVisible
    await supabase
      .from('page_visibility')
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq('page_key', 'medical_needs')
    setIsVisible(newVal)
    setTogglingVisibility(false)
  }

  const resetForm = () => {
    setForm({ category: '', description: '', quantity: '' })
    setEditing(null)
    setShowForm(false)
  }

  // إعادة ترقيم تلقائي بعد كل تعديل
  const reorderNumbers = async (items: MedicalNeed[]) => {
    const updates = items.map((item, i) => ({ id: item.id, number: i + 1 }))
    for (const u of updates) {
      await supabase.from('medical_needs').update({ number: u.number }).eq('id', u.id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      await supabase.from('medical_needs').update({
        category: form.category.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
      }).eq('id', editing.id)
    } else {
      const nextNumber = needs.length + 1
      await supabase.from('medical_needs').insert({
        number: nextNumber,
        category: form.category.trim(),
        description: form.description.trim(),
        quantity: form.quantity.trim(),
        created_by: user.id,
      })
    }
    resetForm()
    fetchData()
  }

  const handleEdit = (need: MedicalNeed) => {
    setForm({ category: need.category, description: need.description, quantity: need.quantity })
    setEditing(need)
    setShowForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('medical_needs').delete().eq('id', id)
    // إعادة ترقيم
    const remaining = needs.filter(n => n.id !== id)
    await reorderNumbers(remaining)
    fetchData()
  }

  // ── تصدير Excel ──
  const exportExcel = async () => {
    setExporting('excel')
    try {
      const { utils, writeFile } = await import('xlsx')
      const rows = needs.map(n => ({
        'الرقم': n.number,
        'الصنف': n.category,
        'الوصف': n.description,
        'العدد': n.quantity,
      }))
      const ws = utils.json_to_sheet(rows, { skipHeader: false })
      // عرض الأعمدة
      ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 35 }, { wch: 14 }]
      const wb = utils.book_new()
      utils.book_append_sheet(wb, ws, 'الحوجات الطبية')
      writeFile(wb, 'الحوجات_الطبية.xlsx')
    } catch {
      alert('تعذّر تصدير Excel، تأكد من تثبيت مكتبة xlsx')
    }
    setExporting(null)
  }

  // ── تصدير PDF — تنزيل مباشر بدون نافذة طباعة ──
  const exportPDF = async () => {
    setExporting('pdf')
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const date = new Date().toLocaleDateString('ar-EG')

      const rows = needs.map(n => `
        <tr>
          <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #e2e8f0;">${n.number}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">${n.category}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;color:#4b5563;">${n.description}</td>
          <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f766e;">${n.quantity}</td>
        </tr>`).join('')

      const el = document.createElement('div')
      el.innerHTML = `
        <div style="font-family:Arial,sans-serif;direction:rtl;padding:24px;color:#1e293b;">
          <div style="text-align:center;margin-bottom:16px;">
            <h1 style="font-size:18px;font-weight:800;color:#0f2a5e;margin-bottom:4px;">
              الحوجات الطبية — جمعية نهضة العكنة الخيرية
            </h1>
            <p style="font-size:11px;color:#64748b;">تاريخ التصدير: ${date}</p>
          </div>
          <div style="height:3px;background:#0f766e;border-radius:4px;margin-bottom:18px;"></div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#0f766e;color:#fff;">
                <th style="padding:9px 10px;text-align:center;width:36px;">#</th>
                <th style="padding:9px 10px;text-align:right;">الصنف</th>
                <th style="padding:9px 10px;text-align:right;">الوصف</th>
                <th style="padding:9px 10px;text-align:center;width:80px;">العدد</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:14px;background:#0f2a5e;color:#fff;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between;">
            <span style="font-size:12px;">إجمالي الحوجات الطبية المسجلة</span>
            <span style="background:#ccfbf1;color:#0f766e;padding:2px 12px;border-radius:20px;font-weight:700;font-size:12px;">${needs.length} صنف</span>
          </div>
          <div style="margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;">
            جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
          </div>
        </div>`

      await html2pdf()
        .set({
          margin: 8,
          filename: 'الحوجات_الطبية.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save()
    } catch {
      alert('تعذّر تصدير PDF، تأكد من تثبيت مكتبة html2pdf.js')
    }
    setExporting(null)
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
          {/* أزرار التصدير */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportExcel}
              disabled={exporting !== null || needs.length === 0}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {exporting === 'excel' ? '...' : '📊 Excel'}
            </button>
            <button
              onClick={exportPDF}
              disabled={exporting !== null || needs.length === 0}
              className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {exporting === 'pdf' ? '...' : '📄 PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 relative min-h-[60vh]">

        {/* ── شاشة التغطية للزائر ── */}
        {!loading && !isAdmin && !isVisible && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-6 px-0">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm rounded-2xl" />
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 text-center w-full shadow-sm">
              <p className="text-4xl mb-4">🏥</p>
              <h2 className="text-base font-semibold text-gray-800 mb-2">البيانات قيد الإدخال</h2>
              <p className="text-gray-400 text-sm leading-loose mb-5">
                يتم حالياً إدخال وتدقيق البيانات
                <br />
                ستتوفر للعرض بعد اكتمال عملية الإدخال
              </p>
              <div className="bg-teal-50 rounded-xl p-3 mb-5">
                <p className="text-teal-600 text-sm">نعتذر عن عدم توفر البيانات مؤقتاً</p>
              </div>
              <button
                onClick={() => router.push('/home/needs')}
                className="w-full bg-teal-700 text-white py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-teal-800 transition-colors"
              >
                العودة للصفحة السابقة
              </button>
            </div>
          </div>
        )}

        {/* ── التحكم بالرؤية (أدمن) ── */}
        {isAdmin && (
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">حالة الصفحة للزوار</p>
              <p className={`text-xs mt-0.5 font-medium ${isVisible ? 'text-green-600' : 'text-red-500'}`}>
                {isVisible ? '✅ مرئية للزوار' : '🔒 مخفية — تغطية نشطة'}
              </p>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isVisible
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {togglingVisibility ? '...' : isVisible ? '🔒 إخفاء' : '🔓 إظهار'}
            </button>
          </div>
        )}

        {/* ── زر إضافة ── */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-teal-700 hover:bg-teal-800 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            {showForm && !editing ? '✕ إغلاق النموذج' : '+ إضافة حوجة طبية'}
          </button>
        )}

        {/* ── نموذج الإضافة/التعديل ── */}
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

        {/* ── Loading ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : needs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏥</p>
            <p className="text-gray-400 text-sm font-medium">لا توجد حوجات طبية مسجلة بعد</p>
            {isAdmin && <p className="text-gray-300 text-xs mt-1">اضغط "إضافة حوجة طبية" للبدء</p>}
          </div>
        ) : (
          <>



          {/* ✅ ضع التنويه هنا */}
            <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 mb-3 flex items-center gap-2">
  <span className="bg-teal-700 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0">
    تنويه
  </span>
  <p className="text-red-500 text-[11px] font-medium m-0">
    الروشتات الطبية متاحة عند الطلب عبر{' '}
    <a href="/home/contact" className="text-red-500 font-bold underline underline-offset-2">
      صفحة التواصل
    </a>
  </p>
</div>

            {/* ── رؤوس الأعمدة ── */}
            <div className="grid grid-cols-12 gap-2 px-3 pb-1">
              <div className="col-span-1 text-center">
                <p className="text-xs font-bold text-gray-400">#</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs font-bold text-black-500">الصنف</p>
              </div>
              <div className="col-span-5">
                <p className="text-xs font-bold text-black-500">الوصف</p>
              </div>
              <div className="col-span-3 text-center">
                <p className="text-xs font-bold text-black-500">العدد</p>
              </div>
            </div>



            {/* ── قائمة الحوجات ── */}
            <div className="space-y-2">
              {needs.map(need => (
                <div
                  key={need.id}
                  className="bg-white rounded-2xl border border-gray-100 px-3 py-3.5"
                  style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 flex justify-center">
                      <span className="w-6 h-6 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">
                        {need.number}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-bold text-gray-800 leading-tight">{need.category}</p>
                    </div>
                    <div className="col-span-5">
                      <p className="text-xs text-gray-900 leading-tight">{need.description}</p>
                    </div>
                    <div className="col-span-3 text-center">
                      <span className="inline-block bg-teal-50 text-teal-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {need.quantity}
                      </span>
                    </div>
                  </div>

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

            {/* ── ملخص ── */}
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
