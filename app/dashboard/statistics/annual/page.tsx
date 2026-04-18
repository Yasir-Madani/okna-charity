'use client'
// ============================================================
// app/dashboard/statistics/annual/page.tsx
// التقرير السنوي — المبالغ المجموعة شهراً بشهر
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

const MONTH_NAMES: Record<string, string> = {
  '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
  '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
  '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
}

type MonthStat = {
  month: string
  collected: number
  paidCount: number
  unpaidCount: number
  defaultAmount: number
  expectedTotal: number
  collectionRate: number
}

type YearSummary = {
  year: number
  months: MonthStat[]
  totalCollected: number
  totalExpected: number
  avgRate: number
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-')
  return `${MONTH_NAMES[month]} ${year}`
}

function getAvailableYears(): number[] {
  const startYear = 2026
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= startYear; y--) years.push(y)
  return years
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function AnnualReportPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<YearSummary | null>(null)
  const [totalHouses, setTotalHouses] = useState(0)
  const [loading, setLoading] = useState(true)

  const years = getAvailableYears()

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: houses } = await supabase.from('houses').select('id')
    const houseCount = houses?.length || 0
    setTotalHouses(houseCount)

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('house_id, month, amount')
      .like('month', `${selectedYear}-%`)

    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', `default_subscription_${selectedYear}-%`)

    const defaultMap: Record<string, number> = {}
    settings?.forEach(s => {
      const month = s.key.replace('default_subscription_', '')
      defaultMap[month] = parseInt(s.value) || 0
    })

    const monthMap: Record<string, { collected: number; paidHouses: Set<string> }> = {}
    subs?.forEach(s => {
      if (!monthMap[s.month]) monthMap[s.month] = { collected: 0, paidHouses: new Set() }
      monthMap[s.month].collected += s.amount
      monthMap[s.month].paidHouses.add(s.house_id)
    })

    const now = new Date()
    const months: MonthStat[] = []

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${selectedYear}-${String(m).padStart(2, '0')}`
      const isFuture = new Date(selectedYear, m - 1, 1) > now
      if (isFuture) continue

      const data = monthMap[monthKey] || { collected: 0, paidHouses: new Set() }
      const defAmt = defaultMap[monthKey] || 0
      const paidCount = data.paidHouses.size
      const unpaidCount = houseCount - paidCount
      const expectedTotal = defAmt * houseCount
      const collectionRate = expectedTotal > 0 ? Math.round((data.collected / expectedTotal) * 100) : 0

      months.push({
        month: monthKey,
        collected: data.collected,
        paidCount,
        unpaidCount,
        defaultAmount: defAmt,
        expectedTotal,
        collectionRate,
      })
    }

    const totalCollected = months.reduce((s, m) => s + m.collected, 0)
    const totalExpected = months.reduce((s, m) => s + m.expectedTotal, 0)
    const avgRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0

    setSummary({ year: selectedYear, months, totalCollected, totalExpected, avgRate })
    setLoading(false)
  }, [selectedYear, router])

  useEffect(() => { load() }, [load])

  const exportCSV = () => {
    if (!summary) return
    const BOM = '\uFEFF'
    const rows = [['الشهر', 'المحصّل (جنيه)', 'المنازل الدافعة', 'المنازل المتأخرة', 'المبلغ المتوقع', 'نسبة التحصيل'].join(',')]
    summary.months.forEach(m => {
      rows.push([
        `"${formatMonth(m.month)}"`,
        m.collected,
        m.paidCount,
        m.unpaidCount,
        m.expectedTotal,
        `${m.collectionRate}%`
      ].join(','))
    })
    rows.push(['الإجمالي', summary.totalCollected, '', '', summary.totalExpected, `${summary.avgRate}%`].join(','))
    triggerDownload(BOM + rows.join('\n'), `التقرير_السنوي_${selectedYear}.csv`)
  }

  const exportPDF = () => {
    if (!summary) return
    const win = window.open('', '_blank')
    if (!win) return
    const rows = summary.months.map(m => {
      const rateColor = m.collectionRate >= 80 ? '#16a34a' : m.collectionRate >= 50 ? '#f97316' : '#dc2626'
      return `<tr>
        <td>${formatMonth(m.month)}</td>
        <td style="font-weight:700;color:#16a34a">${m.collected.toLocaleString()} ج</td>
        <td style="color:#16a34a">${m.paidCount}</td>
        <td style="color:#dc2626">${m.unpaidCount}</td>
        <td>${m.expectedTotal > 0 ? m.expectedTotal.toLocaleString() + ' ج' : '—'}</td>
        <td><span style="background:${rateColor}20;color:${rateColor};padding:2px 8px;border-radius:20px;font-weight:700">${m.collectionRate}%</span></td>
      </tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
    <title>التقرير السنوي ${selectedYear}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Cairo',sans-serif;padding:32px;color:#111;direction:rtl}
      h1{font-size:22px;font-weight:900;margin-bottom:4px}
      .meta{font-size:12px;color:#6b7280;margin-bottom:20px}
      .stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}
      .stat{background:#f3f4f6;border-radius:10px;padding:12px 18px;flex:1;min-width:130px}
      .stat .val{font-size:20px;font-weight:900}
      .stat .lbl{font-size:11px;color:#6b7280;margin-top:2px}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{background:#111;color:#fff;padding:9px 8px;text-align:right;font-weight:700}
      td{padding:9px 8px;border-bottom:1px solid #e5e7eb}
      tr:hover td{background:#f9fafb}
      tfoot td{background:#f0fdf4;font-weight:900;border-top:2px solid #16a34a}
    </style></head><body>
    <h1>📊 التقرير السنوي — ${selectedYear}</h1>
    <p class="meta">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <div class="stats">
      <div class="stat"><div class="val" style="color:#16a34a">${summary.totalCollected.toLocaleString()} ج</div><div class="lbl">إجمالي المحصّل</div></div>
      <div class="stat"><div class="val" style="color:#f97316">${summary.totalExpected.toLocaleString()} ج</div><div class="lbl">إجمالي المتوقع</div></div>
      <div class="stat"><div class="val" style="color:#2563eb">${summary.avgRate}%</div><div class="lbl">متوسط نسبة التحصيل</div></div>
      <div class="stat"><div class="val">${totalHouses}</div><div class="lbl">إجمالي المنازل</div></div>
    </div>
    <table>
      <thead><tr><th>الشهر</th><th>المحصّل</th><th>دفعوا</th><th>لم يدفعوا</th><th>المتوقع</th><th>النسبة</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td>الإجمالي (${summary.months.length} شهر)</td>
        <td>${summary.totalCollected.toLocaleString()} ج</td>
        <td></td><td></td>
        <td>${summary.totalExpected.toLocaleString()} ج</td>
        <td>${summary.avgRate}%</td>
      </tr></tfoot>
    </table>
    </body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const maxCollected = summary ? Math.max(...summary.months.map(m => m.collected), 1) : 1

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* هيدر */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="text-base font-bold">📊 التقرير السنوي</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer font-bold">📊 Excel</button>
          <button onClick={exportPDF} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer font-bold">📄 PDF</button>
          <button onClick={() => router.push('/dashboard')} className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer">رجوع</button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* اختيار السنة */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
          <label className="text-xs text-gray-400 block mb-1">اختر السنة</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">جاري التحميل...</div>
        ) : !summary || summary.months.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">لا توجد بيانات لسنة {selectedYear}</div>
        ) : (
          <>
            {/* بطاقات الإجمالي */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'إجمالي المحصّل', value: `${summary.totalCollected.toLocaleString()} ج`, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
                { label: 'إجمالي المتوقع', value: `${summary.totalExpected.toLocaleString()} ج`, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
                { label: 'متوسط نسبة التحصيل', value: `${summary.avgRate}%`, color: summary.avgRate >= 80 ? 'text-green-600' : summary.avgRate >= 50 ? 'text-orange-500' : 'text-red-500', bg: 'bg-gray-50 border-gray-200' },
                { label: 'عدد الأشهر المسجّلة', value: `${summary.months.length} شهر`, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border p-3 shadow-sm ${s.bg}`}>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* جدول الأشهر */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-800 text-white px-4 py-2.5 flex items-center gap-2">
                <span className="text-sm font-bold">تفاصيل الأشهر</span>
                <span className="text-xs opacity-60 mr-auto">{selectedYear}</span>
              </div>

              <div className="divide-y divide-gray-100">
                {summary.months.map(m => {
                  const barWidth = (m.collected / maxCollected) * 100
                  const rateColor = m.collectionRate >= 80 ? 'text-green-600 bg-green-100' : m.collectionRate >= 50 ? 'text-orange-500 bg-orange-100' : 'text-red-500 bg-red-100'
                  const barColor = m.collectionRate >= 80 ? 'bg-green-500' : m.collectionRate >= 50 ? 'bg-orange-400' : 'bg-red-400'

                  return (
                    <div key={m.month} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-gray-800">{formatMonth(m.month)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{m.paidCount} دفعوا · {m.unpaidCount} لم يدفعوا</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${rateColor}`}>{m.collectionRate}%</span>
                        </div>
                      </div>
                      {/* شريط التقدم */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>المحصّل: <strong className="text-green-600">{m.collected.toLocaleString()} ج</strong></span>
                        {m.expectedTotal > 0 && (
                          <span>المتوقع: {m.expectedTotal.toLocaleString()} ج</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* إجمالي */}
              <div className="bg-green-50 border-t border-green-200 px-4 py-3 flex justify-between items-center">
                <span className="text-sm font-bold text-green-800">الإجمالي السنوي</span>
                <span className="text-lg font-bold text-green-700">{summary.totalCollected.toLocaleString()} جنيه</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
