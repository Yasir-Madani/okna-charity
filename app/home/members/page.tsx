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
  const [reordering, setReordering] = useState(false)
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase.from('members').select('*').order('sort_order')
    if (data) setMembers(data)
    setLoading(false)
  }

  // *** الترتيب اليدوي ***
  const moveMember = async (index: number, direction: 'up' | 'down') => {
    const newMembers = [...members]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newMembers.length) return

    ;[newMembers[index], newMembers[swapIndex]] = [newMembers[swapIndex], newMembers[index]]
    setMembers(newMembers)

    setReordering(true)
    await Promise.all(
      newMembers.map((m, i) =>
        supabase.from('members').update({ sort_order: i }).eq('id', m.id)
      )
    )
    setReordering(false)
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

  const getRoleBadgeStyle = (role: string) => {
    if (role.includes('رئيس') && !role.includes('نائب'))
      return { background: '#fdf6e3', color: '#7a5c00', borderColor: '#e8c84a' }
    if (role.includes('نائب'))
      return { background: '#eef2fc', color: '#1a3a8a', borderColor: '#a8bef0' }
    if (role.includes('أمين'))
      return { background: '#edfaf3', color: '#0a5c30', borderColor: '#7adba8' }
    return { background: '#f6f5f2', color: '#3a3a4a', borderColor: '#e8e4da' }
  }

  const getRoleIcon = (role: string) => {
    if (role.includes('رئيس') && !role.includes('نائب')) return '★ '
    if (role.includes('نائب')) return '◈ '
    if (role.includes('أمين')) return '◆ '
    return '◇ '
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mem-root {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          min-height: 100vh;
          background: #f6f5f2;
        }

        .mem-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #1a1a2e;
        }

        .mem-header-inner {
          padding: 0 20px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 720px;
          margin: 0 auto;
        }

        .mem-header-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .mem-header-crest {
          width: 36px;
          height: 36px;
          border: 1px solid rgba(184,149,42,0.4);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mem-header-title {
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: #ffffff;
          letter-spacing: 0.03em;
          line-height: 1.1;
        }

        .mem-header-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.35);
          font-weight: 500;
          margin-top: 2px;
        }

        .mem-gold-rule {
          height: 2px;
          background: linear-gradient(90deg, transparent, #b8952a 30%, #d4aa40 50%, #b8952a 70%, transparent);
          opacity: 0.6;
        }

        .mem-back-btn {
          background: transparent;
          border: 1px solid rgba(184,149,42,0.3);
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.05em;
        }
        .mem-back-btn:hover {
          background: rgba(184,149,42,0.1);
          border-color: #d4aa40;
        }

        .mem-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 24px 16px 40px;
        }

        .mem-add-btn {
          width: 100%;
          background: transparent;
          border: 1.5px dashed #b8952a;
          color: #000000;
          border-radius: 10px;
          padding: 11px;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          margin-bottom: 22px;
          letter-spacing: 0.06em;
          transition: all 0.22s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .mem-add-btn:hover {
          background: #f5e9c0;
          border-style: solid;
          color: #1a1a2e;
        }

        .mem-form-card {
          background: #fff;
          border: 1px solid #e8e4da;
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 22px;
          animation: fadeDown 0.22s ease;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-form-header {
          background: #1a1a2e;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mem-form-header-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d4aa40;
        }

        .mem-form-header-title {
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          color: #ffffff;
          font-size: 15px;
          letter-spacing: 0.04em;
        }

        .mem-form-body {
          padding: 20px;
        }

        .mem-field-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 14px;
        }

        .mem-field-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          margin-bottom: 6px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .mem-input {
          width: 100%;
          background: #f6f5f2;
          border: 1px solid #e8e4da;
          border-radius: 8px;
          padding: 9px 12px;
          color: #000000;
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
          font-weight: 500;
          text-align: right;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .mem-input:focus {
          background: #fff;
          border-color: #b8952a;
          box-shadow: 0 0 0 3px rgba(184,149,42,0.1);
        }
        .mem-input.error { border-color: #c0392b; }
        .mem-input::placeholder { color: #c8c4b8; }

        .mem-err {
          font-size: 11px;
          color: #c0392b;
          margin-top: 5px;
          font-weight: 600;
        }

        .mem-form-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        .mem-save-btn {
          flex: 1;
          background: #1a1a2e;
          border: none;
          color: #ffffff;
          padding: 11px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          letter-spacing: 0.05em;
          transition: all 0.18s;
        }
        .mem-save-btn:hover { background: #0a0a1a; }

        .mem-cancel-btn {
          flex: 1;
          background: transparent;
          border: 1px solid #e8e4da;
          color: #000000;
          padding: 11px;
          border-radius: 8px;
          font-size: 13px;
          font-family: 'Cairo', sans-serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mem-cancel-btn:hover { background: #f6f5f2; }

        .mem-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .mem-section-line {
          flex: 1;
          height: 1px;
          background: #e8e4da;
        }
        .mem-section-text {
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }

        .mem-cards {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .mem-card {
          background: #fff;
          border: 1px solid #e8e4da;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s ease;
          animation: cardIn 0.35s ease both;
          display: flex;
          flex-direction: row;
          align-items: stretch;
        }

        .mem-card:hover {
          border-color: #b8952a;
          box-shadow: 0 6px 24px rgba(184,149,42,0.11);
          transform: translateY(-1px);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .mem-serial-col {
          width: 46px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #e8e4da;
        }

        .mem-serial {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid #b8952a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #000000;
          font-family: 'Cairo', sans-serif;
        }

        .mem-card-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 9px 14px;
          gap: 4px;
        }

        .mem-name {
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          font-size: 15px;
          color: #000000;
          letter-spacing: 0.01em;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mem-role-badge {
          display: inline-flex;
          align-items: center;
          padding: 1px 9px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid;
          letter-spacing: 0.05em;
          align-self: flex-start;
          font-family: 'Cairo', sans-serif;
        }

        .mem-phone {
          font-size: 12px;
          color: #000000;
          direction: rtl;
          font-weight: 600;
          letter-spacing: 0.03em;
          margin-top: 2px;
          text-align: right;
        }

        .mem-no-phone {
          font-size: 11px;
          color: #e8e4da;
          text-align: right;
        }

        /* ── عمود الأزرار (تعديل + حذف + ترتيب) ── */
        .mem-actions-col {
          width: 44px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          border-right: 1px solid #e8e4da;
          background: #f6f5f2;
          padding: 6px 0;
        }

        /* ── أزرار الترتيب ── */
        .mem-sort-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #e8e4da;
          background: #ffffff;
          color: #3a3a4a;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'Cairo', sans-serif;
          line-height: 1;
        }
        .mem-sort-btn:hover:not(:disabled) {
          background: #f5e9c0;
          border-color: #b8952a;
          color: #7a5c00;
        }
        .mem-sort-btn:disabled {
          border-color: #f0ede6;
          color: #d8d4cc;
          cursor: not-allowed;
          background: #fafaf8;
        }

        .mem-edit-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #e8e4da;
          background: #ffffff;
          color: #3a7bd5;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mem-edit-btn:hover {
          background: #eef2fc;
          border-color: #a8bef0;
        }

        .mem-del-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #e8e4da;
          background: #ffffff;
          color: #c0392b;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s;
        }
        .mem-del-btn:hover {
          background: #fdf0ef;
          border-color: #e8a09a;
        }

        .mem-stat {
          margin-top: 22px;
          background: #1a1a2e;
          border-radius: 10px;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mem-stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.92);
          font-weight: 500;
          letter-spacing: 0.05em;
          margin-bottom: 3px;
        }

        .mem-stat-value {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mem-stat-num {
          font-family: 'Cairo', sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: #ffffff;
          line-height: 1;
        }

        .mem-stat-unit {
          font-size: 15px;
          color: #ffffff;
          margin-top: 3px;
          font-weight: 600;
          text-align: center;
        }

        .mem-empty-text {
          font-size: 14px;
          color: #000000;
          font-weight: 500;
        }

        .mem-footer {
          text-align: center;
          font-size: 10px;
          color: #000000;
          padding: 20px 0 0;
          font-weight: 500;
          border-top: 1px solid #e8e4da;
          margin-top: 22px;
          letter-spacing: 0.03em;
        }

        .mem-footer-divider {
          display: inline-block;
          width: 32px;
          height: 1px;
          background: #b8952a;
          vertical-align: middle;
          margin: 0 8px;
          opacity: 0.5;
        }

        .mem-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 20px;
          width: 100%;
        }
      `}</style>

      <div className="mem-root">
        {/* HEADER */}
        <div className="mem-header">
          <div className="mem-header-inner">
            <div className="mem-header-logo">
              <div className="mem-header-crest"></div>
              <div>
                <div className="mem-header-title">إدارة الجمعية</div>
              </div>
            </div>
            <button className="mem-back-btn" onClick={() => router.push('/home')}>رجوع</button>
          </div>
          <div className="mem-gold-rule" />
        </div>

        <div className="mem-body">
          {/* ADD BUTTON */}
          {isAdmin && (
            <button className="mem-add-btn" onClick={() => { resetForm(); setShowForm(!showForm) }}>
              <span style={{ fontSize: 15 }}>＋</span>
              إضافة عضو جديد
            </button>
          )}

          {/* FORM */}
          {showForm && (
            <div className="mem-form-card">
              <div className="mem-form-header">
                <div className="mem-form-header-dot" />
                <div className="mem-form-header-title">
                  {editing ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
                </div>
              </div>
              <div className="mem-form-body">
                <form onSubmit={handleSubmit}>
                  <div className="mem-field-grid">
                    <div>
                      <label className="mem-field-label">الاسم الكامل</label>
                      <input
                        required
                        className={`mem-input ${duplicateError ? 'error' : ''}`}
                        value={form.full_name}
                        placeholder="محمد أحمد العمري"
                        onChange={e => { setForm({ ...form, full_name: e.target.value }); setDuplicateError('') }}
                      />
                      {duplicateError && <p className="mem-err">⚠ {duplicateError}</p>}
                    </div>
                    <div>
                      <label className="mem-field-label">المنصب</label>
                      <input
                        required
                        className="mem-input"
                        value={form.role}
                        placeholder="رئيس الجمعية"
                        onChange={e => setForm({ ...form, role: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mem-field-label">رقم الهاتف</label>
                      <input
                        className="mem-input"
                        value={form.phone}
                        dir="ltr"
                        placeholder="05X XXX XXXX"
                        style={{ textAlign: 'left' }}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mem-field-label">ترتيب الظهور</label>
                      <input
                        type="number"
                        className="mem-input"
                        value={form.sort_order}
                        onChange={e => setForm({ ...form, sort_order: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mem-form-actions">
                    <button type="submit" className="mem-save-btn">حفظ البيانات</button>
                    <button type="button" className="mem-cancel-btn" onClick={resetForm}>إلغاء</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION LABEL */}
          <div className="mem-section-label">
            <div className="mem-section-line" />
            <div className="mem-section-text">الأعضاء المسجلون</div>
            <div className="mem-section-line" />
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="mem-center">
              <p className="mem-empty-text">جاري التحميل...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="mem-center">
              <p style={{ fontSize: 36, marginBottom: 12 }}>👥</p>
              <p className="mem-empty-text">لا يوجد أعضاء مسجلون بعد</p>
            </div>
          ) : (
            <>
              <div className="mem-cards">
                {members.map((member, index) => {
                  const badgeStyle = getRoleBadgeStyle(member.role)
                  const icon = getRoleIcon(member.role)
                  return (
                    <div className="mem-card" key={member.id}>
                      <div className="mem-serial-col">
                        <div className="mem-serial">{index + 1}</div>
                      </div>
                      <div className="mem-card-content">
                        <div className="mem-name">{member.full_name}</div>
                        <span
                          className="mem-role-badge"
                          style={{ background: badgeStyle.background, color: badgeStyle.color, borderColor: badgeStyle.borderColor }}
                        >
                          {icon}{member.role}
                        </span>
                        {member.phone
                          ? <span className="mem-phone">{member.phone}</span>
                          : <span className="mem-no-phone">—</span>
                        }
                      </div>
                      {isAdmin && (
                        <div className="mem-actions-col">
                          {/* *** أزرار الترتيب *** */}
                          <button
                            className="mem-sort-btn"
                            onClick={() => moveMember(index, 'up')}
                            disabled={index === 0 || reordering}
                            title="تحريك لأعلى"
                          >
                            ↑
                          </button>
                          <button
                            className="mem-sort-btn"
                            onClick={() => moveMember(index, 'down')}
                            disabled={index === members.length - 1 || reordering}
                            title="تحريك لأسفل"
                          >
                            ↓
                          </button>
                          {/* *** أزرار التعديل والحذف *** */}
                          <button className="mem-edit-btn" onClick={() => handleEdit(member)} title="تعديل">✎</button>
                          <button className="mem-del-btn" onClick={() => handleDelete(member.id, member.full_name)} title="حذف">✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* STAT */}
              <div className="mem-stat">
                <div>
                  <div className="mem-stat-label">إجمالي الأعضاء الإداريين</div>
                </div>
                <div className="mem-stat-value">
                  <div className="mem-stat-num">{members.length}</div>
                  <div className="mem-stat-unit">أعضاء</div>
                </div>
              </div>
            </>
          )}

          <div className="mem-footer">
            <span className="mem-footer-divider" />
            جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية
            <span className="mem-footer-divider" />
          </div>
        </div>
      </div>
    </>
  )
}
