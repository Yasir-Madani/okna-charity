'use client'
// ============================================================
// app/dashboard/subscriptions/unpaid-quick/page.tsx
// قائمة سريعة بمن لم يدفع الشهر الحالي
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
  '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  return `${MONTH_NAMES[month]} ${year}`
}

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
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

type House = { id: string; name: string; house_number: number; sector: string }

export default function UnpaidQuickPage() {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [allHouses, setAllHouses] = useState<House[]>([])
  const [paidIds, setPaidIds] = useState<Set<string>>(new Set())
  const [defaultAmount, setDefaultAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterSector, setFilterSector] = useState('الكل')
  const [search, setSearch] = useState('')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const months = getValidMonths()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const [{ data: houses }, { data: subs }, { data: setting }] = await Promise.all([
      supabase.from('houses').select('id, name, house_number, sector').order('house_number'),
      supabase.from('subscriptions').select('house_id').eq('month', selectedMonth),
      supabase.from('settings').select('value').eq('key', `default_subscription_${selectedMonth}`).single()
    ])

    setAllHouses(houses || [])
    setPaidIds(new Set(subs?.map(s => s.house_id) || []))
    setDefaultAmount(setting ? parseInt(setting.value) || 0 : 0)
    setLoading(false)
  }, [selectedMonth, router])

  useEffect(() => { load() }, [load])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // تسجيل دفعة مباشرة من هنا
  const markAsPaid = async (house: House) => {
    if (!defaultAmount) { showToast('⚠️ لا يوجد مبلغ افتراضي لهذا الشهر — اذهب لصفحة الاشتراكات'); return }

    // ✅ رسالة تأكيد قبل تنفيذ الدفع
    const confirmed = window.confirm(`هل تريد تسجيل دفعة لـ ${house.name}؟\nالمبلغ: ${defaultAmount.toLocaleString()} جنيه`)
    if (!confirmed) return

    setMarkingPaid(house.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('subscriptions').upsert({
      house_id: house.id,
      month: selectedMonth,
      amount: defaultAmount,
      created_by: user?.id
    }, { onConflict: 'house_id,month' })

    if (!error) {
      setPaidIds(prev => new Set([...prev, house.id]))
      showToast(`✓ تم تسجيل دفعة ${house.name}`)
    } else {
      showToast('❌ حدث خطأ')
    }
    setMarkingPaid(null)
  }

  const sectors = useMemo(() => ['الكل', ...Array.from(new Set(allHouses.map(h => h.sector)))], [allHouses])

  const unpaidHouses = useMemo(() =>
    allHouses
      .filter(h => {
        if (paidIds.has(h.id)) return false
        if (filterSector !== 'الكل' && h.sector !== filterSector) return false
        if (search.trim() && !h.name.includes(search.trim()) && !String(h.house_number).includes(search.trim())) return false
        return true
      })
      .sort((a, b) => a.house_number - b.house_number),
    [allHouses, paidIds, filterSector, search]
  )

  const paidCount = paidIds.size
  const unpaidCount = allHouses.length - paidCount
  const collectionRate = allHouses.length > 0 ? Math.round((paidCount / allHouses.length) * 100) : 0

  const exportCSV = () => {
    const BOM = '\uFEFF'
    const rows = [['رقم المنزل', 'اسم المنزل', 'المحور', 'المبلغ المطلوب'].join(',')]
    unpaidHouses.forEach(h => {
      rows.push([h.house_number, `"${h.name}"`, `"${h.sector}"`, defaultAmount || '—'].join(','))
    })
    const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `غير_المدفوعين_${formatMonth(selectedMonth)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* هيدر */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div>
          <h1 className="text-base font-bold">لم يدفعوا بعد</h1>
          <p className="text-green-200 text-xs">{formatMonth(selectedMonth)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer font-bold">📊 تصدير</button>
          <button onClick={() => router.push('/dashboard/subscriptions')} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer">رجوع</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* إحصاءات سريعة */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{paidCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">دفعوا</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-3 shadow-sm text-center bg-red-50">
            <p className="text-2xl font-bold text-red-500">{unpaidCount}</p>
            <p className="text-xs text-gray-400 mt-0.5">لم يدفعوا</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm text-center">
            <p className={`text-2xl font-bold ${collectionRate >= 80 ? 'text-green-600' : collectionRate >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
              {collectionRate}%
            </p>
            <p className="text-xs text-gray-400 mt-0.5">نسبة الالتزام</p>
          </div>
        </div>

        {/* شريط تقدم */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>نسبة التحصيل</span>
            <span>{paidCount} من {allHouses.length} منزل</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 50 ? 'bg-orange-400' : 'bg-red-400'}`}
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>

        {/* فلاتر */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {months.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              placeholder="بحث باسم أو رقم..."
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <select
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {defaultAmount > 0 && (
            <p className="text-xs text-green-600 text-center">
              💰 المبلغ الافتراضي لهذا الشهر: <strong>{defaultAmount.toLocaleString()} جنيه</strong>
            </p>
          )}
          {!defaultAmount && (
            <p className="text-xs text-red-400 text-center">⚠️ لا يوجد مبلغ افتراضي لهذا الشهر</p>
          )}
        </div>

        {/* القائمة */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">جاري التحميل...</p>
        ) : unpaidHouses.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-600 font-bold text-base">الجميع دفع!</p>
            <p className="text-gray-400 text-sm mt-1">لا يوجد منازل متأخرة في هذا الشهر</p>
          </div>
        ) : (
          <>
            <div className="bg-black text-white rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-bold">المنازل غير المدفوعة</span>
              <span className="text-xs opacity-60">{unpaidHouses.length} منزل</span>
            </div>

            <div className="space-y-2">
              {unpaidHouses.map(house => (
                <div
                  key={house.id}
                  className="bg-white rounded-xl border border-red-100 shadow-sm px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{house.house_number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{house.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{house.sector}</span>
                      {defaultAmount > 0 && (
                        <span className="text-xs text-red-400">{defaultAmount.toLocaleString()} ج مطلوب</span>
                      )}
                    </div>
                  </div>
                  {/* ✅ تم تغيير النص وإضافة رسالة التأكيد */}
                  <button
                    onClick={() => markAsPaid(house)}
                    disabled={markingPaid === house.id || !defaultAmount}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0"
                  >
                    {markingPaid === house.id ? '...' : 'قم بعملية دفع'}
                  </button>
                </div>
              ))}
            </div>

            {defaultAmount > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-xs text-red-600">
                  إجمالي المبلغ الضائع من {unpaidHouses.length} منزل:
                  <strong className="text-red-700 text-sm mr-1">{(unpaidHouses.length * defaultAmount).toLocaleString()} جنيه</strong>
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-3 rounded-xl text-sm shadow-lg z-50 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}
