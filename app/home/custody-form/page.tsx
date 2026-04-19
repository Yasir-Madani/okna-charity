'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface CustodyItem {
  id: string
  item_number: number
  item_name: string
  quantity: number | null
  condition_at_receipt: string
  condition_at_return: string
}

interface CustodyForm {
  id: string
  form_number: string
  recipient_name: string
  recipient_address: string
  usage_purpose: string
  usage_location: string
  phone_number: string
  receipt_date: string
  expected_return_date: string
  actual_return_date: string | null
  security_deposit: number
  status: 'active' | 'returned' | 'overdue'
  recipient_signature_receipt: string
  recipient_signature_return: string
  officer_signature_receipt: string
  officer_signature_return: string
  created_at: string
  items: CustodyItem[]
}

// ─── SQL to create tables (show to admin) ─────────────────────────────────────
const SQL_SCHEMA = `
-- جدول نماذج الاستلام
CREATE TABLE custody_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_number TEXT UNIQUE NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT,
  usage_purpose TEXT,
  usage_location TEXT,
  phone_number TEXT,
  receipt_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  security_deposit NUMERIC DEFAULT 50000,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','returned','overdue')),
  recipient_signature_receipt TEXT,
  recipient_signature_return TEXT,
  officer_signature_receipt TEXT,
  officer_signature_return TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول تفاصيل العهدة
CREATE TABLE custody_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES custody_forms(id) ON DELETE CASCADE,
  item_number INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER,
  condition_at_receipt TEXT,
  condition_at_return TEXT
);

-- Row Level Security
ALTER TABLE custody_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE custody_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON custody_forms FOR SELECT USING (true);
CREATE POLICY "Auth insert" ON custody_forms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update" ON custody_forms FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete" ON custody_forms FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public read items" ON custody_items FOR SELECT USING (true);
CREATE POLICY "Auth insert items" ON custody_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update items" ON custody_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Auth delete items" ON custody_items FOR DELETE USING (auth.uid() IS NOT NULL);
`

interface FormItem {
  item_number: number
  item_name: string
  quantity: number | null
  condition_at_receipt: string
  condition_at_return: string
}

interface FormState {
  recipient_name: string
  recipient_address: string
  usage_purpose: string
  usage_location: string
  phone_number: string
  receipt_date: string
  expected_return_date: string
  actual_return_date: string
  security_deposit: number
  recipient_signature_receipt: string
  recipient_signature_return: string
  officer_signature_receipt: string
  officer_signature_return: string
  items: FormItem[]
}

const emptyItems = (): FormItem[] =>
  Array.from({ length: 8 }, (_, i) => ({
    item_number: i + 1,
    item_name: '',
    quantity: null,
    condition_at_receipt: '',
    condition_at_return: '',
  }))

const emptyForm = (): FormState => ({
  recipient_name: '',
  recipient_address: '',
  usage_purpose: '',
  usage_location: '',
  phone_number: '',
  receipt_date: new Date().toISOString().split('T')[0],
  expected_return_date: '',
  actual_return_date: '',
  security_deposit: 50000,
  recipient_signature_receipt: '',
  recipient_signature_return: '',
  officer_signature_receipt: '',
  officer_signature_return: '',
  items: emptyItems(),
})

const statusLabel = (s: string) => ({
  active:   { label: 'نشط', color: 'bg-blue-50 text-blue-700' },
  returned: { label: 'مُرجع', color: 'bg-green-50 text-green-700' },
  overdue:  { label: 'متأخر', color: 'bg-red-50 text-red-700' },
}[s] ?? { label: s, color: 'bg-gray-50 text-gray-600' })

