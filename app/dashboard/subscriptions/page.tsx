'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import { useRouter } from 'next/navigation'



// =============================================
// الأنواع
// =============================================
type House = {
  id: string
  name: string
  number: number
  sector: string
}

type Subscription = {
  id?: string
  house_id: string
  month: string
  amount: number
  notes?: string | null   // ← أضف | null هنا
  created_by?: string
}

type OverdueInfo = {
  months: number
  total: number
}

type PaymentEntry = {
  amount: string
  notes: string
}

// =============================================
// الثوابت
// =============================================
const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
  '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  return `${MONTH_NAMES[month]} ${year}`
}

function getLast12Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
  }
  return months
}

function getCurrentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

// =============================================
// المكوّن الرئيسي
// =============================================
export default function SubscriptionsPage() {
  const router = useRouter()

  const [houses, setHouses] = useState<House[]>([])
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [monthlyData, setMonthlyData] = useState<Record<string, Subscription>>({})
  const [overdueMap, setOverdueMap] = useState<Record<string, OverdueInfo>>({})
  const [defaultAmount, setDefaultAmount] = useState('50')
  const [entries, setEntries] = useState<Record<string, PaymentEntry>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [filterSector, setFilterSector] = useState('الكل')
  const [filterStatus, setFilterStatus] = useState('الكل')

  const months = getLast12Months()

  // =============================================
  // تحميل البيانات
  // =============================================
  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    loadAll()
  }, [router])

  useEffect(() => { checkUser() }, [checkUser])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadHouses(), loadDefaultAmount()])
    setLoading(false)
  }

  const loadHouses = async () => {
    const { data } = await supabase
      .from('houses')
      .select('id, name, number, sector')
      .order('number', { ascending: true })
    if (data) setHouses(data)
  }

  const loadDefaultAmount = async () => {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'default_subscription')
      .single()
    if (data) setDefaultAmount(data.value)
  }

  // تحميل اشتراكات الشهر المحدد
  const loadMonthData = useCallback(async () => {
    if (houses.length === 0) return

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('month', selectedMonth)

    const map: Record<string, Subscription> = {}
    if (data) {
      data.forEach(sub => { map[sub.house_id] = sub })
    }
    setMonthlyData(map)

    // تعبئة حقول الإدخال من البيانات المحفوظة
    const newEntries: Record<string, PaymentEntry> = {}
    houses.forEach(h => {
      const existing = map[h.id]
      newEntries[h.id] = {
        amount: existing ? String(existing.amount) : '',
        notes: existing?.notes || ''
      }
    })
    setEntries(newEntries)

    // حساب المتأخرات
    await computeOverdue()
  }, [houses, selectedMonth])

  useEffect(() => { loadMonthData() }, [loadMonthData])

  // حساب عدد أشهر التأخر والمبلغ المتراكم لكل منزل
  const computeOverdue = async () => {
    if (houses.length === 0) return

    const { data: allSubs } = await supabase
      .from('subscriptions')
      .select('house_id, month, amount')

    const paidMap: Record<string, Set<string>> = {}
    if (allSubs) {
      allSubs.forEach(s => {
        if (!paidMap[s.house_id]) paidMap[s.house_id] = new Set()
        paidMap[s.house_id].add(s.month)
      })
    }

    // نحسب من أول شهر وجود المشروع حتى الشهر السابق للمحدد
    const [selYear, selMonthNum] = selectedMonth.split('-').map(Number)
    const overdue: Record<string, OverdueInfo> = {}
    const defAmt = parseInt(defaultAmount) || 0

    houses.forEach(h => {
      let overdueMonths = 0
      let overdueTotal = 0
      const paid = paidMap[h.id] || new Set()

      // فحص آخر 24 شهر كحد أقصى
      for (let i = 1; i <= 24; i++) {
        const d = new Date(selYear, selMonthNum - 1 - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!paid.has(key)) {
          overdueMonths++
          overdueTotal += defAmt
        }
      }

      if (overdueMonths > 0) {
        overdue[h.id] = { months: overdueMonths, total: overdueTotal }
      }
    })

    setOverdueMap(overdue)
  }

  // =============================================
  // الإجراءات
  // =============================================
  const saveDefaultAmount = async (value: string) => {
    setDefaultAmount(value)
    await supabase
      .from('settings')
      .upsert({ key: 'default_subscription', value, updated_at: new Date().toISOString() })
  }

  const fillAllDefault = () => {
    const newEntries = { ...entries }
    houses.forEach(h => {
      if (!newEntries[h.id]?.amount) {
        newEntries[h.id] = {
          ...newEntries[h.id],
          amount: defaultAmount
        }
      }
    })
    setEntries(newEntries)
    showToast('تم تعبئة المبالغ الافتراضية')
  }

  const saveAll = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const toSave: Subscription[] = []
    houses.forEach(h => {
      const entry = entries[h.id]
      const amount = parseInt(entry?.amount || '0')
      if (amount > 0) {
        toSave.push({
          house_id: h.id,
          month: selectedMonth,
          amount,
          notes: entry?.notes || null,
          created_by: user.id
        })
      }
    })

    if (toSave.length === 0) {
      showToast('لا توجد مبالغ للحفظ')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .upsert(toSave, { onConflict: 'house_id,month' })

    if (error) {
      showToast('حدث خطأ أثناء الحفظ')
    } else {
      showToast(`تم حفظ ${toSave.length} اشتراك بنجاح ✓`)
      await loadMonthData()
    }

    setSaving(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // =============================================
  // الإحصائيات
  // =============================================
  const filteredHouses = houses.filter(h => {
    if (filterSector !== 'الكل' && h.sector !== filterSector) return false
    if (filterStatus === 'مدفوع' && !monthlyData[h.id]) return false
    if (filterStatus === 'غير مدفوع' && monthlyData[h.id]) return false
    if (filterStatus === 'متأخر' && !overdueMap[h.id]) return false
    return true
  })

  const paidCount = houses.filter(h => monthlyData[h.id]).length
  const unpaidCount = houses.length - paidCount
  const overdueCount = Object.keys(overdueMap).length
  const totalCollected = Object.values(monthlyData).reduce((s, sub) => s + sub.amount, 0)

  const sectors = ['الكل', ...Array.from(new Set(houses.map(h => h.sector)))]

  // =============================================
  // العرض
  // =============================================
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <p className="text-gray-500">جاري التحميل...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* شريط العنوان */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">إدارة الاشتراكات الشهرية</h1>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm cursor-pointer transition-colors"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* بطاقات الإحصاء */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي المنازل', value: houses.length, color: 'text-gray-800' },
            { label: 'دفعوا هذا الشهر', value: paidCount, color: 'text-green-700' },
            { label: 'لم يدفعوا', value: unpaidCount, color: 'text-red-600' },
            { label: 'المحصّل', value: `${totalCollected} ريال`, color: 'text-green-700' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* شريط التحكم */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">

            {/* اختيار الشهر */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">الشهر</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {months.map(m => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
            </div>

            {/* المبلغ الافتراضي */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">المبلغ الافتراضي (ريال)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={defaultAmount}
                  onChange={e => setDefaultAmount(e.target.value)}
                  onBlur={e => saveDefaultAmount(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                />
                <button
                  onClick={fillAllDefault}
                  className="text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  تعبئة الكل
                </button>
              </div>
            </div>

            {/* فلتر المحور */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">المحور</label>
              <select
                value={filterSector}
                onChange={e => setFilterSector(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* فلتر الحالة */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">الحالة</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {['الكل', 'مدفوع', 'غير مدفوع', 'متأخر'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* زر حفظ الكل */}
            <div className="mr-auto">
              <button
                onClick={saveAll}
                disabled={saving}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الكل ✓'}
              </button>
            </div>
          </div>
        </div>

        {/* الجدول الرئيسي */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* رأس الجدول */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
            <div className="col-span-4">المنزل</div>
            <div className="col-span-3 text-center">المتأخرات</div>
            <div className="col-span-2 text-center">المبلغ (ريال)</div>
            <div className="col-span-3 text-center">الحالة</div>
          </div>

          {/* صفوف المنازل */}
          {filteredHouses.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">لا توجد نتائج</p>
          ) : (
            filteredHouses.map(house => {
              const saved = monthlyData[house.id]
              const overdue = overdueMap[house.id]
              const entry = entries[house.id] || { amount: '', notes: '' }

              return (
                <div
                  key={house.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center
                    ${overdue ? 'bg-red-50/40' : 'hover:bg-gray-50'} transition-colors`}
                >
                  {/* اسم المنزل */}
                  <div className="col-span-4">
                    <p className="text-sm font-bold text-gray-800">
                      منزل {house.name}
                      <span className="text-gray-400 font-normal text-xs mr-1">#{house.number}</span>
                    </p>
                    <span className="inline-block mt-0.5 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {house.sector}
                    </span>
                  </div>

                  {/* المتأخرات */}
                  <div className="col-span-3 text-center">
                    {overdue ? (
                      <div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                          {overdue.months} شهر
                        </span>
                        <p className="text-xs text-red-600 mt-0.5 font-bold">{overdue.total} ريال</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* حقل الإدخال */}
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="number"
                      min="0"
                      value={entry.amount}
                      placeholder={defaultAmount}
                      onChange={e => setEntries(prev => ({
                        ...prev,
                        [house.id]: { ...prev[house.id], amount: e.target.value }
                      }))}
                      className={`w-20 border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 transition
                        ${saved ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'}`}
                    />
                  </div>

                  {/* الحالة */}
                  <div className="col-span-3 text-center">
                    {saved ? (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                        مدفوع ✓
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">لم يُدفع</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ملخص نهاية الصفحة */}
        <div className="text-center text-sm text-gray-400 pb-4">
          عرض {filteredHouses.length} من {houses.length} منزل
          {' · '}{formatMonth(selectedMonth)}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 animate-bounce-in">
          {toast}
        </div>
      )}
    </div>
  )
}
