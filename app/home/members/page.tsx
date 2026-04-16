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
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('members').delete().eq('id', id)
    fetchData()
  }

  const getRoleStyle = (role: string) => {
    if (role.includes('رئيس')) return { grad: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', text: '#fff' }
    if (role.includes('نائب')) return { grad: 'linear-gradient(135deg, #334155 0%, #475569 100%)', text: '#fff' }
    return { grad: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', text: '#1e293b' }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        
        :root {
          --primary: #ea580c;
          --secondary: #1e293b;
          --bg: #f8fafc;
        }

        .ok-root {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          min-height: 100vh;
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: var(--secondary);
          padding-bottom: 50px;
        }

        /* Glassmorphism Header */
        .ok-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
        }

        .ok-header-inner {
          max-width: 1000px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ok-brand { display: flex; align-items: center; gap: 14px; }
        .ok-logo-box {
          width: 42px;
          height: 42px;
          background: var(--secondary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          font-weight: 900;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
        }

        .ok-title h1 { font-size: 18px; font-weight: 900; color: var(--secondary); margin: 0; }
        .ok-title p { font-size: 11px; color: #64748b; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

        .ok-back-btn {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 20px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
        }
        .ok-back-btn:hover { background: var(--secondary); color: white; border-color: var(--secondary); }

        .ok-container {
          max-width: 800px;
          margin: 30px auto;
          padding: 0 20px;
        }

        /* Action Section */
        .ok-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }

        .ok-add-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 10px 20px rgba(234, 88, 12, 0.2);
          transition: 0.3s;
        }
        .ok-add-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(234, 88, 12, 0.3); }

        /* Modern Card Grid */
        .ok-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .ok-member-card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          position: relative;
          border: 1px solid rgba(255,255,255,0.8);
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }
        .ok-member-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }

        .ok-avatar {
          width: 70px;
          height: 70px;
          background: #f1f5f9;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 16px;
          color: var(--secondary);
          border: 1px solid #e2e8f0;
        }

        .ok-mem-name { font-size: 18px; font-weight: 800; margin-bottom: 6px; color: var(--secondary); }
        .ok-mem-role {
          font-size: 12px;
          font-weight: 700;
          padding: 5px 15px;
          border-radius: 10px;
          margin-bottom: 15px;
        }

        .ok-mem-phone {
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 8px;
          direction: ltr;
        }

        .ok-card-actions {
          position: absolute;
          top: 15px;
          left: 15px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          opacity: 0;
          transition: 0.3s;
        }
        .ok-member-card:hover .ok-card-actions { opacity: 1; }

        .ok-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .ok-edit { background: #eff6ff; color: #2563eb; }
        .ok-delete { background: #fef2f2; color: #dc2626; }
        .ok-icon-btn:hover { transform: scale(1.1); }

        /* Form Styling */
        .ok-form-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .ok-form-modal {
          background: white;
          width: 100%;
          max-width: 450px;
          border-radius: 28px;
          padding: 35px;
          box-shadow: 0 25px 50px rgba(0,0,0,0.2);
          animation: modalIn 0.4s ease;
        }

        @keyframes modalIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        .ok-input-group { margin-bottom: 20px; }
        .ok-input-group label { display: block; font-size: 13px; font-weight: 800; margin-bottom: 8px; color: #475569; }
        .ok-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 14px;
          border: 2px solid #f1f5f9;
          font-family: inherit;
          font-weight: 600;
          transition: 0.3s;
          background: #f8fafc;
        }
        .ok-input:focus { border-color: var(--primary); outline: none; background: white; box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.1); }

        .ok-modal-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; }
        .ok-save-btn { background: var(--secondary); color: white; border: none; padding: 14px; border-radius: 14px; font-weight: 800; cursor: pointer; }
        .ok-cancel-btn { background: #f1f5f9; color: #64748b; border: none; padding: 14px; border-radius: 14px; font-weight: 800; cursor: pointer; }

        .ok-empty { text-align: center; padding: 100px 0; color: #94a3b8; }
        .ok-empty i { font-size: 60px; display: block; margin-bottom: 20px; }
      `}</style>

      <div className="ok-root">
        {/* Modern Header */}
        <header className="ok-header">
          <div className="ok-header-inner">
            <div className="ok-brand">
              <div className="ok-logo-box">O</div>
              <div className="ok-title">
                <h1>إدارة الجمعية</h1>
                <p>Okna Administration</p>
              </div>
            </div>
            <button className="ok-back-btn" onClick={() => router.push('/home')}>العودة للرئيسية</button>
          </div>
        </header>

        <main className="ok-container">
          <div className="ok-action-bar">
             <h2 style={{fontSize: '22px', fontWeight: 900}}>قائمة الأعضاء</h2>
             {isAdmin && (
                <button className="ok-add-btn" onClick={() => setShowForm(true)}>
                  <span>إضافة عضو جديد</span>
                  <span style={{fontSize: '20px'}}>+</span>
                </button>
             )}
          </div>

          {loading ? (
            <div className="ok-empty">جاري تحميل البيانات...</div>
          ) : members.length === 0 ? (
            <div className="ok-empty">
              <i>👥</i>
              <p>لا يوجد أعضاء مضافون حالياً</p>
            </div>
          ) : (
            <div className="ok-grid">
              {members.map((member) => {
                const style = getRoleStyle(member.role);
                return (
                  <div className="ok-member-card" key={member.id}>
                    {isAdmin && (
                      <div className="ok-card-actions">
                        <button className="ok-icon-btn ok-edit" onClick={() => handleEdit(member)}>✎</button>
                        <button className="ok-icon-btn ok-delete" onClick={() => handleDelete(member.id, member.full_name)}>✕</button>
                      </div>
                    )}
                    <div className="ok-avatar">{member.full_name.charAt(0)}</div>
                    <div className="ok-mem-name">{member.full_name}</div>
                    <div className="ok-mem-role" style={{ background: style.grad, color: style.text }}>
                      {member.role}
                    </div>
                    {member.phone && <div className="ok-mem-phone">{member.phone}</div>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="ok-form-overlay">
              <div className="ok-form-modal">
                <h2 style={{marginBottom: '25px', fontWeight: 900, textAlign: 'center'}}>
                  {editing ? 'تعديل البيانات' : 'إضافة عضو جديد'}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="ok-input-group">
                    <label>الاسم بالكامل</label>
                    <input 
                      className="ok-input" 
                      required 
                      value={form.full_name}
                      onChange={e => setForm({...form, full_name: e.target.value})}
                      placeholder="أدخل الاسم الثلاثي"
                    />
                    {duplicateError && <p style={{color: 'red', fontSize: '11px', marginTop: '5px'}}>{duplicateError}</p>}
                  </div>

                  <div className="ok-input-group">
                    <label>المنصب الإداري</label>
                    <input 
                      className="ok-input" 
                      required 
                      value={form.role}
                      onChange={e => setForm({...form, role: e.target.value})}
                      placeholder="مثلاً: رئيس، نائب، أمين مال"
                    />
                  </div>

                  <div className="ok-input-group">
                    <label>رقم التواصل</label>
                    <input 
                      className="ok-input" 
                      value={form.phone}
                      onChange={e => setForm({...form, phone: e.target.value})}
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>

                  <div className="ok-input-group">
                    <label>الأولوية في الترتيب</label>
                    <input 
                      type="number"
                      className="ok-input" 
                      value={form.sort_order}
                      onChange={e => setForm({...form, sort_order: e.target.value})}
                    />
                  </div>

                  <div className="ok-modal-btns">
                    <button type="submit" className="ok-save-btn">حفظ البيانات</button>
                    <button type="button" className="ok-cancel-btn" onClick={resetForm}>إلغاء</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        <footer style={{textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid #e2e8f0', opacity: 0.6, fontSize: '12px'}}>
           جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية 2026
        </footer>
      </div>
    </>
  )
}