const arabicNum = (n: number) => n.toLocaleString('ar-EG')

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustodyFormPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [forms, setForms] = useState<CustodyForm[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [showSchema, setShowSchema] = useState(false)
  const [selectedForm, setSelectedForm] = useState<CustodyForm | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: formsData } = await supabase
      .from('custody_forms')
      .select('*')
      .order('created_at', { ascending: false })

    if (formsData) {
      const formsWithItems = await Promise.all(
        formsData.map(async (f) => {
          const { data: items } = await supabase
            .from('custody_items')
            .select('*')
            .eq('form_id', f.id)
            .order('item_number')
          return { ...f, items: items || [] }
        })
      )
      setForms(formsWithItems as CustodyForm[])
    }
    setLoading(false)
  }

  const generateFormNumber = () => {
    const now = new Date()
    return `EHD-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`
  }

  const resetForm = () => {
    setFormData(emptyForm())
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (form: CustodyForm) => {
    const items: FormItem[] = Array.from({ length: 8 }, (_, i) => {
      const existing = form.items.find(it => it.item_number === i + 1)
      return existing
        ? {
            item_number: existing.item_number,
            item_name: existing.item_name,
            quantity: existing.quantity,
            condition_at_receipt: existing.condition_at_receipt,
            condition_at_return: existing.condition_at_return,
          }
        : {
            item_number: i + 1,
            item_name: '',
            quantity: null,
            condition_at_receipt: '',
            condition_at_return: '',
          }
    })
    setFormData({
      recipient_name: form.recipient_name,
      recipient_address: form.recipient_address || '',
      usage_purpose: form.usage_purpose || '',
      usage_location: form.usage_location || '',
      phone_number: form.phone_number || '',
      receipt_date: form.receipt_date,
      expected_return_date: form.expected_return_date || '',
      actual_return_date: form.actual_return_date || '',
      security_deposit: form.security_deposit,
      recipient_signature_receipt: form.recipient_signature_receipt || '',
      recipient_signature_return: form.recipient_signature_return || '',
      officer_signature_receipt: form.officer_signature_receipt || '',
      officer_signature_return: form.officer_signature_return || '',
      items,
    })
    setEditingId(form.id)
    setShowForm(true)
    setActiveTab('new')
    setSelectedForm(null)
  }

  const handleSave = async () => {
    if (!formData.recipient_name.trim() || !formData.receipt_date) return
    setSaving(true)

    const payload = {
      recipient_name: formData.recipient_name.trim(),
      recipient_address: formData.recipient_address.trim() || null,
      usage_purpose: formData.usage_purpose.trim() || null,
      usage_location: formData.usage_location.trim() || null,
      phone_number: formData.phone_number.trim() || null,
      receipt_date: formData.receipt_date,
      expected_return_date: formData.expected_return_date || null,
      actual_return_date: formData.actual_return_date || null,
      security_deposit: formData.security_deposit,
      recipient_signature_receipt: formData.recipient_signature_receipt.trim() || null,
      recipient_signature_return: formData.recipient_signature_return.trim() || null,
      officer_signature_receipt: formData.officer_signature_receipt.trim() || null,
      officer_signature_return: formData.officer_signature_return.trim() || null,
      status: formData.actual_return_date ? 'returned' : 'active',
    }

    let formId = editingId
    if (editingId) {
      await supabase.from('custody_forms').update(payload).eq('id', editingId)
      await supabase.from('custody_items').delete().eq('form_id', editingId)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: newForm } = await supabase.from('custody_forms').insert({
        ...payload,
        form_number: generateFormNumber(),
        created_by: user?.id,
      }).select().single()
      formId = newForm?.id
    }

    if (formId) {
      const itemsToInsert = formData.items
        .filter(it => it.item_name.trim())
        .map(it => ({
          form_id: formId,
          item_number: it.item_number,
          item_name: it.item_name.trim(),
          quantity: it.quantity,
          condition_at_receipt: it.condition_at_receipt.trim() || null,
          condition_at_return: it.condition_at_return.trim() || null,
        }))
      if (itemsToInsert.length) {
        await supabase.from('custody_items').insert(itemsToInsert)
      }
    }

    setSaving(false)
    resetForm()
    setActiveTab('list')
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النموذج؟')) return
    await supabase.from('custody_forms').delete().eq('id', id)
    setSelectedForm(null)
    fetchData()
  }

  const updateItem = (index: number, field: string, value: string | number | null) => {
    const updated = [...formData.items]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, items: updated })
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-gray-50"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div className="bg-[#0f2a5e] text-white sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
          >
            رجوع
          </button>
          <h1 className="text-base font-semibold tracking-wide">نموذج استلام عهدة</h1>
          <div className="w-14" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Schema notice for admin */}
        {isAdmin && (
          <div className="mb-3">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="text-xs text-gray-400 underline cursor-pointer"
            >
              {showSchema ? 'إخفاء' : 'عرض'} SQL لإنشاء الجداول في Supabase
            </button>
            {showSchema && (
              <pre className="mt-2 bg-gray-800 text-green-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">
                {SQL_SCHEMA}
              </pre>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {['list', 'new'].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as 'list' | 'new')
                if (tab === 'list') { resetForm(); setSelectedForm(null) }
                else { resetForm(); setShowForm(true) }
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#0f2a5e] text-white'
                  : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab === 'list' ? `📋 النماذج المحفوظة (${forms.length})` : '+ نموذج جديد'}
            </button>
          ))}
        </div>

        {/* ─── LIST TAB ─────────────────────────────── */}
        {activeTab === 'list' && !selectedForm && (
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-[#0f2a5e] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📄</p>
                <p className="text-gray-400 text-sm">لا توجد نماذج محفوظة بعد</p>
                {isAdmin && (
                  <button
                    onClick={() => { setActiveTab('new'); setShowForm(true) }}
                    className="mt-4 bg-[#0f2a5e] text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                  >
                    إضافة أول نموذج
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {forms.map(form => {
                  const st = statusLabel(form.status)
                  return (
                    <button
                      key={form.id}
                      onClick={() => setSelectedForm(form)}
                      className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3.5 text-right transition-all hover:border-[#0f2a5e]/30 cursor-pointer"
                      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800">{form.recipient_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{form.form_number}</p>
                          <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                            <span>📅 {form.receipt_date}</span>
                            {form.usage_purpose && <span>🎯 {form.usage_purpose}</span>}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {form.items.length > 0
                              ? `${arabicNum(form.items.length)} صنف — ${form.items.slice(0, 2).map(i => i.item_name).join('، ')}${form.items.length > 2 ? '...' : ''}`
                              : 'لا أصناف'}
                          </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── DETAIL VIEW ──────────────────────────── */}
        {activeTab === 'list' && selectedForm && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedForm(null)}
                className="text-xs text-[#0f2a5e] underline cursor-pointer"
              >
                ← العودة للقائمة
              </button>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusLabel(selectedForm.status).color}`}>
                {statusLabel(selectedForm.status).label}
              </span>
            </div>

            {/* Form number header */}
            <div className="bg-[#0f2a5e] text-white rounded-xl p-4 text-center">
              <p className="text-xs opacity-70">جمعية نهضة العكنة الخيرية</p>
              <p className="text-base font-bold mt-1">نموذج استلام عهدة</p>
              <p className="text-xs opacity-70 mt-0.5">{selectedForm.form_number}</p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">أولاً: بيانات الجهة المستلمة</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {[
                  ['الاسم', selectedForm.recipient_name],
                  ['العنوان', selectedForm.recipient_address],
                  ['الغرض من الاستخدام', selectedForm.usage_purpose],
                  ['مكان الاستخدام', selectedForm.usage_location],
                  ['رقم الهاتف', selectedForm.phone_number],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-700">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2 — items */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">ثانياً: تفاصيل العهدة المستلمة</p>
              {selectedForm.items.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">لا أصناف مسجلة</p>
              ) : (
                <div className="space-y-2">
                  {selectedForm.items.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#0f2a5e]">#{arabicNum(item.item_number)}</span>
                        {item.quantity != null && (
                          <span className="text-xs text-gray-500">العدد: {arabicNum(item.quantity)}</span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{item.item_name}</p>
                      <div className="flex gap-4 mt-1.5 text-xs text-gray-500">
                        {item.condition_at_receipt && <span>عند الاستلام: {item.condition_at_receipt}</span>}
                        {item.condition_at_return && <span>عند الإرجاع: {item.condition_at_return}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3 — dates */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">التواريخ والأمانة</p>
              <div className="grid grid-cols-3 gap-3 text-center text-sm mb-3">
                {[
                  ['تاريخ الاستلام', selectedForm.receipt_date],
                  ['تاريخ الإرجاع المتوقع', selectedForm.expected_return_date],
                  ['تاريخ الإرجاع الفعلي', selectedForm.actual_return_date],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-bold text-gray-700 mt-0.5">{val || '—'}</p>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-600">مبلغ الأمانة</p>
                <p className="text-lg font-bold text-amber-700">
                  {selectedForm.security_deposit.toLocaleString('ar-EG')} جنيه
                </p>
              </div>
            </div>

            {/* Section 4 — signatures */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-100">رابعاً: إقرار وتعهد المستلم</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                أقر أنا الموقع أدناه بأنني استلمت العهدة المذكورة أعلاه بحالتها الموضحة أعلاه، وأتعهد بالمحافظة عليها وعدم استعمالها فيما يخالف أغراض جمعية نهضة العكنة الخيرية، والالتزام بإعادتها في الموعد المحدد.
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['اسم المستلم عند الاستلام', selectedForm.recipient_signature_receipt],
                  ['اسم المستلم عند الإرجاع', selectedForm.recipient_signature_return],
                  ['اسم مسؤول الجمعية عند التسليم', selectedForm.officer_signature_receipt],
                  ['اسم مسؤول الجمعية عند الإرجاع', selectedForm.officer_signature_return],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-semibold text-gray-700 mt-1">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedForm)}
                  className="flex-1 bg-[#0f2a5e] text-white py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#1a3d7a] transition-colors"
                >
                  تعديل النموذج
                </button>
                <button
                  onClick={() => handleDelete(selectedForm.id)}
                  className="bg-red-50 text-red-500 px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-100 transition-colors"
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── NEW / EDIT FORM ──────────────────────── */}
        {activeTab === 'new' && showForm && (
          <div className="space-y-4">

            {/* Section 1 */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">أولاً: بيانات الجهة المستلمة</p>
              <div className="space-y-3">
                {[
                  { key: 'recipient_name', label: 'الاسم *', placeholder: 'اسم المستلم', required: true },
                  { key: 'recipient_address', label: 'العنوان', placeholder: 'عنوان المستلم' },
                  { key: 'usage_purpose', label: 'الغرض من الاستخدام', placeholder: 'مثال: حفل زفاف، مناسبة اجتماعية' },
                  { key: 'usage_location', label: 'مكان الاستخدام', placeholder: 'موقع استخدام العهدة' },
                  { key: 'phone_number', label: 'رقم الهاتف', placeholder: '05XXXXXXXX' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
                    <input
                      required={field.required}
                      value={(formData[field.key as keyof FormState] as string)}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2 — items */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">ثانياً: تفاصيل العهدة المستلمة</p>
              <div className="space-y-3">
                {formData.items.map((item, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                    <p className="text-xs font-bold text-[#0f2a5e] mb-2">الصنف #{arabicNum(i + 1)}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input
                          value={item.item_name}
                          onChange={e => updateItem(i, 'item_name', e.target.value)}
                          placeholder="اسم الصنف"
                          className="w-full border border-gray-200 rounded-lg p-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                        />
                      </div>
                      <input
                        type="number"
                        value={item.quantity ?? ''}
                        onChange={e => updateItem(i, 'quantity', e.target.value ? Number(e.target.value) : null)}
                        placeholder="العدد"
                        className="border border-gray-200 rounded-lg p-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                      />
                      <input
                        value={item.condition_at_receipt}
                        onChange={e => updateItem(i, 'condition_at_receipt', e.target.value)}
                        placeholder="الحالة عند الاستلام"
                        className="border border-gray-200 rounded-lg p-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                      />
                      <div className="col-span-2">
                        <input
                          value={item.condition_at_return}
                          onChange={e => updateItem(i, 'condition_at_return', e.target.value)}
                          placeholder="الحالة عند الإرجاع (تُملأ لاحقاً)"
                          className="w-full border border-gray-200 rounded-lg p-2 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3 — dates */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">التواريخ والأمانة</p>
              <div className="space-y-3">
                {[
                  { key: 'receipt_date', label: 'تاريخ الاستلام *', type: 'date' },
                  { key: 'expected_return_date', label: 'تاريخ الإرجاع المتوقع', type: 'date' },
                  { key: 'actual_return_date', label: 'تاريخ الإرجاع الفعلي', type: 'date' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={(formData[field.key as keyof FormState] as string)}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">مبلغ الأمانة (جنيه)</label>
                  <input
                    type="number"
                    value={formData.security_deposit}
                    onChange={e => setFormData({ ...formData, security_deposit: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                  />
                </div>
              </div>

              {/* Deposit clause */}
              <div className="bg-amber-50 rounded-lg p-3 mt-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  يلتزم المستلم بدفع مبلغ وقدره <strong>{(formData.security_deposit).toLocaleString('ar-EG')}</strong> جنيه كأمانة تُسترد كاملة عند إعادة العهدة في الموعد المحدد وبحالة سليمة.
                </p>
              </div>
            </div>

            {/* Section 4 — signatures */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-bold text-gray-700 mb-4 pb-2 border-b border-gray-100">رابعاً: أسماء الإقرار والتوقيع</p>

              {/* Pledge text */}
              <div className="bg-blue-50/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-600 leading-relaxed">
                  أقر أنا الموقع أدناه بأنني استلمت العهدة المذكورة أعلاه بحالتها الموضحة، وأتعهد بالمحافظة عليها وعدم استعمالها فيما يخالف أغراض جمعية نهضة العكنة الخيرية، والالتزام بإعادتها في الموعد المحدد، كما أقر بتحملي كامل المسؤولية في حالة الفقدان أو التلف.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'recipient_signature_receipt', label: 'اسم المستلم عند الاستلام' },
                  { key: 'recipient_signature_return', label: 'اسم المستلم عند الإرجاع' },
                  { key: 'officer_signature_receipt', label: 'اسم مسؤول الجمعية عند التسليم' },
                  { key: 'officer_signature_return', label: 'اسم مسؤول الجمعية عند الإرجاع' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
                    <input
                      value={(formData[field.key as keyof FormState] as string)}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      placeholder="الاسم الكامل"
                      className="w-full border border-gray-200 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#0f2a5e]/30"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 pb-4">
              <button
                onClick={handleSave}
                disabled={saving || !formData.recipient_name.trim()}
                className="flex-1 bg-[#0f2a5e] text-white py-3 rounded-xl text-sm font-bold cursor-pointer hover:bg-[#1a3d7a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '...جاري الحفظ' : editingId ? 'تحديث النموذج' : 'حفظ النموذج'}
              </button>
              <button
                onClick={() => { resetForm(); setActiveTab('list') }}
                className="bg-gray-100 text-gray-500 px-5 py-3 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-gray-400 text-xs mt-6 pb-4">
          جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
        </p>
      </div>
    </div>
  )
}
