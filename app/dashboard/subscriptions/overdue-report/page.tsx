'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

type House = {
  id: string
  name: string
  house_number: number   // ✅ الاسم الصحيح من الـ DB
  sector: string
}

type OverdueHouse = {
  house: House
  overdueMonths: string[]
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
  // نأخذ حتى الشهر السابق (الشهر الحالي لا يُحسب متأخراً بعد)
  const cursor = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  while (cursor >= start) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
    cursor.setMonth(cursor.getMonth() - 1)
  }
  return months
}

// درجة خطورة التأخير
function getSeverity(months: number): { label: string; color: string; bg: string; dot: string } {
  if (months >= 6) return { label: 'حرج', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' }
  if (months >= 3) return { label: 'متوسط', color: '#ea580c', bg: '#fff7ed', dot: '#ea580c' }
  return { label: 'بسيط', color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' }
}

export default function OverdueReportPage() {
  const router = useRouter()
  const [overdueList, setOverdueList] = useState<OverdueHouse[]>([])
  const [loading, setLoading] = useState(true)
  const [defaultAmount, setDefaultAmount] = useState(50)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterSector, setFilterSector] = useState('الكل')
  const [sortBy, setSortBy] = useState<'months' | 'amount' | 'name'>('months')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    // المبلغ الافتراضي
    const { data: setting } = await supabase
      .from('settings').select('value').eq('key', 'default_subscription').single()
    const defAmt = setting ? parseInt(setting.value) || 50 : 50
    setDefaultAmount(defAmt)

    // المنازل - ✅ الحقل الصحيح house_number
    const { data: houses } = await supabase
      .from('houses')
      .select('id, name, house_number, sector')
      .order('house_number')

    // الاشتراكات
    const { data: subs } = await supabase
      .from('subscriptions').select('house_id, month, amount')

    if (!houses) { setLoading(false); return }

    // بناء خريطة المدفوعات
    const paidMap: Record<string, Set<string>> = {}
    subs?.forEach(s => {
      if (!paidMap[s.house_id]) paidMap[s.house_id] = new Set()
      paidMap[s.house_id].add(s.month)
    })

    // الأشهر منذ بداية 2026 حتى الشهر الماضي
    const allMonths = getMonthsSinceStart()
    const result: OverdueHouse[] = []

    houses.forEach(house => {
      const paid = paidMap[house.id] || new Set()
      const overdueMonths = allMonths.filter(m => !paid.has(m))
      if (overdueMonths.length > 0) {
        result.push({ house, overdueMonths, totalOwed: overdueMonths.length * defAmt })
      }
    })

    result.sort((a, b) => b.overdueMonths.length - a.overdueMonths.length)
    setOverdueList(result)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  const sectors = ['الكل', ...Array.from(new Set(overdueList.map(o => o.house.sector)))]

  const filtered = overdueList
    .filter(o => filterSector === 'الكل' || o.house.sector === filterSector)
    .sort((a, b) => {
      if (sortBy === 'months') return b.overdueMonths.length - a.overdueMonths.length
      if (sortBy === 'amount') return b.totalOwed - a.totalOwed
      return a.house.name.localeCompare(b.house.name, 'ar')
    })

  const totalOwedAll = filtered.reduce((s, o) => s + o.totalOwed, 0)
  const maxMonths = Math.max(...overdueList.map(o => o.overdueMonths.length), 1)

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f0f', direction: 'rtl' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid #dc2626', borderTopColor: 'transparent',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#666', fontSize: 14 }}>جاري تحميل التقرير...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: '"Cairo", "Tajawal", system-ui, sans-serif',
      color: '#f0f0f0'
    }}>

      {/* خلفية ديكورية */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(220,38,38,0.15) 0%, transparent 60%)'
      }} />

      {/* ===== الهيدر ===== */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(220,38,38,0.2)',
        padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #dc2626, #991b1b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 4px 12px rgba(220,38,38,0.4)'
          }}>⚠️</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              تقرير المتأخرين
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#dc2626' }}>
              {overdueList.length} منزل متأخر عن السداد
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/dashboard/subscriptions')}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#ccc', padding: '8px 16px',
            borderRadius: 10, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.2s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          ← رجوع
        </button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px', position: 'relative', zIndex: 1 }}>

        {/* ===== بطاقات الإحصاء ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'منازل متأخرة', value: overdueList.length, suffix: '', accent: '#dc2626' },
            { label: 'إجمالي المتأخرات', value: totalOwedAll.toLocaleString(), suffix: ' ج', accent: '#ea580c' },
            { label: 'المبلغ / شهر', value: defaultAmount, suffix: ' ج', accent: '#d97706' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${stat.accent}33`,
              borderRadius: 16, padding: '16px 14px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: -8, left: -8,
                width: 60, height: 60, borderRadius: '50%',
                background: `${stat.accent}18`
              }} />
              <p style={{ margin: '0 0 6px', fontSize: 11, color: '#666', position: 'relative' }}>{stat.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: stat.accent, position: 'relative', lineHeight: 1 }}>
                {stat.value}<span style={{ fontSize: 12, fontWeight: 500 }}>{stat.suffix}</span>
              </p>
            </div>
          ))}
        </div>

        {/* ===== شريط الفلاتر والترتيب ===== */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '14px 16px',
          marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#555', marginBottom: 5 }}>المحور</label>
            <select
              value={filterSector}
              onChange={e => setFilterSector(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#ddd',
                borderRadius: 9, padding: '8px 12px', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none'
              }}
            >
              {sectors.map(s => <option key={s} value={s} style={{ background: '#1a1a1a' }}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 11, color: '#555', marginBottom: 5 }}>الترتيب حسب</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'months' | 'amount' | 'name')}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#ddd',
                borderRadius: 9, padding: '8px 12px', fontSize: 13,
                cursor: 'pointer', fontFamily: 'inherit', outline: 'none'
              }}
            >
              <option value="months" style={{ background: '#1a1a1a' }}>الأشهر المتأخرة</option>
              <option value="amount" style={{ background: '#1a1a1a' }}>المبلغ المتراكم</option>
              <option value="name" style={{ background: '#1a1a1a' }}>الاسم</option>
            </select>
          </div>
        </div>

        {/* ===== الحالة الفارغة ===== */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#4ade80', fontSize: 18, fontWeight: 700 }}>رائع! لا يوجد متأخرون</p>
            <p style={{ color: '#555', fontSize: 13 }}>جميع المنازل ملتزمة بالدفع</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(({ house, overdueMonths, totalOwed }) => {
              const severity = getSeverity(overdueMonths.length)
              const isExpanded = expandedId === house.id
              const barWidth = (overdueMonths.length / maxMonths) * 100

              return (
                <div
                  key={house.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${severity.color}25`,
                    borderRadius: 16, overflow: 'hidden',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: isExpanded ? `0 0 0 1px ${severity.color}40, 0 8px 24px ${severity.color}15` : 'none'
                  }}
                >
                  {/* شريط التقدم في الأعلى */}
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{
                      height: '100%', width: `${barWidth}%`,
                      background: `linear-gradient(90deg, ${severity.color}99, ${severity.color})`,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      borderRadius: '0 2px 2px 0'
                    }} />
                  </div>

                  {/* رأس البطاقة - قابل للضغط */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : house.id)}
                    style={{
                      padding: '16px 18px', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 12
                    }}
                  >
                    {/* معلومات المنزل */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, color: '#555', background: 'rgba(255,255,255,0.06)',
                          padding: '2px 7px', borderRadius: 5, fontWeight: 600
                        }}>#{house.house_number}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0' }}>{house.name}</span>
                        <span style={{
                          fontSize: 10, background: 'rgba(74,222,128,0.12)',
                          color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 600
                        }}>{house.sector}</span>
                      </div>

                      {/* شارة الخطورة */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: severity.dot, display: 'inline-block',
                          boxShadow: `0 0 6px ${severity.dot}`
                        }} />
                        <span style={{ fontSize: 11, color: severity.color, fontWeight: 600 }}>
                          {severity.label} · {overdueMonths.length} شهر متأخر
                        </span>
                      </div>
                    </div>

                    {/* المبلغ والأشهر */}
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{
                        fontSize: 18, fontWeight: 800, color: severity.color,
                        lineHeight: 1.2, marginBottom: 2
                      }}>
                        {totalOwed.toLocaleString()}
                        <span style={{ fontSize: 11, fontWeight: 500 }}> ج</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#555' }}>إجمالي المتأخرات</div>
                    </div>

                    {/* سهم التوسيع */}
                    <div style={{
                      width: 24, height: 24, borderRadius: 7,
                      background: `${severity.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: severity.color,
                      transition: 'transform 0.3s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                      flexShrink: 0
                    }}>▼</div>
                  </div>

                  {/* ===== قسم الأشهر المتأخرة ===== */}
                  {isExpanded && (
                    <div style={{
                      borderTop: `1px solid ${severity.color}20`,
                      padding: '14px 18px',
                      background: `${severity.color}08`,
                      animation: 'fadeIn 0.2s ease'
                    }}>
                      <p style={{ margin: '0 0 10px', fontSize: 12, color: '#666', fontWeight: 600 }}>
                        📅 الأشهر المتأخرة ({overdueMonths.length} شهر):
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                        {overdueMonths.map((m, idx) => (
                          <span
                            key={m}
                            style={{
                              fontSize: 12, fontWeight: 600,
                              background: `${severity.color}18`,
                              border: `1px solid ${severity.color}30`,
                              color: severity.color,
                              padding: '5px 10px', borderRadius: 8,
                              animation: `fadeIn 0.15s ease ${idx * 0.03}s both`
                            }}
                          >
                            {formatMonth(m)}
                          </span>
                        ))}
                      </div>

                      {/* ملخص صغير */}
                      <div style={{
                        marginTop: 12, padding: '10px 14px',
                        background: 'rgba(0,0,0,0.3)', borderRadius: 10,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: 12, color: '#555' }}>
                          {overdueMonths.length} شهر × {defaultAmount} ج
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: severity.color }}>
                          = {totalOwed.toLocaleString()} ج
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ===== ملخص المجموع في الأسفل ===== */}
        {filtered.length > 0 && (
          <div style={{
            marginTop: 20, padding: '16px 20px',
            background: 'linear-gradient(135deg, rgba(220,38,38,0.12), rgba(153,27,27,0.08))',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>إجمالي المتأخرات ({filtered.length} منزل)</p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#555' }}>
                بناءً على {defaultAmount} جنيه / شهر
              </p>
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>
                {totalOwedAll.toLocaleString()}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#dc2626', opacity: 0.7 }}>جنيه</p>
            </div>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#333', marginTop: 20, paddingBottom: 10 }}>
          التقرير يشمل جميع الأشهر من يناير 2026 حتى الشهر الماضي
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
