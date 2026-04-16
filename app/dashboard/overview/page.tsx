'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function OverviewPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [houseFilter, setHouseFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('')
  const houseRef = useRef<HTMLDivElement>(null)
  const familyRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
  fetchData()
}, [])

  const fetchData = async () => {
    const { data } = await supabase
      .from('houses')
      .select(`
        id,
        house_number,
        name,
        sector,
        families (
          id,
          name,
          individuals (id)
        )
      `)
      .order('house_number', { ascending: true })

    if (data) {
      const expanded: any[] = []
      data.forEach((house: any) => {
        if (house.families && house.families.length > 0) {
          house.families.forEach((family: any) => {
            expanded.push({
              house_number: house.house_number || '—',
              house_name: house.name,
              family_name: family.name,
              sector: house.sector,
              individual_count: family.individuals?.length || 0,
            })
          })
        } else {
          expanded.push({
            house_number: house.house_number || '—',
            house_name: house.name,
            family_name: '—',
            sector: house.sector,
            individual_count: 0,
          })
        }
      })
      setRows(expanded)
    }
    setLoading(false)
  }

  const clearHouse = () => {
    setHouseFilter('')
    if (houseRef.current) houseRef.current.textContent = ''
  }

  const clearFamily = () => {
    setFamilyFilter('')
    if (familyRef.current) familyRef.current.textContent = ''
  }

  const filteredRows = rows.filter(row => {
    const matchHouse = row.house_name?.toLowerCase().includes(houseFilter.toLowerCase()) ||
                       String(row.house_number).includes(houseFilter)
    const matchFamily = row.family_name?.toLowerCase().includes(familyFilter.toLowerCase())
    return matchHouse && matchFamily
  })

  const totalIndividuals = rows.reduce((s, r) => s + r.individual_count, 0)
  const filteredTotal = filteredRows.reduce((s, r) => s + r.individual_count, 0)
  const isFiltering = houseFilter !== '' || familyFilter !== ''

  const editableStyle: React.CSSProperties = {
    flex: 1,
    color: '#ffffff',
    fontFamily: "'Tajawal', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    padding: '12px 4px',
    direction: 'rtl',
    outline: 'none',
    minWidth: 0,
    minHeight: '20px',
    lineHeight: '1.4',
    wordBreak: 'break-all',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body, .overview-root {
          font-family: 'Tajawal', sans-serif;
          background: #0a0f1e;
          min-height: 100vh;
        }

        .overview-root {
          direction: rtl;
          min-height: 100vh;
          background: #0a0f1e;
          background-image:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(20,180,100,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 90%, rgba(16,140,80,0.10) 0%, transparent 60%);
        }

        .ov-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10,15,30,0.85);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(20,180,100,0.15);
        }

        .ov-header-title {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ov-header-title::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #14b464;
          box-shadow: 0 0 10px #14b464;
        }

        .ov-back-btn {
          background: rgba(20,180,100,0.15);
          border: 1px solid rgba(20,180,100,0.35);
          color: #14b464;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ov-back-btn:hover {
          background: rgba(20,180,100,0.28);
          border-color: rgba(20,180,100,0.6);
          transform: translateX(2px);
        }

        .ov-stats {
          display: flex;
          gap: 10px;
          padding: 16px 16px 0;
          max-width: 700px;
          margin: 0 auto;
        }

        .ov-stat-card {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(20,180,100,0.18);
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .ov-stat-label {
          font-size: 10px;
          font-weight: 500;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
        }

        .ov-stat-value {
          font-size: 24px;
          font-weight: 900;
          color: #14b464;
          line-height: 1;
          text-align: center;
        }

        .ov-stat-sub {
          font-size: 10px;
          color: #ffffff;
          text-align: center;
        }

        /* ── FILTERS ── */
        .ov-filters {
          max-width: 700px;
          margin: 0 auto;
          padding: 14px 16px 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .ov-filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(20,180,100,0.22);
          border-radius: 13px;
          padding: 0 12px;
          transition: border-color 0.2s, background 0.2s;
          cursor: text;
        }

        .ov-filter-wrapper:focus-within {
          border-color: rgba(20,180,100,0.6);
          background: rgba(20,180,100,0.08);
        }

        .ov-filter-icon {
          color: #14b464;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        /* placeholder للـ contentEditable */
        .ov-editable:empty::before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.35);
          pointer-events: none;
          font-size: 13px;
        }

        .ov-filter-clear {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 20px;
          cursor: pointer;
          padding: 0 2px;
          line-height: 1;
          transition: color 0.15s;
          flex-shrink: 0;
        }
        .ov-filter-clear:hover { color: #fff; }

        .ov-results-count {
          text-align: center;
          font-size: 12px;
          color: rgba(20,180,100,0.85);
          font-weight: 600;
          padding: 6px 0 2px;
        }

        /* ── CARDS ── */
        .ov-cards {
          max-width: 700px;
          margin: 0 auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ov-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          animation: cardIn 0.4s ease both;
        }

        .ov-card:hover {
          transform: translateY(-2px);
          border-color: rgba(20,180,100,0.3);
          box-shadow: 0 8px 32px rgba(20,180,100,0.08);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .ov-card:nth-child(1)  { animation-delay: 0.03s }
        .ov-card:nth-child(2)  { animation-delay: 0.06s }
        .ov-card:nth-child(3)  { animation-delay: 0.09s }
        .ov-card:nth-child(4)  { animation-delay: 0.12s }
        .ov-card:nth-child(5)  { animation-delay: 0.15s }
        .ov-card:nth-child(6)  { animation-delay: 0.18s }
        .ov-card:nth-child(7)  { animation-delay: 0.21s }
        .ov-card:nth-child(8)  { animation-delay: 0.24s }
        .ov-card:nth-child(9)  { animation-delay: 0.27s }
        .ov-card:nth-child(10) { animation-delay: 0.30s }

        .ov-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }

        .ov-card-serial { display: flex; align-items: center; gap: 8px; }

        .ov-serial-badge {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          background: linear-gradient(135deg, #14b464, #0d8045);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 900;
          color: #fff;
          box-shadow: 0 2px 10px rgba(20,180,100,0.35);
          flex-shrink: 0;
        }

        .ov-house-badge { display: flex; flex-direction: column; }

        .ov-house-label {
          font-size: 9px;
          color: #fff;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .ov-house-num {
          font-size: 15px;
          font-weight: 800;
          color: rgba(255,255,255,0.9);
          line-height: 1.1;
        }

        .ov-sector-pill {
          background: rgba(20,180,100,0.12);
          border: 1px solid rgba(20,180,100,0.25);
          color: #14b464;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
        }

        .ov-card-body { display: flex; flex-direction: column; gap: 0; }

        .ov-info-block {
          padding: 10px 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 10px;
        }

        .ov-info-block + .ov-info-block {
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .ov-info-left { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }

        .ov-info-icon {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: rgba(20,180,100,0.1);
          border: 1px solid rgba(20,180,100,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #14b464;
        }

        .ov-info-label {
          font-size: 11px;
          color: #fff;
          font-weight: 600;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        .ov-info-divider {
          flex: 0 0 auto;
          width: 1px;
          height: 18px;
          background: linear-gradient(to bottom, transparent, rgba(20,180,100,0.5), transparent);
          margin: 0 2px;
        }

        .ov-info-value {
          flex: 1;
          font-size: 14px;
          font-weight: 700;
          color: rgba(255,255,255,0.88);
          text-align: center;
        }

        .ov-card-footer {
          border-top: 1px solid rgba(255,255,255,0.07);
          padding: 10px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.15);
        }

        .ov-footer-label { font-size: 11px; color: #fff; font-weight: 500; }

        .ov-count-chip { display: flex; align-items: center; gap: 5px; }

        .ov-count-dots { display: flex; gap: 3px; }

        .ov-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(20,180,100,0.4);
        }
        .ov-dot.active {
          background: #14b464;
          box-shadow: 0 0 6px rgba(20,180,100,0.7);
        }

        .ov-count-num {
          font-size: 20px;
          font-weight: 900;
          color: #14b464;
          line-height: 1;
          min-width: 28px;
          text-align: center;
        }

        .ov-count-unit { font-size: 10px; color: #fff; font-weight: 500; }

        .ov-total {
          max-width: 700px;
          margin: 0 auto 6px;
          padding: 0 16px;
        }

        .ov-total-inner {
          background: linear-gradient(135deg, rgba(20,180,100,0.18), rgba(20,180,100,0.06));
          border: 1px solid rgba(20,180,100,0.3);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ov-total-text { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.7); }
        .ov-total-num { font-size: 26px; font-weight: 900; color: #14b464; }

        .ov-meta {
          text-align: center;
          font-size: 11px;
          color: #ffffff;
          padding: 6px 0 20px;
          font-weight: 500;
        }

        .ov-no-results {
          text-align: center;
          padding: 40px 20px;
          color: rgba(255,255,255,0.3);
          font-size: 14px;
          font-weight: 500;
        }

        .ov-empty { text-align: center; padding: 80px 20px; }

        .ov-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(20,180,100,0.15);
          border-top-color: #14b464;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .ov-empty-text { font-size: 14px; color: rgba(255,255,255,0.25); font-weight: 500; }
      `}</style>

      <div className="overview-root">

        {/* HEADER */}
        <div className="ov-header">
          <div className="ov-header-title">نظرة عامة — المنازل والأسر</div>
          <button className="ov-back-btn" onClick={() => router.push('/home')}>رجوع</button>
        </div>

        {loading ? (
          <div className="ov-empty">
            <div className="ov-spinner" />
            <p className="ov-empty-text">جاري التحميل...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="ov-empty">
            <p className="ov-empty-text">لا توجد بيانات</p>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="ov-stats">
              <div className="ov-stat-card">
                <span className="ov-stat-label">إجمالي السجلات</span>
                <span className="ov-stat-value">{rows.length}</span>
                <span className="ov-stat-sub">أسرة مسجّلة</span>
              </div>
              <div className="ov-stat-card">
                <span className="ov-stat-label">إجمالي الأفراد</span>
                <span className="ov-stat-value">{totalIndividuals}</span>
                <span className="ov-stat-sub">فرد في المجموع</span>
              </div>
              <div className="ov-stat-card">
                <span className="ov-stat-label">المتوسط / أسرة</span>
                <span className="ov-stat-value">
                  {rows.length > 0 ? (totalIndividuals / rows.length).toFixed(1) : '0'}
                </span>
                <span className="ov-stat-sub">فرد لكل أسرة</span>
              </div>
            </div>

<div className="ov-header-title">! تنويه : البيات قيد الحصر والإدخال </div>




            {/* FILTERS */}
            <div className="ov-filters">

              {/* فلتر المنزل */}
              <div className="ov-filter-wrapper" onClick={() => houseRef.current?.focus()}>
                <div className="ov-filter-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <div
                  ref={houseRef}
                  className="ov-editable"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="ابحث باسم المنزل أو رقمه..."
                  onInput={e => setHouseFilter(e.currentTarget.textContent || '')}
                  style={editableStyle}
                />
                {houseFilter && (
                  <button className="ov-filter-clear" onMouseDown={e => { e.preventDefault(); clearHouse() }}>×</button>
                )}
              </div>

              {/* فلتر الأسرة */}
              <div className="ov-filter-wrapper" onClick={() => familyRef.current?.focus()}>
                <div className="ov-filter-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div
                  ref={familyRef}
                  className="ov-editable"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="ابحث باسم الأسرة..."
                  onInput={e => setFamilyFilter(e.currentTarget.textContent || '')}
                  style={editableStyle}
                />
                {familyFilter && (
                  <button className="ov-filter-clear" onMouseDown={e => { e.preventDefault(); clearFamily() }}>×</button>
                )}
              </div>

              {isFiltering && (
                <p className="ov-results-count">
                  {filteredRows.length === 0
                    ? 'لا توجد نتائج'
                    : `${filteredRows.length} نتيجة — ${filteredTotal} فرد`}
                </p>
              )}
            </div>

            {/* CARDS */}
            {filteredRows.length === 0 ? (
              <div className="ov-no-results">🔍 لا توجد نتائج مطابقة للبحث</div>
            ) : (
              <div className="ov-cards">
                {filteredRows.map((row, index) => {
                  const maxDots = Math.min(row.individual_count, 8)
                  return (
                    <div className="ov-card" key={index}>

                      <div className="ov-card-top">
                        <div className="ov-card-serial">
                          <div className="ov-serial-badge">{index + 1}</div>
                          <div className="ov-house-badge">
                            <span className="ov-house-label">رقم المنزل</span>
                            <span className="ov-house-num">{row.house_number}</span>
                          </div>
                        </div>
                        <div className="ov-sector-pill">{row.sector}</div>
                      </div>

                      <div className="ov-card-body">
                        <div className="ov-info-block">
                          <div className="ov-info-left">
                            <div className="ov-info-icon">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                                <polyline points="9 22 9 12 15 12 15 22"/>
                              </svg>
                            </div>
                            <span className="ov-info-label">المنزل</span>
                          </div>
                          <div className="ov-info-divider" />
                          <span className="ov-info-value">{row.house_name}</span>
                        </div>

                        <div className="ov-info-block">
                          <div className="ov-info-left">
                            <div className="ov-info-icon">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                                <path d="M16 3.13a4 4 0 010 7.75"/>
                              </svg>
                            </div>
                            <span className="ov-info-label">الأسرة</span>
                          </div>
                          <div className="ov-info-divider" />
                          <span className="ov-info-value">أسرة {row.family_name}</span>
                        </div>
                      </div>

                      <div className="ov-card-footer">
                        <span className="ov-footer-label">عدد الأفراد</span>
                        <div className="ov-count-chip">
                          <div className="ov-count-dots">
                            {Array.from({ length: Math.min(maxDots, 5) }).map((_, i) => (
                              <div key={i} className="ov-dot active" />
                            ))}
                            {row.individual_count > 5 && (
                              <div className="ov-dot" style={{ opacity: 0.4 }} />
                            )}
                          </div>
                          <span className="ov-count-num">{row.individual_count}</span>
                          <span className="ov-count-unit">فرد</span>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

            {/* TOTAL */}
            <div className="ov-total">
              <div className="ov-total-inner">
                <span className="ov-total-text">
                  {isFiltering ? 'مجموع أفراد نتائج البحث' : 'المجموع الكلي للأفراد'}
                </span>
                <span className="ov-total-num">
                  {isFiltering ? filteredTotal : totalIndividuals}
                </span>
              </div>
            </div>

            <p className="ov-meta">
              {isFiltering
                ? `${filteredRows.length} من ${rows.length} سجل`
                : `${rows.length} سجل`}
            </p>
          </>
        )}
      </div>
    </>
  )
}
