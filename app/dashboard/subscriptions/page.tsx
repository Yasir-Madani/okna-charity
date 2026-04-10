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

function getValidMonths(): string[] {
  const months: string[] = []
  const start = new Date(2026, 0, 1)
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), 1)
  while (d >= start) {
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
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
  const [showFilters, setShowFilters] = useState(false)

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

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('month', selectedMonth)

    const map: Record<string, Subscription> = {}
    if (data) data.forEach(sub => { map[sub.house_id] = sub })
    setMonthlyData(map)

    if (data && data.length > 0) {
      setDefaultAmount(String(data[0].amount))
    } else {
      setDefaultAmount('')
    }

    const newEntries: Record<string, PaymentEntry> = {}
    houses.forEach(h => {
      const existing = map[h.id]
      newEntries[h.id] = existing
        ? { amount: String(existing.amount), checked: true }
        : { amount: '', checked: false }
    })
    setEntries(newEntries)
    await computeOverdue(map)
  }, [houses, selectedMonth])

  useEffect(() => { loadMonthData() }, [loadMonthData])

  const computeOverdue = async (currentMap: Record<string, Subscription>) => {
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
        if (!paid.has(key)) { overdueMonths++; overdueTotal += defAmt }
        cursor.setMonth(cursor.getMonth() - 1)
      }
      if (overdueMonths > 0) overdue[h.id] = { months: overdueMonths, total: overdueTotal }
    })
    setOverdueMap(overdue)
  }

  const handleCheck = (houseId: string, checked: boolean) => {
    setEntries(prev => ({
      ...prev,
      [houseId]: { amount: checked ? defaultAmount : '', checked }
    }))
  }

  const saveDefaultAmount = async (value: string) => {
    setDefaultAmount(value)
    await supabase.from('settings')
      .upsert({ key: 'default_subscription', value, updated_at: new Date().toISOString() })
  }

  const fillAllDefault = () => {
    if (!defaultAmount) { showToast('أدخل المبلغ الافتراضي أولاً'); return }
    const newEntries = { ...entries }
    houses.forEach(h => {
      if (!newEntries[h.id]?.checked)
        newEntries[h.id] = { amount: defaultAmount, checked: true }
    })
    setEntries(newEntries)
    showToast('تم تعبئة الكل')
  }

  const uncheckAll = () => {
    const newEntries = { ...entries }
    houses.forEach(h => { newEntries[h.id] = { amount: '', checked: false } })
    setEntries(newEntries)
    showToast('تم إلغاء تحديد الكل')
  }

  const saveAll = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const toSave: Subscription[] = []
    const toDelete: string[] = []

    houses.forEach(h => {
      const entry = entries[h.id]
      const wasSaved = monthlyData[h.id]
      if (entry?.checked) {
        const amount = parseInt(entry.amount || defaultAmount)
        if (amount > 0) toSave.push({ house_id: h.id, month: selectedMonth, amount, created_by: user.id })
      } else if (wasSaved) {
        toDelete.push(h.id)
      }
    })

    if (toSave.length > 0) {
      await supabase.from('subscriptions').upsert(toSave, { onConflict: 'house_id,month' })
    }
    if (toDelete.length > 0) {
      await supabase.from('subscriptions').delete().eq('month', selectedMonth).in('house_id', toDelete)
    }
    if (toSave.length === 0 && toDelete.length === 0) {
      showToast('لا توجد تغييرات للحفظ')
      setSaving(false)
      return
    }

    showToast(`تم الحفظ ✓`)
    await loadMonthData()
    setSaving(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

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
      <p className="text-gray-500 text-sm">جاري التحميل...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ===== شريط العنوان ===== */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="text-base font-bold">الاشتراكات الشهرية</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/dashboard/subscriptions/overdue-report')}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            المتأخرون
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            رجوع
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* ===== بطاقات الإحصاء ===== */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-400">إجمالي المنازل</p>
            <p className="text-2xl font-bold text-gray-800 mt-0.5">{houses.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-400">دفعوا هذا الشهر</p>
            <p className="text-2xl font-bold text-green-600 mt-0.5">{paidCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-400">لم يدفعوا</p>
            <p className="text-2xl font-bold text-red-500 mt-0.5">{unpaidCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-400">المحصّل</p>
            <p className="text-lg font-bold text-green-600 mt-0.5">{totalCollected.toLocaleString()} ج</p>
          </div>
        </div>

        {/* ===== شريط التحكم الرئيسي ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-3">

          {/* الشهر + المبلغ الافتراضي */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">الشهر</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {months.map(m => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">المبلغ الافتراضي</label>
              <input
                type="number"
                min="0"
                value={defaultAmount}
                placeholder="أدخل المبلغ"
                onChange={e => setDefaultAmount(e.target.value)}
                onBlur={e => saveDefaultAmount(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
              />
            </div>
          </div>

          {/* أزرار التعبئة */}
{/*
<div className="flex gap-2">
  <button
    onClick={fillAllDefault}
    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors"
  >
    تعبئة الكل ✓
  </button>
  <button
    onClick={uncheckAll}
    className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-colors"
  >
    إلغاء الكل ✗
  </button>
</div>
*/}

          {/* فلاتر - قابلة للطي */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full text-xs text-gray-400 flex items-center justify-center gap-1 py-1 cursor-pointer"
          >
            {showFilters ? 'إخفاء الفلاتر ▲' : 'إظهار الفلاتر ▼'}
          </button>

          {showFilters && (
            <div className="flex gap-2 pt-1 border-t border-gray-100">
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">المحور</label>
                <select
                  value={filterSector}
                  onChange={e => setFilterSector(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 block mb-1">الحالة</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {['الكل', 'مدفوع', 'غير مدفوع', 'متأخر'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ===== قائمة المنازل - بطاقات ===== */}
        <div className="space-y-2">
          {filteredHouses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">لا توجد نتائج</div>
          ) : (
            filteredHouses.map(house => {
              const saved = monthlyData[house.id]
              const overdue = overdueMap[house.id]
              const entry = entries[house.id] || { amount: '', checked: false }
              const isPaid = saved && entry.checked
              const isReadyToSave = !saved && entry.checked

              return (
                <div
                  key={house.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all
                    ${isPaid ? 'border-green-200' : overdue && !entry.checked ? 'border-red-200' : 'border-gray-200'}`}
                >
                  {/* رأس البطاقة */}
                  <div className={`px-4 py-3 flex justify-between items-center
                    ${isPaid ? 'bg-green-50' : overdue && !entry.checked ? 'bg-red-50' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{house.house_number}</span>
                      <span className="font-bold text-gray-800 text-sm">{house.name}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {house.sector}
                      </span>
                    </div>

                    {/* الحالة */}
                    {isPaid ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                        مدفوع ✓
                      </span>
                    ) : isReadyToSave ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">
                        جاهز ◎
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 px-2 py-1 rounded-full border border-gray-200">
                        لم يُدفع
                      </span>
                    )}
                  </div>

                  {/* تفاصيل المتأخرات */}
                  {overdue && !entry.checked && (
                    <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        {overdue.months} شهر متأخر
                      </span>
                      <span className="text-xs text-red-600 font-bold">
                        {overdue.total.toLocaleString()} جنيه متراكم
                      </span>
                    </div>
                  )}

                  {/* صف الإدخال */}
                  <div className="px-4 py-3 flex items-center gap-3">

                    {/* Checkbox كبير للموبايل */}
                    <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                      <div
                        onClick={() => handleCheck(house.id, !entry.checked)}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer
                          ${entry.checked
                            ? 'bg-green-600 border-green-600'
                            : 'bg-white border-gray-300'
                          }`}
                      >
                        {entry.checked && (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">دفع</span>
                    </label>

                    {/* حقل المبلغ */}
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        value={entry.amount}
                        placeholder={entry.checked ? defaultAmount : '—'}
                        disabled={!entry.checked}
                        onChange={e => setEntries(prev => ({
                          ...prev,
                          [house.id]: { ...prev[house.id], amount: e.target.value }
                        }))}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-green-500 transition
                          ${entry.checked
                            ? isPaid
                              ? 'border-green-300 bg-green-50 text-green-800'
                              : 'border-gray-300 bg-white text-gray-800'
                            : 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                      />
                    </div>

                    <span className="text-xs text-gray-400 flex-shrink-0">جنيه</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <p className="text-center text-xs text-gray-400 pb-2">
          {filteredHouses.length} من {houses.length} منزل · {formatMonth(selectedMonth)}
        </p>
      </div>

      {/* ===== زر الحفظ ثابت في الأسفل ===== */}
      <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 px-4 py-3 z-20 shadow-lg">
        <button
          onClick={saveAll}
          disabled={saving}
          className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white py-3.5 rounded-xl text-base font-bold cursor-pointer transition-colors shadow-sm"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الكل ✓'}
        </button>
      </div>

      {/* مسافة للزر الثابت */}
      <div className="h-20" />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
