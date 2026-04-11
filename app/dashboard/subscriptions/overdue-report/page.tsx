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

function getSeverity(months: number) {
  if (months >= 6) return { label: 'حرج', color: '#ef4444', glow: 'rgba(239,68,68,0.3)', badge: '#7f1d1d', badgeBg: 'rgba(239,68,68,0.15)' }
  if (months >= 3) return { label: 'متوسط', color: '#f97316', glow: 'rgba(249,115,22,0.3)', badge: '#7c2d12', badgeBg: 'rgba(249,115,22,0.15)' }
  return { label: 'بسيط', color: '#eab308', glow: 'rgba(234,179,8,0.3)', badge: '#713f12', badgeBg: 'rgba(234,179,8,0.15)' }
}

// ---- تصدير Excel (XLSX بدون مكتبات خارجية - CSV) ----
function exportToCSV(data: OverdueHouse[]) {
  const BOM = '\uFEFF'
  const rows: string[] = [
    ['رقم المنزل', 'اسم المنزل', 'المحور', 'عدد الأشهر المتأخرة', 'الشهر', 'مبلغ الشهر (جنيه)', 'إجمالي المتأخرات (جنيه)'].join(',')
  ]
  data.forEach(({ house, overdueMonths, totalOwed }) => {
    overdueMonths.forEach((m, i) => {
      rows.push([
        house.house_number,
        `"${house.name}"`,
        `"${house.sector}"`,
        overdueMonths.length,
        `"${formatMonth(m.month)}"`,
        m.amount,
        i === 0 ? totalOwed : ''
      ].join(','))
    })
  })
  const blob = new Blob([BOM + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `تقرير_المتأخرات_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---- تصدير PDF ----
function exportToPDF(data: OverdueHouse[], totalAll: number) {
  const win = window.open('', '_blank')
  if (!win) return
  const now = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
  const rows = data.map(({ house, overdueMonths, totalOwed }) => {
    const monthsHtml = overdueMonths.map(m =>
      `<tr><td></td><td></td><td></td><td style="color:#6b7280;padding:3px 8px;font-size:12px">${formatMonth(m.month)}</td><td style="text-align:center;color:#6b7280;font-size:12px">${m.amount.toLocaleString()} ج</td><td></td></tr>`
    ).join('')
    const sev = getSeverity(overdueMonths.length)
    return `
      <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
        <td style="padding:10px 8px;font-weight:700;color:#111">${house.house_number}</td>
        <td style="padding:10px 8px;font-weight:700;color:#111">${house.name}</td>
        <td style="padding:10px 8px;color:#374151">${house.sector}</td>
        <td style="padding:10px 8px">
          <span style="background:${sev.badgeBg};color:${sev.color};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">
            ${overdueMonths.length} شهر · ${sev.label}
          </span>
        </td>
        <td style="padding:10px 8px;text-align:center"></td>
        <td style="padding:10px 8px;text-align:left;font-weight:800;color:#dc2626">${totalOwed.toLocaleString()} ج</td>
      </tr>
      ${monthsHtml}
    `
  }).join('')

  win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير المتأخرات</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Cairo',sans-serif; background:#fff; color:#111; direction:rtl; padding:32px; }
  h1 { font-size:26px; font-weight:900; color:#111; margin-bottom:4px; }
  .meta { font-size:13px; color:#6b7280; margin-bottom:24px; }
  .stats { display:flex; gap:16px; margin-bottom:28px; flex-wrap:wrap; }
  .stat { background:#f3f4f6; border-radius:12px; padding:14px 20px; flex:1; min-width:140px; }
  .stat .val { font-size:22px; font-weight:900; color:#dc2626; }
  .stat .lbl { font-size:11px; color:#6b7280; margin-top:2px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { background:#111; color:#fff; padding:10px 8px; font-weight:700; text-align:right; }
  tr:hover td { background:#f0fdf4; }
  tfoot td { background:#fef2f2; font-weight:900; font-size:14px; color:#dc2626; padding:12px 8px; border-top:2px solid #dc2626; }
  @media print { body { padding:16px; } }
</style>
</head>
<body>
<h1>⚠️ تقرير المتأخرين عن السداد</h1>
<p class="meta">تاريخ التقرير: ${now} · يشمل جميع الأشهر من يناير 2026 حتى الشهر الماضي</p>
<div class="stats">
  <div class="stat"><div class="val">${data.length}</div><div class="lbl">منزل متأخر</div></div>
  <div class="stat"><div class="val">${totalAll.toLocaleString()} ج</div><div class="lbl">إجمالي المتأخرات</div></div>
  <div class="stat"><div class="val">${data.reduce((s, o) => s + o.overdueMonths.length, 0)}</div><div class="lbl">شهر متأخر إجمالاً</div></div>
</div>
<table>
  <thead>
    <tr>
      <th>#</th><th>الاسم</th><th>المحور</th><th>الأشهر</th><th>الشهر المتأخر</th><th>المبلغ</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
  <tfoot>
    <tr>
      <td colspan="5">الإجمالي (${data.length} منزل)</td>
      <td>${totalAll.toLocaleString()} جنيه</td>
    </tr>
  </tfoot>
</table>
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 600)
}

export default function OverdueReportPage() {
  const router = useRouter()
  const [overdueList, setOverdueList] = useState<OverdueHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterSector, setFilterSector] = useState('الكل')
  const [filterSeverity, setFilterSeverity] = useState('الكل')
  const [sortBy, setSortBy] = useState<'months' | 'amount' | 'name'>('months')
  const [searchText, setSearchText] = useState('')
  const [allHouses, setAllHouses] = useState<House[]>([])

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: allSettings } = await supabase
      .from('settings').select('key, value').like('key', 'default_subscription_20%')

    const defaultAmountMap: Record<string, number> = {}
    allSettings?.forEach(s => {
      const month = s.key.replace('default_subscription_', '')
      defaultAmountMap[month] = parseInt(s.value) || 0
    })

    const { data: houses } = await supabase
      .from('houses').select('id, name, house_number, sector').order('house_number')

    const { data: subs } = await supabase
      .from('subscriptions').select('house_id, month, amount')

    if (!houses) { setLoading(false); return }
    setAllHouses(houses)

    const paidMap: Record<string, Set<string>> = {}
    subs?.forEach(s => {
      if (!paidMap[s.house_id]) paidMap[s.house_id] = new Set()
      paidMap[s.house_id].add(s.month)
    })

    const allMonths = getMonthsSinceStart()
    const result: OverdueHouse[] = []

    houses.forEach(house => {
      const paid = paidMap[house.id] || new Set()
      const overdueDetails: MonthDetail[] = allMonths
        .filter(m => !paid.has(m))
        .map(m => ({ month: m, amount: defaultAmountMap[m] || 0 }))

      if (overdueDetails.length > 0) {
        const totalOwed = overdueDetails.reduce((s, d) => s + d.amount, 0)
        result.push({ house, overdueMonths: overdueDetails, totalOwed })
      }
    })

    result.sort((a, b) => b.overdueMonths.length - a.overdueMonths.length)
    setOverdueList(result)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const sectors = useMemo(() =>
    ['الكل', ...Array.from(new Set(overdueList.map(o => o.house.sector)))],
    [overdueList])

  const filtered = useMemo(() =>
    overdueList
      .filter(o => {
        if (filterSector !== 'الكل' && o.house.sector !== filterSector) return false
        if (filterSeverity !== 'الكل') {
          const months = o.overdueMonths.length
          if (filterSeverity === 'حرج' && months < 6) return false
          if (filterSeverity === 'متوسط' && (months < 3 || months >= 6)) return false
          if (filterSeverity === 'بسيط' && months >= 3) return false
        }
        if (searchText.trim()) {
          const q = searchText.trim()
          const matchName = o.house.name.includes(q)
          const matchNum = String(o.house.house_number).includes(q)
          const matchSector = o.house.sector.includes(q)
          if (!matchName && !matchNum && !matchSector) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'months') return b.overdueMonths.length - a.overdueMonths.length
        if (sortBy === 'amount') return b.totalOwed - a.totalOwed
        return a.house.name.localeCompare(b.house.name, 'ar')
      }),
    [overdueList, filterSector, filterSeverity, sortBy, searchText])

  const totalOwedAll = filtered.reduce((s, o) => s + o.totalOwed, 0)
  const maxMonths = Math.max(...overdueList.map(o => o.overdueMonths.length), 1)
  const criticalCount = overdueList.filter(o => o.overdueMonths.length >= 6).length
  const mediumCount = overdueList.filter(o => o.overdueMonths.length >= 3 && o.overdueMonths.length < 6).length

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
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: '"Cairo", "Tajawal", system-ui, sans-serif', color: '#f0f0f0' }}>

      {/* خلفية */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(239,68,68,0.12) 0%, transparent 60%)' }} />

      {/* ===== هيدر ===== */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(239,68,68,0.15)',
        padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#dc2626,#7f1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>تقرير المتأخرين</h1>
            <p style={{ margin: 0, fontSize: 11, color: '#ef4444' }}>{overdueList.length} منزل متأخر عن السداد</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={() => exportToCSV(filtered)} style={btnStyle('#16a34a')}>📊 Excel</button>
          <button onClick={() => exportToPDF(filtered, totalOwedAll)} style={btnStyle('#2563eb')}>📄 PDF</button>
          <button onClick={() => router.push('/dashboard/subscriptions')} style={btnStyle('rgba(255,255,255,0.1)')}>← رجوع</button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '18px 14px 40px', position: 'relative', zIndex: 1 }}>

        {/* ===== إحصاءات ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'إجمالي المتأخرات', value: `${totalOwedAll.toLocaleString()} ج`, accent: '#ef4444', icon: '💰' },
            { label: 'منازل في النتائج', value: `${filtered.length} منزل`, accent: '#f97316', icon: '🏠' },
            { label: 'حالات حرجة (+6 أشهر)', value: `${criticalCount}`, accent: '#dc2626', icon: '🔴' },
            { label: 'حالات متوسطة (3-5)', value: `${mediumCount}`, accent: '#f97316', icon: '🟠' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.accent}28`, borderRadius: 14, padding: '14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, left: -10, width: 55, height: 55, borderRadius: '50%', background: `${s.accent}14` }} />
              <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, color: s.accent, lineHeight: 1 }}>{s.value}</p>
              <p style={{ margin: 0, fontSize: 10, color: '#555' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* ===== فلاتر ===== */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>

          {/* بحث */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>🔍 بحث (اسم، رقم، محور)</label>
            <input
              type="text"
              value={searchText}
              placeholder="اكتب أي جزء من الاسم أو الرقم..."
              onChange={e => setSearchText(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            <div>
              <label style={labelStyle}>المحور</label>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={selectStyle}>
                {sectors.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>الخطورة</label>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={selectStyle}>
                {['الكل', 'حرج', 'متوسط', 'بسيط'].map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>الترتيب</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as 'months' | 'amount' | 'name')} style={selectStyle}>
                <option value="months" style={{ background: '#1a1a1a' }}>الأشهر</option>
                <option value="amount" style={{ background: '#1a1a1a' }}>المبلغ</option>
                <option value="name" style={{ background: '#1a1a1a' }}>الاسم</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===== قائمة فارغة ===== */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
            <p style={{ color: '#4ade80', fontSize: 17, fontWeight: 700 }}>لا يوجد متأخرون</p>
            <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>جميع المنازل ملتزمة بالدفع</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(({ house, overdueMonths, totalOwed }) => {
              const sev = getSeverity(overdueMonths.length)
              const isExpanded = expandedId === house.id
              const barW = (overdueMonths.length / maxMonths) * 100

              return (
                <div key={house.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${sev.color}22`,
                  borderRadius: 16, overflow: 'hidden',
                  boxShadow: isExpanded ? `0 0 0 1px ${sev.color}35, 0 6px 24px ${sev.glow}` : 'none',
                  transition: 'box-shadow 0.25s'
                }}>

                  {/* شريط الخطورة */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', width: `${barW}%`, background: `linear-gradient(90deg,${sev.color}80,${sev.color})`, borderRadius: '0 2px 2px 0', transition: 'width 0.5s' }} />
                  </div>

                  {/* رأس البطاقة */}
                  <div onClick={() => setExpandedId(isExpanded ? null : house.id)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>#{house.house_number}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#f5f5f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{house.name}</span>
                        <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 600, flexShrink: 0 }}>{house.sector}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sev.badgeBg, border: `1px solid ${sev.color}40`, color: sev.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sev.color, display: 'inline-block' }} />
                          {overdueMonths.length} شهر · {sev.label}
                        </span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: sev.color, lineHeight: 1.1 }}>
                        {totalOwed.toLocaleString()}<span style={{ fontSize: 11, fontWeight: 500 }}> ج</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>إجمالي المتأخرات</div>
                    </div>

                    <div style={{ width: 26, height: 26, borderRadius: 8, background: `${sev.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: sev.color, transition: 'transform 0.25s', transform: isExpanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▼</div>
                  </div>

                  {/* تفاصيل الأشهر */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${sev.color}18`, padding: '14px 16px', background: `${sev.color}06`, animation: 'fadeIn 0.2s ease' }}>
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666', fontWeight: 700 }}>📅 تفاصيل الأشهر المتأخرة:</p>

                      {/* جدول التفاصيل */}
                      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${sev.color}20` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', background: `${sev.color}18`, padding: '7px 12px' }}>
                          <span style={{ fontSize: 11, color: sev.color, fontWeight: 700 }}>الشهر</span>
                          <span style={{ fontSize: 11, color: sev.color, fontWeight: 700 }}>القسط</span>
                        </div>
                        {overdueMonths.map((m, idx) => (
                          <div key={m.month} style={{
                            display: 'grid', gridTemplateColumns: '1fr auto',
                            padding: '8px 12px',
                            background: idx % 2 === 0 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.1)',
                            borderTop: `1px solid ${sev.color}10`
                          }}>
                            <span style={{ fontSize: 12, color: '#ccc', fontWeight: 600 }}>{formatMonth(m.month)}</span>
                            <span style={{ fontSize: 12, color: m.amount > 0 ? sev.color : '#555', fontWeight: 700 }}>
                              {m.amount > 0 ? `${m.amount.toLocaleString()} ج` : '—'}
                            </span>
                          </div>
                        ))}
                        {/* صف الإجمالي */}
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
        )}

        {/* ===== ملخص أسفل الصفحة ===== */}
        {filtered.length > 0 && (
          <div style={{ marginTop: 18, padding: '16px 18px', background: 'linear-gradient(135deg,rgba(220,38,38,0.1),rgba(153,27,27,0.06))', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>إجمالي المتأخرات ({filtered.length} منزل)</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: '#444' }}>محسوب بناءً على القيمة الافتراضية لكل شهر</p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{totalOwedAll.toLocaleString()}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#dc2626', opacity: 0.6 }}>جنيه</p>
            </div>
          </div>
        )}

        {/* أزرار تصدير سفلية */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => exportToCSV(filtered)} style={{ ...btnStyle('#16a34a'), flex: 1, padding: '12px', fontSize: 13, justifyContent: 'center' }}>
              📊 تصدير Excel (CSV)
            </button>
            <button onClick={() => exportToPDF(filtered, totalOwedAll)} style={{ ...btnStyle('#2563eb'), flex: 1, padding: '12px', fontSize: 13, justifyContent: 'center' }}>
              📄 طباعة / PDF
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#2a2a2a', marginTop: 20 }}>
          يشمل الأشهر من يناير 2026 حتى الشهر الماضي
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: #444; }
        select option { background: #1a1a1a; color: #f0f0f0; }
      `}</style>
    </div>
  )
}

// ---- أنماط مشتركة ----
function btnStyle(bg: string): React.CSSProperties {
  return {
    background: bg, border: 'none', color: '#fff',
    padding: '8px 14px', borderRadius: 9,
    fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5,
    whiteSpace: 'nowrap', transition: 'opacity 0.15s'
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#555', marginBottom: 5, fontWeight: 600
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#ddd', borderRadius: 9, padding: '9px 12px', fontSize: 13,
  cursor: 'text', fontFamily: 'inherit', outline: 'none'
}

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#ddd',
  borderRadius: 9, padding: '8px 10px', fontSize: 12,
  cursor: 'pointer', fontFamily: 'inherit', outline: 'none'
}
