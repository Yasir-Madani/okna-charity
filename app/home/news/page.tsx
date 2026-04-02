'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({
    title: '',
    content: '',
    news_date: new Date().toISOString().split('T')[0]
  })
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('news_date', { ascending: false })
    if (data) setNews(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ title: '', content: '', news_date: new Date().toISOString().split('T')[0] })
    setEditing(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const payload = {
      title: form.title,
      content: form.content,
      news_date: form.news_date,
      created_by: user.id
    }
    if (editing) {
      await supabase.from('news').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('news').insert(payload)
    }
    resetForm()
    fetchData()
  }

  const handleEdit = (item: any) => {
    setForm({
      title: item.title,
      content: item.content,
      news_date: item.news_date
    })
    setEditing(item)
    setShowForm(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return
    await supabase.from('news').delete().eq('id', id)
    fetchData()
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const newsColors = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-100' },
    { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-100' },
    { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-100' },
    { bg: 'bg-green-500', light: 'bg-green-50', border: 'border-green-100' },
    { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-100' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100" dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-600 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:bg-opacity-30 transition-all">
            → رجوع
          </button>
          <h1 className="text-lg font-bold">أخبار الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-gradient-to-l from-teal-700 to-teal-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-bold mb-4 shadow-lg shadow-teal-200 cursor-pointer hover:scale-[1.01] transition-all">
            + إضافة خبر جديد
          </button>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">{editing ? 'تعديل الخبر' : 'إضافة خبر جديد'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">عنوان الخبر *</label>
                <input required value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="اكتب عنوان الخبر..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div className="mb-3">
                <label className="text-sm text-gray-600 block mb-1">تاريخ الخبر *</label>
                <input type="date" required value={form.news_date}
                  onChange={e => setForm({ ...form, news_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-600 block mb-1">تفاصيل الخبر *</label>
                <textarea required value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  placeholder="اكتب تفاصيل الخبر هنا..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-right text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-300" />
              </div>
              <div className="flex gap-2">
                <button type="submit"
                  className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl font-bold text-sm cursor-pointer hover:bg-teal-700 transition-all">
                  نشر الخبر
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-all">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">📰</span>
            <p className="text-gray-400">لا توجد أخبار بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item, i) => {
              const color = newsColors[i % newsColors.length]
              return (
                <div key={item.id}
                  className={`bg-white rounded-2xl shadow-sm border ${color.border} overflow-hidden`}>
                  <div className={`${color.bg} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-lg">📰</span>
                      <p className="text-white font-bold text-sm">{item.title}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(item)}
                          className="text-white text-xs underline opacity-80 cursor-pointer hover:opacity-100">
                          تعديل
                        </button>
                        <button onClick={() => handleDelete(item.id, item.title)}
                          className="text-white text-xs underline opacity-80 cursor-pointer hover:opacity-100">
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={`${color.light} px-4 py-3`}>
                    <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
                      <span>📅</span> {formatDate(item.news_date)}
                    </p>
                    <p className="text-gray-700 text-sm leading-loose whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className="text-center py-6 mt-4">
        <p className="text-gray-400 text-xs">© 2026 جمعية العكنة الخيرية</p>
      </footer>
    </div>
  )
}
