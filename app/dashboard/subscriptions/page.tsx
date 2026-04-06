'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

type House = {
  id: string
  name: string
  house_number: number
  sector: string
}

type Subscription = {
  id?: string
  house_id: string
  month: string
  amount: number
  notes?: string | null
  created_by?: string
}

type OverdueInfo = {
  months: number
  total: number
}

type PaymentEntry = {
  amount: string
  checked: boolean
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
  '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  return `${MONTH_NAMES[month]} ${year}`
}

// الأشهر من يناير 2026 فصاعداً فقط
function getValidMonths(): string[] {
  const months: string[] = []
  const start = new Date(2026, 0, 1)
  const now = new Date()
  const current = new Date(now.getFullYear(), now.getMonth(), 1)
  const d = new Date(current)
  while (d >= start) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function SubscriptionsPage() {
  const router = useRouter()

  const [houses, setHouses] = useState<House[]>([])
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [monthlyData, setMonthlyData] = useState<Record<string, Subscription>>({})
  const [overdueMap, setOverdueMap] = useState<Record<string, OverdueInfo>>({})
  const [defaultAmount, setDefaultAmount] = useState('')
  const [entries, setEntries] = useState<Record<string, PaymentEntry>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [filterSector, setFilterSector] = useState('الكل')
  const [filterStatus, setFilterStatus] = useState('الكل')

  const months = getValidMonths()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    await loadHouses()
    setLoading(false)
  }, [router])

  useEffect(() => { checkUser() }, [checkUser])

  const loadHouses = async () => {
    const { data } = await supabase
      .from('houses')
      .select('id, name, house_number, sector')
      .order('house_number', { ascending: true })
    if (data) setHouses(data)
  }

  const loadMonthData = useCallback(async () => {
    if (houses.length === 0) return

    // جلب اشتراكات الشهر المحدد
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('month', selectedMonth)

    const map: Record<string, Subscription> = {}
    if (data) data.forEach(sub => { map[sub.house_id] = sub })
    setMonthlyData(map)

    const hasSavedData = data && data.length > 0

    // إذا الشهر مدخل مسبقاً → استدعاء المبالغ المحفوظة + تفعيل checkbox
    // إذا شهر جديد → مسح المبلغ الافتراضي + checkbox غير مفعل
    if (hasSavedData) {
      // استدعاء أول مبلغ محفوظ كمبلغ افتراضي للعرض
      const firstAmount = String(data![0].amount)
      setDefaultAmount(firstAmount)
    } else {
      setDefaultAmount('')
    }

    const newEntries: Record<string, PaymentEntry> = {}
    houses.forEach(h => {
      const existing = map[h.id]
      if (existing) {
        newEntries[h.id] = { amount: String(existing.amount), checked: true }
      } else {
        newEntries[h.id] = { amount: '', checked: false }
      }
    })
    setEntries(newEntries)

    await computeOverdue()
  }, [houses, selectedMonth])

  useEffect(() => { loadMonthData() }, [loadMonthData])

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

    const [selYear, selMonthNum] = selectedMonth.split('-').map(Number)
    const overdue: Record<string, OverdueInfo> = {}
    const defAmt = parseInt(defaultAmount) || 0
    const startDate = new Date(2026, 0, 1)

    houses.forEach(h => {
      let overdueMonths = 0
      let overdueTotal = 0
      const paid = paidMap[h.id] || new Set()
      const cursor = new Date(selYear, selMonthNum - 2, 1)
      while (cursor >= startDate) {
        const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`
        if (!paid.has(key)) {
          overdueMonths++
          overdueTotal += defAmt
        }
        cursor.setMonth(cursor.getMonth() - 1)
      }
      if (overdueMonths > 0) {
        overdue[h.id] = { months: overdueMonths, total: overdueTotal }
      }
    })

    setOverdueMap(overdue)
  }

  // تفعيل checkbox → يضع المبلغ الافتراضي ويغير الحالة لـ "جاهز للحفظ"
  const handleCheck = (houseId: string, checked: boolean) => {
    setEntries(prev => ({
      ...prev,
      [houseId]: {
        amount: checked ? defaultAmount : '',
        checked
      }
    }))
  }

  const saveDefaultAmount = async (value: string) => {
    setDefaultAmount(value)
    await supabase
      .from('settings')
      .upsert({ key: 'default_subscription', value, updated_at: new Date().toISOString() })
  }

  // تعبئة الكل → تفعيل checkbox لكل المنازل غير المحددة
  const fillAllDefault = () => {
    if (!defaultAmount) {
      showToast('أدخل المبلغ الافتراضي أولاً')
      return
    }
    const newEntries = { ...entries }
    houses.forEach(h => {
      if (!newEntries[h.id]?.checked) {
        newEntries[h.id] = { amount: defaultAmount, checked: true }
      }
    })
    setEntries(newEntries)
    showToast('تم تعبئة الكل بالمبلغ الافتراضي')
  }

  const saveAll = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const toSave: Subscription[] = []
    houses.forEach(h => {
      const entry = entries[h.id]
      if (entry?.checked) {
        const amount = parseInt(entry.amount || defaultAmount)
        if (amount > 0) {
          toSave.push({
            house_id: h.id,
            month: selectedMonth,
            amount,
            created_by: user.id
          })
        }
      }
    })

    if (toSave.length === 0) {
      showToast('حدد المنازل التي دفعت أولاً')
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

  const paidCount = Object.keys(monthlyData).length
  const unpaidCount = houses.length - paidCount
  const totalCollected = Object.values(monthlyData).reduce((s, sub) => s + sub.amount, 0)
  const sectors = ['الكل', ...Array.from(new Set(houses.map(h => h.sector)))]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <p className="text-gray-500">جاري التحميل...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">إدارة الاشتراكات الشهرية</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/subscriptions/overdue-report')}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm cursor-pointer transition-colors"
          >
            تقرير المتأخرين
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm cursor-pointer transition-colors"
          >
            رجوع
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">

        {/* الإحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي المنازل', value: houses.length, color: 'text-gray-800' },
            { label: 'دفعوا هذا الشهر', value: paidCount, color: 'text-green-700' },
            { label: 'لم يدفعوا', value: unpaidCount, color: 'text-red-600' },
            { label: 'المحصّل هذا الشهر', value: `${totalCollected.toLocaleString()} جنيه`, color: 'text-green-700' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* شريط التحكم */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-end">

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

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">المبلغ الافتراضي (جنيه)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={defaultAmount}
                  placeholder="أدخل المبلغ"
                  onChange={e => setDefaultAmount(e.target.value)}
                  onBlur={e => saveDefaultAmount(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                />
                <button
                  onClick={fillAllDefault}
                  className="text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                >
                  تعبئة الكل
                </button>
              </div>
            </div>

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

        {/* الجدول */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500">
            <div className="col-span-1 text-center">رقم</div>
            <div className="col-span-3">المنزل</div>
            <div className="col-span-2 text-center">المتأخرات</div>
            <div className="col-span-2 text-center">المبلغ (جنيه)</div>
            <div className="col-span-2 text-center">دفع؟</div>
            <div className="col-span-2 text-center">الحالة</div>
          </div>

          {filteredHouses.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">لا توجد نتائج</p>
          ) : (
            filteredHouses.map(house => {
              const saved = monthlyData[house.id]
              const overdue = overdueMap[house.id]
              const entry = entries[house.id] || { amount: '', checked: false }

              return (
                <div
                  key={house.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center
                    ${overdue ? 'bg-red-50/40' : 'hover:bg-gray-50'} transition-colors`}
                >
                  {/* رقم المنزل */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-bold text-gray-500">#{house.house_number}</span>
                  </div>

                  {/* اسم المنزل */}
                  <div className="col-span-3">
                    <p className="text-sm font-bold text-gray-800">{house.name}</p>
                    <span className="inline-block mt-0.5 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      {house.sector}
                    </span>
                  </div>

                  {/* المتأخرات */}
                  <div className="col-span-2 text-center">
                    {overdue ? (
                      <div>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                          {overdue.months} شهر
                        </span>
                        <p className="text-xs text-red-600 mt-0.5 font-bold">{overdue.total.toLocaleString()} جنيه</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* حقل المبلغ */}
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="number"
                      min="0"
                      value={entry.amount}
                      placeholder="—"
                      disabled={!entry.checked}
                      onChange={e => setEntries(prev => ({
                        ...prev,
                        [house.id]: { ...prev[house.id], amount: e.target.value }
                      }))}
                      className={`w-24 border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 transition
                        ${entry.checked
                          ? saved ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        }`}
                    />
                  </div>

                  {/* Checkbox */}
                  <div className="col-span-2 flex justify-center">
                    <input
                      type="checkbox"
                      checked={entry.checked}
                      onChange={e => handleCheck(house.id, e.target.checked)}
                      className="w-5 h-5 accent-green-600 cursor-pointer"
                    />
                  </div>

                  {/* الحالة */}
                  <div className="col-span-2 text-center">
                    {saved ? (
                      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">
                        مدفوع ✓
                      </span>
                    ) : entry.checked ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">
                        جاهز للحفظ
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

        <div className="text-center text-sm text-gray-400 pb-4">
          عرض {filteredHouses.length} من {houses.length} منزل · {formatMonth(selectedMonth)}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
