'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'
import { getAgeCategory } from '../lib/helpers'

export default function PublicDashboard() {
  const [stats, setStats] = useState({
    totalIndividuals: 0,
    totalHouses: 0,
    totalFamilies: 0,
    males: 0,
    females: 0,
    infants: 0,
    children: 0,
    youth: 0,
    adults: 0,
    elderly: 0,
    diseased: 0,
    disabled: 0,
    sectors: {} as Record<string, number>
  })
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const router = useRouter()

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: visData } = await supabase
      .from('page_visibility')
      .select('is_visible')
      .eq('page_key', 'public_dashboard')
      .single()
    if (visData) setIsVisible(visData.is_visible)

    const [{ count: houses }, { count: families }, { data: individuals }] = await Promise.all([
      supabase.from('houses').select('*', { count: 'exact', head: true }),
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('individuals').select(`
        gender, birth_date,
        individual_diseases(id),
        individual_disabilities(id),
        families(houses(sector))
      `)
    ])

    if (!individuals) { setLoading(false); return }

    const sectors: Record<string, number> = {}
    let males = 0, females = 0
    let infants = 0, children = 0, youth = 0, adults = 0, elderly = 0
    let diseased = 0, disabled = 0

    individuals.forEach(ind => {
      if (ind.gender === 'ذكر') males++
      else females++

      if (ind.birth_date) {
        const cat = getAgeCategory(ind.birth_date)
        if (cat === 'رضيع') infants++
        else if (cat === 'طفل') children++
        else if (cat === 'شاب') youth++
        else if (cat === 'بالغ') adults++
        else if (cat === 'مسن') elderly++
      }

      if (ind.individual_diseases && ind.individual_diseases.length > 0) diseased++
      if (ind.individual_disabilities && ind.individual_disabilities.length > 0) disabled++

      const sector = (ind.families as any)?.houses?.sector
      if (sector) sectors[sector] = (sectors[sector] || 0) + 1
    })

    setStats({
      totalIndividuals: individuals.length,
      totalHouses: houses || 0,
      totalFamilies: families || 0,
      males, females, infants, children, youth, adults, elderly,
      diseased, disabled, sectors
    })
    setLoading(false)
  }

  const toggleVisibility = async () => {
    setTogglingVisibility(true)
    const newVal = !isVisible
    await supabase
      .from('page_visibility')
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq('page_key', 'public_dashboard')
    setIsVisible(newVal)
    setTogglingVisibility(false)
  }

  const ageItems = [
    { label: 'رضيع (0–2)', value: stats.infants, color: '#7F77DD' },
    { label: 'طفل (3–14)', value: stats.children, color: '#BA7517' },
    { label: 'شاب (15–24)', value: stats.youth, color: '#639922' },
    { label: 'بالغ (25–64)', value: stats.adults, color: '#1D9E75' },
    { label: 'مسن (65+)', value: stats.elderly, color: '#5F5E5A' },
  ]

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        background: '#F7F6F3',
        fontFamily: "'Cairo', sans-serif",
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: '#111827', padding: '0 16px' }}>
        <div style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '16px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0, letterSpacing: '0.05em' }}>
              جمعية العكنة الخيرية
            </p>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: '2px 0 0' }}>
              لوحة الإحصاء السكاني
            </h1>
          </div>
          <button
            onClick={() => router.push('/home')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              color: '#D1D5DB',
              fontSize: 12,
              fontFamily: "'Cairo', sans-serif",
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            رجوع
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 12px 40px', position: 'relative' }}>

        {/* Visibility overlay for non-admin guests */}
        {!loading && !isAdmin && !isVisible && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 20,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: 24,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(247,246,243,0.85)',
              backdropFilter: 'blur(6px)',
              borderRadius: 16,
            }} />
            <div style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 20,
              border: '0.5px solid #E5E7EB',
              padding: '32px 24px',
              textAlign: 'center',
              width: '100%',
              maxWidth: 360,
            }}>
              <div style={{
                width: 52, height: 52,
                background: '#F0FDF4',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22,
              }}>🔄</div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                البيانات قيد الإدخال
              </h2>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.8, marginBottom: 20 }}>
                يتم حالياً إدخال وتدقيق البيانات السكانية
                <br />
                ستتوفر الإحصائيات بعد اكتمال عملية الحصر
              </p>
              <button
                onClick={() => router.push('/home')}
                style={{
                  width: '100%',
                  background: '#111827',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 0',
                  fontFamily: "'Cairo', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* Admin visibility toggle */}
        {isAdmin && (
          <div style={{
            background: '#fff',
            border: '0.5px solid #E5E7EB',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                حالة الصفحة للزوار
              </p>
              <p style={{
                fontSize: 11, margin: '3px 0 0',
                fontWeight: 600,
                color: isVisible ? '#15803D' : '#DC2626',
              }}>
                {isVisible ? '● مرئية للزوار' : '● مخفية — تغطية نشطة'}
              </p>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              style={{
                background: isVisible ? '#FEF2F2' : '#F0FDF4',
                color: isVisible ? '#DC2626' : '#15803D',
                border: `0.5px solid ${isVisible ? '#FECACA' : '#BBF7D0'}`,
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontFamily: "'Cairo', sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {togglingVisibility ? '...' : isVisible ? 'إخفاء الصفحة' : 'إظهار الصفحة'}
            </button>
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '80px 0', gap: 14,
          }}>
            <div style={{
              width: 36, height: 36,
              border: '3px solid #E5E7EB',
              borderTopColor: '#111827',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>جاري تحميل البيانات...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ── Section: General Stats ── */}
            <SectionLabel>إحصاءات عامة</SectionLabel>
            <div style={gridStyle(3)}>
              <StatCard value={stats.totalIndividuals} label="إجمالي الأفراد" accent="#185FA5" />
              <StatCard value={stats.totalHouses} label="إجمالي المنازل" accent="#3B6D11" />
              <StatCard value={stats.totalFamilies} label="إجمالي الأسر" accent="#854F0B" />
            </div>

            {/* ── Section: Gender ── */}
            <SectionLabel>توزيع الجنس</SectionLabel>
            <div style={gridStyle(2)}>
              <StatCard value={stats.males} label="الذكور" accent="#0F6E56" />
              <StatCard value={stats.females} label="الإناث" accent="#993556" />
            </div>

            {/* ── Section: Age groups ── */}
            <SectionLabel>الفئات العمرية</SectionLabel>
            <div style={{ ...gridStyle(3), gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              <StatCard value={stats.infants} label="الرضع" accent="#534AB7" />
              <StatCard value={stats.children} label="الأطفال" accent="#854F0B" />
              <StatCard value={stats.youth} label="الشباب" accent="#3B6D11" />
              <StatCard value={stats.adults} label="البالغون" accent="#0F6E56" />
              <StatCard value={stats.elderly} label="كبار السن" accent="#444441" />
            </div>

            {/* ── Section: Health ── */}
            <SectionLabel>الحالات الصحية</SectionLabel>
            <div style={gridStyle(2)}>
              <StatCard value={stats.diseased} label="أمراض مزمنة" accent="#A32D2D" />
              <StatCard value={stats.disabled} label="حالات إعاقة" accent="#993C1D" />
            </div>

            {/* ── Section: Geographic distribution ── */}
            <SectionLabel>التوزيع الجغرافي</SectionLabel>
            <div style={{
              background: '#fff',
              border: '0.5px solid #E5E7EB',
              borderRadius: 14,
              padding: '14px',
              marginBottom: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
            }}>
              {Object.entries(stats.sectors).map(([sector, count]) => (
                <div key={sector} style={{
                  background: '#F7F6F3',
                  borderRadius: 10,
                  padding: '12px 10px',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: 0 }}>
                    {count.toLocaleString('ar')}
                  </p>
                  {/* ← نص المحور أسود */}
                  <p style={{ fontSize: 11, color: '#111827', margin: '3px 0 0', fontWeight: 600 }}>
                    محور {sector}
                  </p>
                  {/* ← النسبة المئوية سوداء */}
                  <p style={{ fontSize: 10, color: '#111827', margin: '2px 0 0', fontWeight: 500 }}>
                    {stats.totalIndividuals > 0 ? Math.round((count / stats.totalIndividuals) * 100) : 0}٪
                  </p>
                </div>
              ))}
            </div>

            {/* ── Section: Age bar chart ── */}
            <SectionLabel>التوزيع العمري</SectionLabel>
            <div style={{
              background: '#fff',
              border: '0.5px solid #E5E7EB',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 10,
            }}>
              {ageItems.map((item, i) => {
                const pct = stats.totalIndividuals > 0
                  ? Math.round((item.value / stats.totalIndividuals) * 100)
                  : 0
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: i < ageItems.length - 1 ? 10 : 0,
                  }}>
                    {/* ← تسمية الفئة العمرية سوداء */}
                    <span style={{
                      fontSize: 12, color: '#111827',
                      fontWeight: 600,
                      width: 90, flexShrink: 0, textAlign: 'right',
                    }}>
                      {item.label}
                    </span>
                    <div style={{
                      flex: 1,
                      background: '#F3F4F6',
                      borderRadius: 100,
                      height: 5,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${Math.max(pct, 2)}%`,
                        height: 5,
                        borderRadius: 100,
                        background: item.color,
                      }} />
                    </div>
                    {/* ← النسبة المئوية سوداء */}
                    <span style={{
                      fontSize: 11, color: '#111827',
                      fontWeight: 600,
                      width: 26, textAlign: 'left',
                    }}>
                      {pct}٪
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '20px 16px',
        borderTop: '0.5px solid #E5E7EB',
      }}>
        <p className="text-xs text-black-300">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </footer>
    </div>
  )
}

/* ────────── Sub-components ────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#9CA3AF',
      letterSpacing: '0.06em',
      margin: '16px 0 8px 2px',
      textTransform: 'uppercase',
    }}>
      {children}
    </p>
  )
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: number
  label: string
  accent: string
}) {
  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #E5E7EB',
      borderRadius: 12,
      padding: '14px 12px 12px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0, left: 0,
        height: 3,
        background: accent,
        borderRadius: '12px 12px 0 0',
      }} />
      <p style={{
        fontSize: 24,
        fontWeight: 800,
        color: accent,
        margin: 0,
        lineHeight: 1.1,
        letterSpacing: '-0.5px',
      }}>
        {value.toLocaleString('ar')}
      </p>
      {/* ← النص الوصفي أسود */}
      <p style={{
        fontSize: 11,
        color: '#111827',
        margin: '5px 0 0',
        fontWeight: 600,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </p>
    </div>
  )
}

function gridStyle(cols: number): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: 8,
    marginBottom: 4,
  }
}
