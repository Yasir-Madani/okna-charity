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
      setDuplicateError(`"${form.full_name.trim()}" موجود مسبقاً`)
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
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('members').delete().eq('id', id)
    fetchData()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
        
        .mem-container {
          direction: rtl;
          font-family: 'Tajawal', sans-serif;
          background-color: #fcfcfc;
          min-height: 100vh;
          padding-bottom: 50px;
        }

        /* Header Styling */
        .mem-header {
          background: #fff;
          border-bottom: 2px solid #f1f5f9;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
        }

        .mem-title-box h1 {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .mem-title-box p {
          font-size: 13px;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        /* Buttons */
        .btn-add {
          background: #ea580c;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .btn-add:hover { background: #c2410c; transform: scale(1.02); }

        .btn-back {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Member Card - The Table Look */
        .mem-list {
          max-width: 800px;
          margin: 25px auto;
          padding: 0 15px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .member-row {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .member-row:hover {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-color: #ea580c;
        }

        /* Right Serial Column */
        .serial-col {
          width: 60px;
          background: #f8fafc;
          border-left: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: #94a3b8;
        }

        /* Data Column */
        .data-col {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .data-cell {
          padding: 12px 20px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          min-height: 45px;
        }

        .data-cell:last-child { border-bottom: none; }

        .cell-text {
          font-size: 16px;
          font-weight: 700;
          color: #334155;
        }

        .cell-role {
          color: #ea580c;
          font-weight: 600;
        }

        .cell-phone {
          font-family: monospace;
          letter-spacing: 1px;
          color: #64748b;
        }

        /* Admin Actions Column */
        .actions-col {
          width: 100px;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #f1f5f9;
        }

        .action-btn {
          flex: 1;
          border: none;
          cursor: pointer;
          font-family: 'Tajawal';
          font-weight: 700;
          font-size: 13px;
          transition: 0.2s;
        }

        .edit-btn { background: #eff6ff; color: #2563eb; }
        .edit-btn:hover { background: #dbeafe; }
        .del-btn { background: #fef2f2; color: #dc2626; }
        .del-btn:hover { background: #fee2e2; }

        /* Form Styling */
        .form-overlay {
          background: white;
          border: 2px solid #ea580c;
          border-radius: 15px;
          padding: 25px;
          margin-bottom: 30px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; margin-bottom: 5px; font-weight: 700; font-size: 14px; }
        .input-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-family: 'Tajawal';
          outline: none;
        }
        .input-group input:focus { border-color: #ea580c; ring: 2px solid #ffedd5; }

        .form-btns { display: flex; gap: 10px; margin-top: 20px; }
        .btn-save { flex: 2; background: #1e293b; color: white; padding: 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }
        .btn-cancel { flex: 1; background: #f1f5f9; color: #475569; padding: 12px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }
      `}</style>

      <div className="mem-container">
        {/* Header */}
        <header className="mem-header">
          <div className="mem-title-box">
            <h1>الأعضاء والإدارة</h1>
            <p>الهيكل الإداري للجمعية</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isAdmin && <button className="btn-add" onClick={() => setShowForm(true)}>+ إضافة عضو</button>}
            <button className="btn-back" onClick={() => router.push('/home')}>رجوع</button>
          </div>
        </header>

        <main className="mem-list">
          {/* Add/Edit Form */}
          {showForm && (
            <div className="form-overlay">
              <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>{editing ? 'تعديل بيانات عضو' : 'إضافة عضو جديد'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label>الاسم الكامل</label>
                  <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="أدخل الاسم الثلاثي" />
                </div>
                <div className="input-group">
                  <label>المنصب</label>
                  <input required value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="مثال: رئيس الجمعية" />
                </div>
                <div className="input-group">
                  <label>رقم الهاتف</label>
                  <input dir="ltr" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="09XXXXXXXX" />
                </div>
                {duplicateError && <p style={{ color: 'red', fontSize: '13px' }}>{duplicateError}</p>}
                <div className="form-btns">
                  <button type="submit" className="btn-save">حفظ البيانات</button>
                  <button type="button" className="btn-cancel" onClick={resetForm}>إلغاء</button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>جاري التحميل...</div>
          ) : (
            members.map((member, index) => (
              <div className="member-row" key={member.id}>
                {/* الرقم المتسلسل كما في الصورة */}
                <div className="serial-col">
                  {index + 1}
                </div>

                {/* بيانات العضو مقسمة لصفوف داخلية كما في الصورة */}
                <div className="data-col">
                  <div className="data-cell">
                    <span className="cell-text">{member.full_name}</span>
                  </div>
                  <div className="data-cell">
                    <span className="cell-text cell-role">{member.role}</span>
                  </div>
                  <div className="data-cell">
                    <span className="cell-text cell-phone">{member.phone || 'لا يوجد هاتف'}</span>
                  </div>
                </div>

                {/* أزرار التحكم للإدمن */}
                {isAdmin && (
                  <div className="actions-col">
                    <button className="action-btn edit-btn" onClick={() => handleEdit(member)}>تعديل</button>
                    <button className="action-btn del-btn" onClick={() => handleDelete(member.id, member.full_name)}>حذف</button>
                  </div>
                )}
              </div>
            ))
          )}
        </main>
      </div>
    </>
  )
}