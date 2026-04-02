'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const [content, setContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data } = await supabase
      .from('about_content')
      .select('*')
      .single()

    if (data) {
      setContent(data.content)
      setEditContent(data.content)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: existing } = await supabase.from('about_content').select('id').single()
    if (existing) {
      await supabase.from('about_content').update({
        content: editContent,
        updated_at: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('about_content').insert({ content: editContent })
    }
    setContent(editContent)
    setEditing(false)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            → رجوع
          </button>
          <h1 className="text-lg font-bold">عن الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-white font-bold text-lg">جمعية العكنة الخيرية</h2>
              <p className="text-blue-200 text-xs">نبذة تعريفية</p>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : editing ? (
              <div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="اكتب نبذة عن الجمعية هنا..."
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-700 transition-all">
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditContent(content) }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-all">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 leading-loose text-sm whitespace-pre-wrap">
                  {content || 'لم يتم إضافة محتوى بعد.'}
                </p>
                {isAdmin && (
                  <button onClick={() => setEditing(true)}
                    className="mt-4 w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-50 transition-all">
                    تعديل المحتوى
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🤝', label: 'تطوعية' },
            { icon: '💙', label: 'خيرية' },
            { icon: '🌱', label: 'تنموية' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <span className="text-3xl block mb-1">{item.icon}</span>
              <p className="text-gray-600 text-xs font-bold">{item.label}</p>
            </div>
          ))}
        </div>

      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}