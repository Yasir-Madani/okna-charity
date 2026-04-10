'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', role: '', phone: '', sort_order: '0' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('members').select('*').order('sort_order')
    if (data) setMembers(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ full_name: '', role: '', phone: '', sort_order: '0' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .ilike('full_name', form.full_name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.full_name.trim()}" موجود مسبقاً في قائمة الأعضاء`)
      return
    }

    const payload = {
      full_name: form.full_name.trim(),
      role: form.role,
      phone: form.phone || null,
      sort_order: Number(form.sort_order),
      created_by: user.id
    }

    if (editing) {
      await supabase.from('members').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('members').insert(payload)
    }

    resetForm()
    fetchData()
  }

  const handleEdit = (member: any) => {
    setForm({
      full_name: member.full_name,
      role: member.role,
      phone: member.phone || '',
      sort_order: member.sort_order?.toString() || '0'
    })
    setEditing(member)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('members').delete().eq('id', id)
    fetchData()
  }

  const roleConfig: Record<string, { bg: string; color: string; border: string }> = {
    'رئيس': { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
    'نائب': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
    'أمين': { bg: '#f0fdf4', color: '#14532d', border: '#bbf7d0' },
    'عضو': { bg: '#f8fafc', color: '#334155', border: '#e2e8f0' },
  }

  const getRoleConfig = (role: string) => {
    const match = Object.keys(roleConfig).find(k => role.includes(k))
    return match ? roleConfig[match] : roleConfig['عضو']
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mem-root {
          font-family: 'Tajawal', sans-serif;
          direction: rtl;
          min-height: 100vh;
          background: #ffffff;
        }

        /* ── HEADER ── */
        .mem-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #fff;
          border-bottom: 1px solid #e8edf2;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .mem-header-inner {
          padding: 14px 20px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mem-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mem-header-accent {
          width: 4px;
          height: 32px;
          background: linear-gradient(180deg, #ea580c, #c2410c);
          border-radius: 4px;
          flex-shrink: 0;
        }

        .mem-header-title {
          font-size: 17px;
          font-weight: 800;
          color: #1e293b;
          letter-spacing: 0.01em;
          line-height: 1.2;
        }

        .mem-header-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 500;
          margin-top: 2px;
        }

        .mem-back-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .mem-back-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #334155;
        }

        /* ── BODY ── */
        .mem-body {
          max-width: 680px;
          margin: 0 auto;
          padding: 20px 16px 32px;
        }

        /* ── ADD BUTTON ── */
        .mem-add-btn {
          width: 100%;
          background: #1e293b;
          border: none;
          color: #fff;
          border-radius: 12px;
          padding: 14px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          margin-bottom: 18px;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 2px 10px rgba(30,41,59,0.14);
        }
        .mem-add-btn:hover {
          background: #0f172a;
          box-shadow: 0 4px 18px rgba(30,41,59,0.2);
          transform: translateY(-1px);
        }

        /* ── FORM CARD ── */
        .mem-form-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-top: 3px solid #ea580c;
          border-radius: 14px;
          padding: 22px;
          margin-bottom: 18px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          animation: fadeDown 0.22s ease;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-form-title {
          font-size: 15px;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mem-form-title-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ea580c;
          flex-shrink: 0;
        }

        .mem-field-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
          letter-spacing: 0.04em;
        }

        .mem-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          padding: 11px 13px;
          color: #1e293b;
          font-size: 14px;
          font-family: 'Tajawal', sans-serif;
          font-weight: 500;
          text-align: right;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
          margin-bottom: 14px;
        }
        .mem-input:focus {
          background: #fff;
          border-color: #ea580c;
          box-shadow: 0 0 0 3px rgba(234,88,12,0.08);
        }
        .mem-input.error { border-color: #ef4444; }
        .mem-input::placeholder { color: #cbd5e1; }

        .mem-err {
          font-size: 12px;
          color: #dc2626;
          margin-top: -10px;
          margin-bottom: 12px;
          padding-right: 2px;
          font-weight: 600;
        }

        .mem-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }

        .mem-save-btn {
          flex: 1;
          background: #1e293b;
          border: none;
          color: #fff;
          padding: 12px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mem-save-btn:hover { background: #0f172a; }

        .mem-cancel-btn {
          flex: 1;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #64748b;
          padding: 12px;
          border-radius: 9px;
          font-size: 14px;
          font-family: 'Tajawal', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mem-cancel-btn:hover { background: #e2e8f0; }

        /* ── MEMBER CARDS ── */
        .mem-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .mem-card {
          background: #fff;
          border: 1px solid #e8edf2;
          border-radius: 14px;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          animation: cardIn 0.32s ease both;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .mem-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(0,0,0,0.08);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-card:nth-child(1) { animation-delay: 0.03s }
        .mem-card:nth-child(2) { animation-delay: 0.06s }
        .mem-card:nth-child(3) { animation-delay: 0.09s }
        .mem-card:nth-child(4) { animation-delay: 0.12s }
        .mem-card:nth-child(5) { animation-delay: 0.15s }
        .mem-card:nth-child(6) { animation-delay: 0.18s }
        .mem-card:nth-child(7) { animation-delay: 0.21s }
        .mem-card:nth-child(8) { animation-delay: 0.24s }

        /* ── CARD INNER LAYOUT ── */
        .mem-card-inner {
          display: flex;
          align-items: stretch;
          min-height: 72px;
        }

        /* serial column */
        .mem-serial-col {
          width: 52px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #f1f5f9;
          background: #fafbfc;
        }

        .mem-serial {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 900;
          color: #fff;
          box-shadow: 0 2px 8px rgba(234,88,12,0.28);
          flex-shrink: 0;
        }

        /* main content column */
        .mem-card-content {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          padding: 0 16px;
          gap: 12px;
        }

        /* name + role block */
        .mem-name-block {
          flex: 1;
          min-width: 0;
        }

        .mem-name {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mem-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 5px;
          padding: 3px 10px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid;
          letter-spacing: 0.02em;
        }

        /* phone block — same column level */
        .mem-phone-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }

        .mem-phone-label {
          font-size: 10px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .mem-phone {
          font-size: 13px;
          color: #334155;
          direction: ltr;
          font-weight: 600;
        }

        .mem-no-phone {
          font-size: 12px;
          color: #cbd5e1;
          font-weight: 500;
        }

        /* actions column */
        .mem-actions-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 14px;
          border-right: 1px solid #f1f5f9;
          flex-shrink: 0;
        }

        .mem-edit-btn {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          padding: 4px 12px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .mem-edit-btn:hover { background: #dbeafe; }

        .mem-del-btn {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 4px 12px;
          border-radius: 7px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .mem-del-btn:hover { background: #fee2e2; }

        /* ── STAT STRIP (bottom) ── */
        .mem-stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-right: 4px solid #ea580c;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }

        .mem-stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .mem-stat-num {
          font-size: 28px;
          font-weight: 900;
          color: #ea580c;
          line-height: 1;
        }

        /* ── LOADING / EMPTY ── */
        .mem-center {
          text-align: center;
          padding: 80px 20px;
        }

        .mem-spinner {
          width: 34px;
          height: 34px;
          border: 3px solid #e2e8f0;
          border-top-color: #ea580c;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .mem-empty-text {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }

        /* ── FOOTER ── */
        .mem-footer {
          text-align: center;
          font-size: 11px;
          color: #cbd5e1;
          padding: 24px 0 0;
          font-weight: 500;
          border-top: 1px solid #f1f5f9;
          margin-top: 24px;
        }
      `}</style>

      <div className="mem-root">

        {/* HEADER */}
        <div className="mem-header">
          <div className="mem-header-inner">
            <div className="mem-header-left">
              <div className="mem-header-accent" />
              <div>
                <div className="mem-header-title">إدارة الجمعية</div>
                <div className="mem-header-sub">الأعضاء الإداريون</div>
              </div>
            </div>
            <button className="mem-back-btn" onClick={() => router.push('/home')}>
              رجوع ←
            </button>
          </div>
        </div>

        <div className="mem-body">

          {/* ADD BUTTON */}
          {isAdmin && (
            <button className="mem-add-btn" onClick={() => { resetForm(); setShowForm(!showForm) }}>
              <span style={{ fontSize: 16 }}>＋</span>
              إضافة عضو جديد
            </button>
          )}

          {/* FORM */}
          {showForm && (
            <div className="mem-form-card">
              <div className="mem-form-title">
                <div className="mem-form-title-dot" />
                {editing ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
              </div>
              <form onSubmit={handleSubmit}>
                <label className="mem-field-label">الاسم الكامل *</label>
                <input
                  required
                  className={`mem-input ${duplicateError ? 'error' : ''}`}
                  value={form.full_name}
                  placeholder="مثال: محمد أحمد"
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setDuplicateError('') }}
                />
                {duplicateError && <p className="mem-err">⚠ {duplicateError}</p>}

                <label className="mem-field-label">المنصب / الوظيفة *</label>
                <input
                  required
                  className="mem-input"
                  value={form.role}
                  placeholder="مثال: رئيس الجمعية"
                  onChange={e => setForm({ ...form, role: e.target.value })}
                />

                <label className="mem-field-label">رقم الهاتف</label>
                <input
                  className="mem-input"
                  value={form.phone}
                  dir="ltr"
                  placeholder="05X XXX XXXX"
                  style={{ textAlign: 'left' }}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />

                <label className="mem-field-label">ترتيب الظهور</label>
                <input
                  type="number"
                  className="mem-input"
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: e.target.value })}
                />

                <div className="mem-form-actions">
                  <button type="submit" className="mem-save-btn">حفظ</button>
                  <button type="button" className="mem-cancel-btn" onClick={resetForm}>إلغاء</button>
                </div>
              </form>
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div className="mem-center">
              <div className="mem-spinner" />
              <p className="mem-empty-text">جاري التحميل...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="mem-center">
              <p style={{ fontSize: 38, marginBottom: 12 }}>👥</p>
              <p className="mem-empty-text">لا يوجد أعضاء مسجلون بعد</p>
            </div>
          ) : (
            <>
              {/* CARDS */}
              <div className="mem-cards">
                {members.map((member, index) => {
                  const rc = getRoleConfig(member.role)
                  return (
                    <div className="mem-card" key={member.id}>
                      <div className="mem-card-inner">

                        {/* SERIAL */}
                        <div className="mem-serial-col">
                          <div className="mem-serial">{index + 1}</div>
                        </div>

                        {/* MAIN CONTENT */}
                        <div className="mem-card-content">
                          {/* name + role */}
                          <div className="mem-name-block">
                            <div className="mem-name">{member.full_name}</div>
                            <span
                              className="mem-role-badge"
                              style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}
                            >
                              {member.role}
                            </span>
                          </div>

                          {/* phone — محاذاة عمودية مع الاسم */}
                          <div className="mem-phone-block">
                            <span className="mem-phone-label">هاتف</span>
                            {member.phone
                              ? <span className="mem-phone">{member.phone}</span>
                              : <span className="mem-no-phone">—</span>
                            }
                          </div>
                        </div>

                        {/* ACTIONS */}
                        {isAdmin && (
                          <div className="mem-actions-col">
                            <button className="mem-edit-btn" onClick={() => handleEdit(member)}>تعديل</button>
                            <button className="mem-del-btn" onClick={() => handleDelete(member.id, member.full_name)}>حذف</button>
                          </div>
                        )}

                      </div>
                    </div>
                  )
                })}
              </div>

              {/* STAT — أسفل القائمة */}
              <div className="mem-stat">
                <span className="mem-stat-label">إجمالي الأعضاء الإداريين</span>
                <span className="mem-stat-num">{members.length}</span>
              </div>
            </>
          )}

          <div className="mem-footer">© 2026 جمعية العكنة الخيرية</div>
        </div>
      </div>
    </>
  )
}