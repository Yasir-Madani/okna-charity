import { useState } from 'react'

interface Member {
  id: string
  full_name: string
  role: string
  phone?: string
  sort_order: number
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([
    { id: '1', full_name: 'عبدالله محمد الأحمدي', role: 'رئيس الجمعية', phone: '0501234567', sort_order: 1 },
    { id: '2', full_name: 'فهد سعد العتيبي', role: 'نائب الرئيس', phone: '0507654321', sort_order: 2 },
    { id: '3', full_name: 'خالد أحمد القحطاني', role: 'أمين الصندوق', phone: '0509876543', sort_order: 3 },
    { id: '4', full_name: 'سعد عبدالعزيز المطيري', role: 'عضو مجلس الإدارة', sort_order: 4 },
    { id: '5', full_name: 'محمد سليمان الدوسري', role: 'عضو مجلس الإدارة', phone: '0503456789', sort_order: 5 },
  ])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)
  const [form, setForm] = useState({ full_name: '', role: '', phone: '', sort_order: '0' })
  const [duplicateError, setDuplicateError] = useState('')

  const resetForm = () => {
    setForm({ full_name: '', role: '', phone: '', sort_order: '0' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const existing = members.find(
      m => m.full_name.toLowerCase() === form.full_name.trim().toLowerCase() && m.id !== editing?.id
    )

    if (existing) {
      setDuplicateError(`"${form.full_name.trim()}" موجود مسبقاً في قائمة الأعضاء`)
      return
    }

    if (editing) {
      setMembers(members.map(m => 
        m.id === editing.id 
          ? { ...m, full_name: form.full_name.trim(), role: form.role, phone: form.phone || undefined, sort_order: Number(form.sort_order) }
          : m
      ))
    } else {
      const newMember: Member = {
        id: Date.now().toString(),
        full_name: form.full_name.trim(),
        role: form.role,
        phone: form.phone || undefined,
        sort_order: Number(form.sort_order)
      }
      setMembers([...members, newMember])
    }

    resetForm()
  }

  const handleEdit = (member: Member) => {
    setForm({
      full_name: member.full_name,
      role: member.role,
      phone: member.phone || '',
      sort_order: member.sort_order.toString()
    })
    setEditing(member)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    setMembers(members.filter(m => m.id !== id))
  }

  const roleConfig: Record<string, { bg: string; color: string; border: string }> = {
    'رئيس': { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#92400e', border: 'rgba(251, 191, 36, 0.4)' },
    'نائب': { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', color: '#1e40af', border: 'rgba(59, 130, 246, 0.4)' },
    'أمين': { bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', color: '#065f46', border: 'rgba(16, 185, 129, 0.4)' },
    'عضو': { bg: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', color: '#475569', border: 'rgba(148, 163, 184, 0.4)' },
  }

  const getRoleConfig = (role: string) => {
    const match = Object.keys(roleConfig).find(k => role.includes(k))
    return match ? roleConfig[match] : roleConfig['عضو']
  }

  const sortedMembers = [...members].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .mem-root {
          font-family: 'Cairo', sans-serif;
          direction: rtl;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-attachment: fixed;
          position: relative;
        }

        .mem-root::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 135, 214, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(138, 118, 249, 0.3) 0%, transparent 50%);
          pointer-events: none;
        }

        /* ── HEADER ── */
        .mem-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 
            0 4px 24px rgba(102, 126, 234, 0.12),
            0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .mem-header-inner {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 720px;
          margin: 0 auto;
        }

        .mem-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mem-header-accent {
          width: 5px;
          height: 42px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .mem-header-title {
          font-size: 20px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .mem-header-sub {
          font-size: 12px;
          color: #6b7280;
          font-weight: 600;
          margin-top: 3px;
          letter-spacing: 0.02em;
        }

        /* ── BODY ── */
        .mem-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 20px 48px;
          position: relative;
          z-index: 1;
        }

        /* ── ADD BUTTON ── */
        .mem-add-btn {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
          border-radius: 16px;
          padding: 18px;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          margin-bottom: 24px;
          letter-spacing: 0.02em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 
            0 8px 24px rgba(102, 126, 234, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .mem-add-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .mem-add-btn:hover::before {
          left: 100%;
        }

        .mem-add-btn:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 12px 32px rgba(102, 126, 234, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .mem-add-btn:active {
          transform: translateY(-1px);
        }

        /* ── FORM CARD ── */
        .mem-form-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
          box-shadow: 
            0 20px 50px rgba(102, 126, 234, 0.15),
            0 1px 2px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: fadeDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .mem-form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% 100%;
          animation: gradientShift 3s ease infinite;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mem-form-title {
          font-size: 17px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid rgba(102, 126, 234, 0.1);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .mem-form-title-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
        }

        .mem-field-label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 8px;
          letter-spacing: 0.02em;
        }

        .mem-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          padding: 13px 16px;
          color: #1f2937;
          font-size: 14px;
          font-family: 'Cairo', sans-serif;
          font-weight: 500;
          text-align: right;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-bottom: 18px;
        }
        .mem-input:focus {
          background: #fff;
          border-color: #667eea;
          box-shadow: 
            0 0 0 4px rgba(102, 126, 234, 0.1),
            0 4px 12px rgba(102, 126, 234, 0.15);
          transform: translateY(-1px);
        }
        .mem-input.error { 
          border-color: #ef4444;
          background: rgba(254, 242, 242, 0.7);
        }
        .mem-input::placeholder { color: #9ca3af; }

        .mem-err {
          font-size: 13px;
          color: #dc2626;
          margin-top: -14px;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(254, 242, 242, 0.8);
          border-radius: 10px;
          font-weight: 600;
          border-left: 3px solid #ef4444;
        }

        .mem-form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .mem-save-btn {
          flex: 1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: #fff;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 6px 18px rgba(102, 126, 234, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }
        .mem-save-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 
            0 8px 24px rgba(102, 126, 234, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .mem-save-btn:active {
          transform: translateY(0);
        }

        .mem-cancel-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(102, 126, 234, 0.2);
          color: #6b7280;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Cairo', sans-serif;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .mem-cancel-btn:hover { 
          background: rgba(255, 255, 255, 1);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .mem-cancel-btn:active {
          transform: translateY(0);
        }

        /* ── MEMBER CARDS ── */
        .mem-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mem-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 18px;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: cardIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
          box-shadow: 
            0 4px 20px rgba(102, 126, 234, 0.08),
            0 1px 3px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          display: flex;
          flex-direction: row;
          align-items: stretch;
          position: relative;
        }

        .mem-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .mem-card:hover::before {
          opacity: 1;
        }

        .mem-card:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 
            0 12px 40px rgba(102, 126, 234, 0.15),
            0 2px 4px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border-color: rgba(102, 126, 234, 0.2);
        }

        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .mem-card:nth-child(1) { animation-delay: 0.05s }
        .mem-card:nth-child(2) { animation-delay: 0.1s }
        .mem-card:nth-child(3) { animation-delay: 0.15s }
        .mem-card:nth-child(4) { animation-delay: 0.2s }
        .mem-card:nth-child(5) { animation-delay: 0.25s }
        .mem-card:nth-child(6) { animation-delay: 0.3s }
        .mem-card:nth-child(7) { animation-delay: 0.35s }
        .mem-card:nth-child(8) { animation-delay: 0.4s }

        /* ── SERIAL COLUMN (left side) ── */
        .mem-serial-col {
          width: 70px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-left: 1px solid rgba(102, 126, 234, 0.1);
          position: relative;
        }

        .mem-serial-col::before {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: linear-gradient(180deg, transparent, rgba(102, 126, 234, 0.5), transparent);
          border-radius: 2px;
        }

        .mem-serial {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 900;
          color: #fff;
          box-shadow: 
            0 4px 16px rgba(102, 126, 234, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mem-card:hover .mem-serial {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 
            0 6px 20px rgba(102, 126, 234, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        /* ── MAIN CONTENT (center stacked) ── */
        .mem-card-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 20px 20px;
          gap: 0;
          text-align: center;
        }

        .mem-name {
          font-size: 17px;
          font-weight: 800;
          color: #1f2937;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: -0.01em;
        }

        .mem-divider {
          width: 50px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
          margin: 10px auto;
        }

        .mem-role-badge {
          display: inline-block;
          padding: 5px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          border: 1.5px solid;
          letter-spacing: 0.02em;
          margin: 0 auto 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mem-card:hover .mem-role-badge {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .mem-phone {
          font-size: 14px;
          color: #6b7280;
          direction: ltr;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .mem-no-phone {
          font-size: 13px;
          color: #d1d5db;
        }

        /* ── ACTIONS COLUMN (right side) ── */
        .mem-actions-col {
          width: 70px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 0;
          border-right: 1px solid rgba(102, 126, 234, 0.1);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(240, 147, 251, 0.02) 100%);
        }

        .mem-edit-btn {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border: 1.5px solid rgba(59, 130, 246, 0.3);
          color: #1e40af;
          width: 42px;
          height: 36px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }
        .mem-edit-btn:hover { 
          background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
        }

        .mem-del-btn {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 1.5px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          width: 42px;
          height: 36px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Cairo', sans-serif;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
        }
        .mem-del-btn:hover { 
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        /* ── STAT STRIP ── */
        .mem-stat {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          box-shadow: 
            0 8px 24px rgba(102, 126, 234, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
        }

        .mem-stat::before {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 0 16px rgba(102, 126, 234, 0.5);
        }

        .mem-stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .mem-stat-num {
          font-size: 32px;
          font-weight: 900;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }

        /* ── FOOTER ── */
        .mem-footer {
          text-align: center;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.95);
          padding: 32px 0 0;
          font-weight: 600;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          margin-top: 32px;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          letter-spacing: 0.02em;
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
          </div>
        </div>

        <div className="mem-body">
          {/* ADD BUTTON */}
          <button className="mem-add-btn" onClick={() => { resetForm(); setShowForm(!showForm) }}>
            <span style={{ fontSize: 18 }}>＋</span>
            إضافة عضو جديد
          </button>

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

          {/* MEMBER CARDS */}
          <div className="mem-cards">
            {sortedMembers.map((member, index) => {
              const rc = getRoleConfig(member.role)
              return (
                <div className="mem-card" key={member.id}>
                  {/* SERIAL — يسار */}
                  <div className="mem-serial-col">
                    <div className="mem-serial">{index + 1}</div>
                  </div>

                  {/* CONTENT — وسط مكدّس */}
                  <div className="mem-card-content">
                    <div className="mem-name">{member.full_name}</div>
                    <div className="mem-divider" />
                    <span
                      className="mem-role-badge"
                      style={{ background: rc.bg, color: rc.color, borderColor: rc.border }}
                    >
                      {member.role}
                    </span>
                    {member.phone
                      ? <span className="mem-phone">{member.phone}</span>
                      : <span className="mem-no-phone">—</span>
                    }
                  </div>

                  {/* ACTIONS — يمين */}
                  <div className="mem-actions-col">
                    <button className="mem-edit-btn" onClick={() => handleEdit(member)} title="تعديل">✎</button>
                    <button className="mem-del-btn" onClick={() => handleDelete(member.id, member.full_name)} title="حذف">✕</button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* STAT */}
          <div className="mem-stat">
            <span className="mem-stat-label">إجمالي الأعضاء الإداريين</span>
            <span className="mem-stat-num">{members.length}</span>
          </div>

          <div className="mem-footer">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</div>
        </div>
      </div>
    </>
  )
}
