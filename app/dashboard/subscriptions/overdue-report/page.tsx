'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type House = {
  id: string
  name: string
  number: number
  sector: string
}

type OverdueHouse = {
  house: House
  overdueMonths: string[]   // قائمة الأشهر المتأخرة
  totalOwed: number
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

function getLast24Months(): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = 1; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export default function OverdueReportPage() {
  const router = useRouter()
  const [overdueList, setOverdueList] = useState<OverdueHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultAmount, setDefaultAmount] = useState(50)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    // جلب المبلغ الافتراضي
    const { data: setting } = await supabase
      .from('settings').select('value').eq('key', 'default_subscription').single()
    const defAmt = setting ? parseInt(setting.value) : 50
    setDefaultAmount(defAmt)

    // جلب المنازل
    const { data: houses } = await supabase
      .from('houses').select('id, name, number, sector').order('number')

    // جلب كل الاشتراكات
    const { data: subs } = await supabase
      .from('subscriptions').select('house_id, month, amount')

    if (!houses) { setLoading(false); return }

    const paidMap: Record<string, Set<string>> = {}
    subs?.forEach(s => {
      if (!paidMap[s.house_id]) paidMap[s.house_id] = new Set()
      paidMap[s.house_id].add(s.month)
    })

    const last24 = getLast24Months()
    const result: OverdueHouse[] = []

    houses.forEach(house => {
      const paid = paidMap[house.id] || new Set()
      const overdueMonths = last24.filter(m => !paid.has(m))
      if (overdueMonths.length > 0) {
        result.push({
          house,
          overdueMonths,
          totalOwed: overdueMonths.length * defAmt
        })
      }
    })

    // ترتيب تنازلي بعدد الأشهر
    result.sort((a, b) => b.overdueMonths.length - a.overdueMonths.length)
    setOverdueList(result)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const totalOwedAll = overdueList.reduce((s, o) => s + o.totalOwed, 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <p className="text-gray-500">جاري التحميل...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-red-700 text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">تقرير المتأخرين عن السداد</h1>
        <button
          onClick={() => router.push('/dashboard/subscriptions')}
          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm cursor-pointer"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">

        {/* ملخص */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">منازل متأخرة</p>
            <p className="text-2xl font-bold text-red-600">{overdueList.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">إجمالي المتأخرات</p>
            <p className="text-2xl font-bold text-red-600">{totalOwedAll} ريال</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">المبلغ الشهري</p>
            <p className="text-2xl font-bold text-gray-700">{defaultAmount} ريال</p>
          </div>
        </div>

        {overdueList.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">✓</p>
            <p className="text-gray-500">لا يوجد متأخرون — رائع!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {overdueList.map(({ house, overdueMonths, totalOwed }) => (
              <div key={house.id} className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
                <div
                  className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-red-50/40"
                  onClick={() => setExpandedId(expandedId === house.id ? null : house.id)}
                >
                  <div>
                    <p className="font-bold text-gray-800">
                      منزل {house.name}
                      <span className="text-gray-400 font-normal text-xs mr-1">#{house.number}</span>
                    </p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{house.sector}</span>
                  </div>
                  <div className="text-left flex items-center gap-3">
                    <div className="text-left">
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                        {overdueMonths.length} شهر
                      </span>
                      <p className="text-sm font-bold text-red-600 mt-0.5">{totalOwed} ريال</p>
                    </div>
                    <span className="text-gray-400 text-xs">{expandedId === house.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* تفاصيل الأشهر عند التوسيع */}
                {expandedId === house.id && (
                  <div className="border-t border-red-100 px-4 py-3 bg-red-50/30">
                    <p className="text-xs text-gray-500 mb-2">الأشهر المتأخرة:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {overdueMonths.map(m => (
                        <span key={m} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg">
                          {formatMonth(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
