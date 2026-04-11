'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type House = {
  id: string
  name: string
  house_number: number
  sector: string
}

type MonthDetail = {
  month: string
  amount: number
}

type OverdueHouse = {
  house: House
  overdueMonths: MonthDetail[]
  totalOwed: number
}

type SingleMonthHouse = {
  house: House
  amount: number
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

function getMonthsSinceStart(): string[] {
  const months: string[] = []
  const start = new Date(2026, 0, 1)
  const now = new Date()
  const cursor = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  while (cursor >= start) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return months
}

function getPrevMonth(): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getSeverity(months: number) {
  if (months >= 6) return { label: 'حرج', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', badgeBg: 'rgba(239,68,68,0.15)' }
  if (months >= 3) return { label: 'متوسط', color: '#f97316', glow: 'rgba(249,115,22,0.3)', badgeBg: 'rgba(249,115,22,0.15)' }
  return { label: 'بسيط', color: '#eab308', glow: 'rgba(234,179,8,0.3)', badgeBg: 'rgba(234,179,8,0.15)' }
}

function today() {
  return new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportAccumulatedCSV(data: OverdueHouse[]) {
  const BOM = '\uFEFF'
  const rows: string[] = [['رقم المنزل', 'اسم المنزل', 'المحور', 'عدد الأشهر المتأخرة', 'الشهر', 'مبلغ الشهر (جنيه)', 'إجمالي المتأخرات (جنيه)'].join(',')]
  data.forEach(({ house, overdueMonths, totalOwed }) => {
    overdueMonths.forEach((m, i) => {
      rows.push([house.house_number, `"${house.name}"`, `"${house.sector}"`, overdueMonths.length, `"${formatMonth(m.month)}"`, m.amount, i === 0 ? totalOwed : ''].join(','))
    })
  })
  triggerDownload(BOM + rows.join('\n'), `تقرير_المتأخرات_المتراكمة_${today()}.csv`)
}

function exportSingleMonthCSV(data: SingleMonthHouse[], month: string) {
  const BOM = '\uFEFF'
  const rows: string[] = [['رقم المنزل', 'اسم المنزل', 'المحور', `مبلغ ${formatMonth(month)} (جنيه)`].join(',')]
  data.forEach(({ house, amount }) => {
    rows.push([house.house_number, `"${house.name}"`, `"${house.sector}"`, amount].join(','))
  })
  triggerDownload(BOM + rows.join('\n'), `تقرير_${formatMonth(month)}_غير_المدفوعين_${today()}.csv`)
}

function pdfTemplate(title: string, date: string, statsHtml: string, tableHtml: string) {
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>${title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Cairo',sans-serif;background:#fff;color:#111;direction:rtl;padding:32px}
  h1{font-size:22px;font-weight:900;margin-bottom:4px}
  .meta{font-size:12px;color:#6b7280;margin-bottom:20px}
  .stats{display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap}
  .stat{background:#f3f4f6;border-radius:10px;padding:12px 18px;flex:1;min-width:130px}
  .stat .val{font-size:20px;font-weight:900;color:#dc2626}
  .stat .lbl{font-size:11px;color:#6b7280;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#111;color:#fff;padding:9px 8px;font-weight:700;text-align:right}
  tr:hover td{background:#f0fdf4}
  tfoot td{background:#fef2f2;font-weight:900;font-size:13px;color:#dc2626;padding:10px 8px;border-top:2px solid #dc2626}
  @media print{body{padding:16px}}
</style></head><body>
<h1>${title}</h1>
<p class="meta">تاريخ التقرير: ${date}</p>
<div class="stats">${statsHtml}</div>
<table>${tableHtml}</table>
</body></html>`
}

function exportAccumulatedPDF(data: OverdueHouse[], totalAll: number) {
  const win = window.open('', '_blank')
  if (!win) return
  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const rows = data.map(({ house, overdueMonths, totalOwed }) => {
    const sev = getSeverity(overdueMonths.length)
    const monthRows = overdueMonths.map(m =>
      `<tr><td></td><td></td><td></td><td style="color:#6b7280;padding:3px 8px;font-size:12px">${formatMonth(m.month)}</td><td style="color:#6b7280;font-size:12px;text-align:center">${m.amount > 0 ? m.amount.toLocaleString() + ' ج' : '—'}</td><td></td></tr>`
    ).join('')
    return `<tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
      <td style="padding:10px 8px;font-weight:700">${house.house_number}</td>
      <td style="padding:10px 8px;font-weight:700">${house.name}</td>
      <td style="padding:10px 8px">${house.sector}</td>
      <td style="padding:10px 8px"><span style="background:${sev.badgeBg};color:${sev.color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">${overdueMonths.length} شهر · ${sev.label}</span></td>
      <td></td>
      <td style="padding:10px 8px;font-weight:800;color:#dc2626">${totalOwed.toLocaleString()} ج</td>
    </tr>${monthRows}`
  }).join('')
  win.document.write(pdfTemplate('⚠️ تقرير المتأخرين — المتأخرات المتراكمة', now,
    `<div class="stat"><div class="val">${data.length}</div><div class="lbl">منزل متأخر</div></div>
     <div class="stat"><div class="val">${totalAll.toLocaleString()} ج</div><div class="lbl">إجمالي المتأخرات</div></div>
     <div class="stat"><div class="val">${data.reduce((s, o) => s + o.overdueMonths.length, 0)}</div><div class="lbl">شهر متأخر إجمالاً</div></div>`,
    `<thead><tr><th>#</th><th>الاسم</th><th>المحور</th><th>الأشهر</th><th>الشهر المتأخر</th><th>المبلغ</th></tr></thead>
     <tbody>${rows}</tbody>
     <tfoot><tr><td colspan="5">الإجمالي (${data.length} منزل)</td><td>${totalAll.toLocaleString()} جنيه</td></tr></tfoot>`
  ))
  win.document.close()
  setTimeout(() => win.print(), 600)
}

function exportSingleMonthPDF(data: SingleMonthHouse[], month: string, totalAll: number) {
  const win = window.open('', '_blank')
  if (!win) return
  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const rows = data.map(({ house, amount }) =>
    `<tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 8px;font-weight:700">${house.house_number}</td>
      <td style="padding:10px 8px;font-weight:700">${house.name}</td>
      <td style="padding:10px 8px">${house.sector}</td>
      <td style="padding:10px 8px;font-weight:800;color:#dc2626">${amount > 0 ? amount.toLocaleString() + ' ج' : '—'}</td>
    </tr>`
  ).join('')
  win.document.write(pdfTemplate(`⚠️ غير المدفوعين — ${formatMonth(month)}`, now,
    `<div class="stat"><div class="val">${data.length}</div><div class="lbl">منزل لم يدفع</div></div>
     <div class="stat"><div class="val">${totalAll.toLocaleString()} ج</div><div class="lbl">إجمالي المبلغ الضائع</div></div>`,
    `<thead><tr><th>#</th><th>الاسم</th><th>المحور</th><th>المبلغ المطلوب</th></tr></thead>
     <tbody>${rows}</tbody>
     <tfoot><tr><td colspan="3">الإجمالي (${data.length} منزل)</td><td>${totalAll.toLocaleString()} جنيه</td></tr></tfoot>`
  ))
  win.document.close()
  setTimeout(() => win.print(), 600)
}

// ========== المكوّن الرئيسي ==========
export default function OverdueReportPage() {
  const router = useRouter()

  const [overdueList, setOverdueList] = useState<OverdueHouse[]>([])
  const [allHouses, setAllHouses] = useState<House[]>([])
  const [paidMap, setPaidMap] = useState<Record<string, Set<string>>>({})
  const [defaultAmountMap, setDefaultAmountMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState<'accumulated' | 'single'>('accumulated')
  const [selectedMonth, setSelectedMonth] = useState(getPrevMonth())

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterSector, setFilterSector] = useState('الكل')
  const [filterSeverity, setFilterSeverity] = useState('الكل')
  const [sortBy, setSortBy] = useState<'months' | 'amount' | 'name'>('months')
  const [searchText, setSearchText] = useState('')

  const allMonths = useMemo(() => getMonthsSinceStart(), [])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: allSettings } = await supabase
      .from('settings').select('key, value').like('key', 'default_subscription_20%')

    const defMap: Record<string, number> = {}
    allSettings?.forEach(s => {
      const month = s.key.replace('default_subscription_', '')
      defMap[month] = parseInt(s.value) || 0
    })
    setDefaultAmountMap(defMap)

    const { data: houses } = await supabase
      .from('houses').select('id, name, house_number, sector').order('house_number')

    const { data: subs } = await supabase
      .from('subscriptions').select('house_id, month, amount')

    if (!houses) { setLoading(false); return }
    setAllHouses(houses)

    const paid: Record<string, Set<string>> = {}
    subs?.forEach(s => {
      if (!paid[s.house_id]) paid[s.house_id] = new Set()
      paid[s.house_id].add(s.month)
    })
    setPaidMap(paid)

    const result: OverdueHouse[] = []
    houses.forEach(house => {
      const housePaid = paid[house.id] || new Set()
      const overdueDetails: MonthDetail[] = allMonths
        .filter(m => !housePaid.has(m))
        .map(m => ({ month: m, amount: defMap[m] || 0 }))
      if (overdueDetails.length > 0) {
        result.push({ house, overdueMonths: overdueDetails, totalOwed: overdueDetails.reduce((s, d) => s + d.amount, 0) })
      }
    })
    result.sort((a, b) => b.overdueMonths.length - a.overdueMonths.length)
    setOverdueList(result)
    setLoading(false)
  }, [router, allMonths])

  useEffect(() => { load() }, [load])

  // بيانات وضع الشهر المحدد
  const singleMonthList = useMemo<SingleMonthHouse[]>(() =>
    allHouses
      .filter(h => !(paidMap[h.id]?.has(selectedMonth)))
      .map(h => ({ house: h, amount: defaultAmountMap[selectedMonth] || 0 })),
    [allHouses, paidMap, defaultAmountMap, selectedMonth])

  // فلترة المتأخرات المتراكمة
  const filteredAccumulated = useMemo(() =>
    overdueList
      .filter(o => {
        if (filterSector !== 'الكل' && o.house.sector !== filterSector) return false
        if (filterSeverity !== 'الكل') {
          const m = o.overdueMonths.length
          if (filterSeverity === 'حرج' && m < 6) return false
          if (filterSeverity === 'متوسط' && (m < 3 || m >= 6)) return false
          if (filterSeverity === 'بسيط' && m >= 3) return false
        }
        if (searchText.trim()) {
          const q = searchText.trim()
          if (!o.house.name.includes(q) && !String(o.house.house_number).includes(q) && !o.house.sector.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'months') return b.overdueMonths.length - a.overdueMonths.length
        if (sortBy === 'amount') return b.totalOwed - a.totalOwed
        return a.house.name.localeCompare(b.house.name, 'ar')
      }),
    [overdueList, filterSector, filterSeverity, sortBy, searchText])

  // فلترة وضع الشهر المحدد
  const filteredSingle = useMemo(() =>
    singleMonthList
      .filter(o => {
        if (filterSector !== 'الكل' && o.house.sector !== filterSector) return false
        if (searchText.trim()) {
          const q = searchText.trim()
          if (!o.house.name.includes(q) && !String(o.house.house_number).includes(q) && !o.house.sector.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.house.name.localeCompare(b.house.name, 'ar')
        if (sortBy === 'amount') return b.amount - a.amount
        return a.house.house_number - b.house.house_number
      }),
    [singleMonthList, filterSector, searchText, sortBy])

  const sectors = useMemo(() =>
    ['الكل', ...Array.from(new Set(allHouses.map(h => h.sector)))],
    [allHouses])

  const isAccumulated = viewMode === 'accumulated'
  const displayList = isAccumulated ? filteredAccumulated : filteredSingle
  const totalOwedAll = isAccumulated
    ? filteredAccumulated.reduce((s, o) => s + o.totalOwed, 0)
    : filteredSingle.reduce((s, o) => s + o.amount, 0)
  const maxMonths = Math.max(...overdueList.map(o => o.overdueMonths.length), 1)
  const criticalCount = overdueList.filter(o => o.overdueMonths.length >= 6).length
  const mediumCount = overdueList.filter(o => o.overdueMonths.length >= 3 && o.overdueMonths.length < 6).length

  const handleExportCSV = () => isAccumulated ? exportAccumulatedCSV(filteredAccumulated) : exportSingleMonthCSV(filteredSingle, selectedMonth)
  const handleExportPDF = () => isAccumulated ? exportAccumulatedPDF(filteredAccumulated, totalOwedAll) : exportSingleMonthPDF(filteredSingle, selectedMonth, totalOwedAll)

  const switchMode = (mode: 'accumulated' | 'single') => {
    setViewMode(mode)
    setExpandedId(null)
    setFilterSeverity('الكل')
    setSearchText('')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', direction: 'rtl', fontFamily: '"Cairo", sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #ef4444', borderTopColor: 'transparent', margin: '0 auto 14px', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#555', fontSize: 14 }}>جاري تحميل التقرير...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: '"Cairo","Tajawal",system-ui,sans-serif', color: '#f0f0f0' }}>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(239,68,68,0.12) 0%, transparent 60%)' }} />

      {/* هيدر */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(239,68,68,0.15)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#fff' }}>تقرير المتأخرين</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{overdueList.length} منزل متأخر عن السداد</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={handleExportCSV} style={btnStyle('#16a34a')}>📊 Excel</button>
          <button onClick={handleExportPDF} style={btnStyle('#2563eb')}>📄 PDF</button>
          <button onClick={() => router.push('/dashboard/subscriptions')} style={btnStyle('rgba(255,255,255,0.1)')}>← رجوع</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '18px 14px 40px', position: 'relative', zIndex: 1 }}>

        {/* مفتاح الوضع */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 5, marginBottom: 16, gap: 4 }}>
          {([
            { key: 'accumulated', icon: '📋', label: 'المتأخرات المتراكمة' },
            { key: 'single', icon: '📅', label: 'شهر بعينه' },
          ] as const).map(({ key, icon, label }) => (
            <button key={key} onClick={() => switchMode(key)} style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13,
              transition: 'all 0.2s',
              background: viewMode === key ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'transparent',
              color: viewMode === key ? '#fff' : '#555',
              boxShadow: viewMode === key ? '0 2px 12px rgba(220,38,38,0.35)' : 'none',
            }}>{icon} {label}</button>
          ))}
        </div>

        {/* اختيار الشهر — وضع شهر بعينه */}
        {!isAccumulated && (
          <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, padding: '14px 16px', marginBottom: 16, animation: 'fadeIn 0.2s ease' }}>
            <label style={{ ...labelStyle, color: '#ef4444', marginBottom: 8 }}>📅 اختر الشهر المطلوب</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ ...selectStyle, border: '1px solid rgba(220,38,38,0.3)', color: '#f0f0f0', fontSize: 14, padding: '10px 14px' }}>
              {allMonths.map(m => <option key={m} value={m} style={{ background: '#1a1a1a' }}>{formatMonth(m)}</option>)}
            </select>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: '#666' }}>
              {singleMonthList.length} منزل لم يدفع · إجمالي المبلغ الضائع: {singleMonthList.reduce((s, o) => s + o.amount, 0).toLocaleString()} جنيه
            </p>
          </div>
        )}

        {/* إحصاءات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
          {(isAccumulated ? [
            { label: 'إجمالي المتأخرات', value: `${totalOwedAll.toLocaleString()} ج`, accent: '#ef4444', icon: '💰' },
            { label: 'منازل في النتائج', value: `${filteredAccumulated.length} منزل`, accent: '#f97316', icon: '🏠' },
            { label: 'حالات حرجة (+6 أشهر)', value: String(criticalCount), accent: '#dc2626', icon: '🔴' },
            { label: 'حالات متوسطة (3-5)', value: String(mediumCount), accent: '#f97316', icon: '🟠' },
          ] : [
            { label: `لم يدفعوا ${formatMonth(selectedMonth)}`, value: `${filteredSingle.length} منزل`, accent: '#ef4444', icon: '🏠' },
            { label: 'إجمالي المبلغ الضائع', value: `${totalOwedAll.toLocaleString()} ج`, accent: '#f97316', icon: '💰' },
            { label: 'دفعوا هذا الشهر', value: `${allHouses.length - singleMonthList.length} منزل`, accent: '#22c55e', icon: '✅' },
            { label: 'نسبة الالتزام', value: `${allHouses.length > 0 ? Math.round(((allHouses.length - singleMonthList.length) / allHouses.length) * 100) : 0}%`, accent: '#22c55e', icon: '📊' },
          ]).map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.accent}28`, borderRadius: 14, padding: '14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, left: -10, width: 55, height: 55, borderRadius: '50%', background: `${s.accent}14` }} />
              <div style={{ fontSize: 18, marginBottom: 5 }}>{s.icon}</div>
              <p style={{ margin: '0 0 3px', fontSize: 19, fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#555' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* فلاتر */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>🔍 بحث (اسم، رقم، محور)</label>
            <input type="text" value={searchText} placeholder="اكتب أي جزء من الاسم أو الرقم..." onChange={e => setSearchText(e.target.value)} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isAccumulated ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: 8 }}>
            <div>
              <label style={labelStyle}>المحور</label>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={selectStyle}>
                {sectors.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
              </select>
            </div>
            {isAccumulated && (
              <div>
                <label style={labelStyle}>الخطورة</label>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={selectStyle}>
                  {['الكل', 'حرج', 'متوسط', 'بسيط'].map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={labelStyle}>الترتيب</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'months' | 'amount' | 'name')} style={selectStyle}>
                {isAccumulated ? (
                  <>
                    <option value="months" style={{ background: '#1a1a1a' }}>الأشهر</option>
                    <option value="amount" style={{ background: '#1a1a1a' }}>المبلغ</option>
                    <option value="name" style={{ background: '#1a1a1a' }}>الاسم</option>
                  </>
                ) : (
                  <>
                    <option value="months" style={{ background: '#1a1a1a' }}>رقم المنزل</option>
                    <option value="amount" style={{ background: '#1a1a1a' }}>المبلغ</option>
                    <option value="name" style={{ background: '#1a1a1a' }}>الاسم</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* قائمة فارغة */}
        {displayList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <p style={{ color: '#4ade80', fontSize: 17, fontWeight: 700 }}>
              {isAccumulated ? 'لا يوجد متأخرون' : `الجميع دفع في ${formatMonth(selectedMonth)}`}
            </p>
            <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>
              {isAccumulated ? 'جميع المنازل ملتزمة بالدفع' : 'لا يوجد منازل متأخرة في هذا الشهر'}
            </p>
          </div>
        ) : isAccumulated ? (
          /* وضع المتأخرات المتراكمة */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredAccumulated.map(({ house, overdueMonths, totalOwed }) => {
              const sev = getSeverity(overdueMonths.length)
              const isExpanded = expandedId === house.id
              const barW = (overdueMonths.length / maxMonths) * 100
              return (
                <div key={house.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${sev.color}22`, borderRadius: 16, overflow: 'hidden', boxShadow: isExpanded ? `0 0 0 1px ${sev.color}35, 0 6px 24px ${sev.glow}` : 'none', transition: 'box-shadow 0.25s' }}>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg,${sev.color}80,${sev.color})`, borderRadius: '0 2px 2px 0', transition: 'width 0.5s' }} />
                  </div>
                  <div onClick={() => setExpandedId(isExpanded ? null : house.id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>#{house.house_number}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#f5f5f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{house.name}</span>
                        <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{house.sector}</span>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sev.badgeBg, border: `1px solid ${sev.color}40`, color: sev.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sev.color, display: 'inline-block' }} />
                        {overdueMonths.length} شهر · {sev.label}
                      </span>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: sev.color }}>{totalOwed.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500 }}> ج</span></div>
                      <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>إجمالي المتأخرات</div>
                    </div>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `${sev.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: sev.color, transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</div>
                  </div>
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${sev.color}18`, padding: '14px 16px', background: `${sev.color}06`, animation: 'fadeIn 0.2s ease' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666', fontWeight: 700 }}>📅 تفاصيل الأشهر المتأخرة:</p>
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${sev.color}20` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', background: `${sev.color}18`, padding: '7px 12px' }}>
                          <span style={{ fontSize: 11, color: sev.color, fontWeight: 700 }}>الشهر</span>
                          <span style={{ fontSize: 11, color: sev.color, fontWeight: 700 }}>القسط</span>
                        </div>
                        {overdueMonths.map((m, idx) => (
                          <div key={m.month} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '8px 12px', background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)', borderTop: `1px solid ${sev.color}10` }}>
                            <span style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>{formatMonth(m.month)}</span>
                            <span style={{ fontSize: 12, color: m.amount > 0 ? sev.color : '#555', fontWeight: 700 }}>{m.amount > 0 ? `${m.amount.toLocaleString()} ج` : '—'}</span>
                          </div>
                        ))}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '9px 12px', background: `${sev.color}20`, borderTop: `1px solid ${sev.color}30` }}>
                          <span style={{ fontSize: 12, color: sev.color, fontWeight: 800 }}>الإجمالي ({overdueMonths.length} شهر)</span>
                          <span style={{ fontSize: 13, color: sev.color, fontWeight: 900 }}>{totalOwed.toLocaleString()} ج</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* وضع شهر بعينه */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredSingle.map(({ house, amount }, idx) => (
              <div key={house.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, animation: `fadeIn 0.15s ease ${idx * 0.02}s both` }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>#{house.house_number}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#f5f5f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{house.name}</span>
                  <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{house.sector}</span>
                </div>
                <div style={{ textAlign: 'left', flexShrink: 0 }}>
                  {amount > 0
                    ? <><div style={{ fontSize: 16, fontWeight: 900, color: '#ef4444' }}>{amount.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500 }}> ج</span></div><div style={{ fontSize: 10, color: '#555' }}>مبلغ الشهر</div></>
                    : <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>لا يوجد مبلغ افتراضي</div>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ملخص أسفل الصفحة */}
        {displayList.length > 0 && (
          <div style={{ marginTop: 16, padding: '16px 18px', background: 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(153,27,27,0.06))', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                {isAccumulated ? `إجمالي المتأخرات (${filteredAccumulated.length} منزل)` : `إجمالي ${formatMonth(selectedMonth)} (${filteredSingle.length} منزل)`}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#444' }}>
                {isAccumulated ? 'محسوب بناءً على القيمة الافتراضية لكل شهر' : `المبلغ الضائع لشهر ${formatMonth(selectedMonth)}`}
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{totalOwedAll.toLocaleString()}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#dc2626', opacity: 0.6 }}>جنيه</p>
            </div>
          </div>
        )}

        {/* أزرار تصدير سفلية */}
        {displayList.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <button onClick={handleExportCSV} style={{ ...btnStyle('#16a34a'), flex: 1, padding: '12px', fontSize: 13, justifyContent: 'center' }}>📊 تصدير Excel (CSV)</button>
            <button onClick={handleExportPDF} style={{ ...btnStyle('#2563eb'), flex: 1, padding: '12px', fontSize: 13, justifyContent: 'center' }}>📄 طباعة / PDF</button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2a2a', marginTop: 18 }}>
          {isAccumulated ? 'يشمل الأشهر من يناير 2026 حتى الشهر الماضي' : `عرض غير المدفوعين لشهر ${formatMonth(selectedMonth)}`}
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #444; }
      `}</style>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return { background: bg, border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 9, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', transition: 'opacity 0.15s' }
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#555', marginBottom: 5, fontWeight: 600
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 9, padding: '9px 12px', fontSize: 13, cursor: 'text', fontFamily: 'inherit', outline: 'none'
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 9, padding: '8px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', outline: 'none'
}
