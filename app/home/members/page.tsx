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

  const roleConfig: Record<string, { bg: string; color: string; accent: string; icon: string }> = {
    'رئيس':  { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c', accent: 'rgba(251,146,60,0.3)',  icon: '👑' },
    'نائب':  { bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', accent: 'rgba(96,165,250,0.3)',  icon: '🔹' },
    'أمين':  { bg: 'rgba(52,211,153,0.12)',  color: '#34d399', accent: 'rgba(52,211,153,0.3)',  icon: '🔑' },
    'عضو':   { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', accent: 'rgba(148,163,184,0.3)', icon: '👤' },
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
          background: #0a0f1e;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(234,88,12,0.15) 0%, transparent 65%),
            radial-gradient(ellipse 50% 40% at 10% 80%, rgba(234,88,12,0.07) 0%, transparent 60%);
        }

        /* ── HEADER ── */
        .mem-header {
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(10,15,30,0.88);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(234,88,12,0.18);
        }

        .mem-header-title {
          font-size: 16px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mem-header-title::before {
          content: '';
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ea580c;
          box-shadow: 0 0 10px #ea580c;
        }

        .mem-back-btn {
          background: rgba(234,88,12,0.12);
          border: 1px solid rgba(234,88,12,0.3);
          color: #fb923c;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .mem-back-btn:hover {
          background: rgba(234,88,12,0.22);
          transform: translateX(2px);
        }

        /* ── BODY ── */
        .mem-body {
          max-width: 680px;
          margin: 0 auto;
          padding: 16px;
        }

        /* ── ADD BUTTON ── */
        .mem-add-btn {
          width: 100%;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          border: none;
          color: #fff;
          border-radius: 14px;
          padding: 14px;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          margin-bottom: 16px;
          letter-spacing: 0.03em;
          transition: all 0.2s ease;
          box-shadow: 0 4px 20px rgba(234,88,12,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .mem-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(234,88,12,0.4);
        }

        /* ── FORM CARD ── */
        .mem-form-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(234,88,12,0.2);
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 16px;
          animation: fadeDown 0.25s ease;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-form-title {
          font-size: 15px;
          font-weight: 800;
          color: #fb923c;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(234,88,12,0.15);
        }

        .mem-field-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          margin-bottom: 6px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .mem-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 11px 13px;
          color: #fff;
          font-size: 14px;
          font-family: 'Tajawal', sans-serif;
          font-weight: 500;
          text-align: right;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-bottom: 14px;
        }
        .mem-input:focus {
          border-color: rgba(234,88,12,0.5);
          box-shadow: 0 0 0 3px rgba(234,88,12,0.1);
        }
        .mem-input.error { border-color: rgba(239,68,68,0.6); }
        .mem-input::placeholder { color: rgba(255,255,255,0.2); }

        .mem-err {
          font-size: 11px;
          color: #f87171;
          margin-top: -10px;
          margin-bottom: 12px;
          padding-right: 4px;
        }

        .mem-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .mem-save-btn {
          flex: 1;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          border: none;
          color: #fff;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 12px rgba(234,88,12,0.3);
        }
        .mem-save-btn:hover { transform: translateY(-1px); }

        .mem-cancel-btn {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mem-cancel-btn:hover { background: rgba(255,255,255,0.1); }

        /* ── STAT BAR ── */
        .mem-stat {
          background: rgba(234,88,12,0.08);
          border: 1px solid rgba(234,88,12,0.2);
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mem-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
        }

        .mem-stat-num {
          font-size: 28px;
          font-weight: 900;
          color: #fb923c;
          line-height: 1;
        }

        /* ── MEMBER CARDS ── */
        .mem-cards {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mem-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
          animation: cardIn 0.35s ease both;
        }

        .mem-card:hover {
          transform: translateY(-2px);
          border-color: rgba(234,88,12,0.25);
          box-shadow: 0 8px 28px rgba(234,88,12,0.08);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-card:nth-child(1)  { animation-delay: 0.03s }
        .mem-card:nth-child(2)  { animation-delay: 0.06s }
        .mem-card:nth-child(3)  { animation-delay: 0.09s }
        .mem-card:nth-child(4)  { animation-delay: 0.12s }
        .mem-card:nth-child(5)  { animation-delay: 0.15s }
        .mem-card:nth-child(6)  { animation-delay: 0.18s }
        .mem-card:nth-child(7)  { animation-delay: 0.21s }
        .mem-card:nth-child(8)  { animation-delay: 0.24s }

        /* card top */
        .mem-card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px 12px;
        }

        .mem-serial {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #ea580c, #c2410c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          box-shadow: 0 3px 10px rgba(234,88,12,0.4);
          flex-shrink: 0;
        }

        .mem-name-block {
          flex: 1;
          min-width: 0;
        }

        .mem-name {
          font-size: 16px;
          font-weight: 800;
          color: rgba(255,255,255,0.92);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mem-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          border: 1px solid;
        }

        /* card footer */
        .mem-card-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0,0,0,0.15);
        }

        .mem-phone-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mem-phone-icon {
          width: 22px;
          height: 22px;
          border-radius: 7px;
          background: rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        .mem-phone {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          direction: ltr;
          font-weight: 500;
        }

        .mem-no-phone {
          font-size: 12px;
          color: rgba(255,255,255,0.18);
        }

        .mem-actions {
          display: flex;
          gap: 8px;
        }

        .mem-edit-btn {
          background: rgba(96,165,250,0.1);
          border: 1px solid rgba(96,165,250,0.2);
          color: #60a5fa;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mem-edit-btn:hover { background: rgba(96,165,250,0.2); }

        .mem-del-btn {
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Tajawal', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mem-del-btn:hover { background: rgba(239,68,68,0.2); }

        /* ── LOADING / EMPTY ── */
        .mem-center {
          text-align: center;
          padding: 80px 20px;
        }

        .mem-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(234,88,12,0.15);
          border-top-color: #ea580c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .mem-empty-text {
          font-size: 14px;
          color: rgba(255,255,255,0.22);
          font-weight: 500;
        }

        /* ── FOOTER ── */
        .mem-footer {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.15);
          padding: 20px 0 28px;
          font-weight: 500;
        }
      `}</style>

      <div className="mem-root">

        {/* HEADER */}
        <div className="mem-header">
          <div className="mem-header-title">إدارة الجمعية</div>
          <button className="mem-back-btn" onClick={() => router.push('/home')}>
            رجوع ←
          </button>
        </div>

        <div className="mem-body">

          {/* ADD BUTTON */}
          {isAdmin && (
            <button className="mem-add-btn" onClick={() => { resetForm(); setShowForm(!showForm) }}>
              <span style={{ fontSize: 18 }}>＋</span>
              إضافة عضو جديد
            </button>
          )}

          {/* FORM */}
          {showForm && (
            <div className="mem-form-card">
              <div className="mem-form-title">
                {editing ? '✏️  تعديل بيانات العضو' : '➕  إضافة عضو جديد'}
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
                {duplicateError && <p className="mem-err">⚠️ {duplicateError}</p>}

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
              <p style={{ fontSize: 40, marginBottom: 12 }}>👥</p>
              <p className="mem-empty-text">لا يوجد أعضاء مسجلون بعد</p>
            </div>
          ) : (
            <>
              {/* STAT */}
              <div className="mem-stat">
                <span className="mem-stat-label">إجمالي أعضاء الجمعية</span>
                <span className="mem-stat-num">{members.length}</span>
              </div>

              {/* CARDS */}
              <div className="mem-cards">
                {members.map((member, index) => {
                  const rc = getRoleConfig(member.role)
                  return (
                    <div className="mem-card" key={member.id}>

                      {/* TOP */}
                      <div className="mem-card-top">
                        <div className="mem-serial">{index + 1}</div>
                        <div className="mem-name-block">
                          <div className="mem-name">{member.full_name}</div>
                          <span
                            className="mem-role-badge"
                            style={{
                              background: rc.bg,
                              color: rc.color,
                              borderColor: rc.accent,
                            }}
                          >
                            {rc.icon} {member.role}
                          </span>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <div className="mem-card-footer">
                        <div className="mem-phone-wrap">
                          <div className="mem-phone-icon">📞</div>
                          {member.phone
                            ? <span className="mem-phone">{member.phone}</span>
                            : <span className="mem-no-phone">لا يوجد رقم</span>
                          }
                        </div>

                        {isAdmin && (
                          <div className="mem-actions">
                            <button className="mem-edit-btn" onClick={() => handleEdit(member)}>تعديل</button>
                            <button className="mem-del-btn" onClick={() => handleDelete(member.id, member.full_name)}>حذف</button>
                          </div>
                        )}
                      </div>

                    </div>
                  )
                })}
              </div>
            </>
          )}

          <p className="mem-footer">© 2026 جمعية العكنة الخيرية</p>
        </div>
      </div>
    </>
  )
}