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
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsAdmin(!!user)

    const { data } = await supabase
      .from('news')
      .select('*')
      .order('news_date', { ascending: false })

    if (data) setNews(data)
    setLoading(false)
  }

  const resetForm = () => {
    setForm({
      title: '',
      content: '',
      news_date: new Date().toISOString().split('T')[0]
    })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('news')
      .select('id')
      .ilike('title', form.title.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.title.trim()}" موجود مسبقاً`)
      return
    }

    const payload = {
      title: form.title.trim(),
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
    setDuplicateError('')
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

      {/* Header */}
      <div className="bg-gradient-to-l from-teal-900 via-teal-800 to-teal-600 text-white">
        <div className="max-w-xl md:max-w-2xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="bg-white bg-opacity-20 text-black px-3 py-1.5 rounded-lg text-sm hover:bg-opacity-30 transition"
          >
            رجوع
          </button>

          <h1 className="text-lg font-bold">أخبار الجمعية</h1>

          <div className="w-16"></div>
        </div>
      </div>

      {/* 🔥 شريط الأخبار المتحرك */}
      {news.length > 0 && (
        <div className="bg-black text-white overflow-hidden">
          <div className="flex w-max animate-marquee py-2 text-sm">
            {[...news, ...news].map((item, index) => (
              <span key={index} className="mx-8 whitespace-nowrap">
                📰 {item.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-xl md:max-w-2xl mx-auto px-4 py-6">

        {isAdmin && (
          <>
            <p className="text-gray-400 text-sm mb-4 text-center">
              يمكنك مشاهدة الأخبار فقط — سجل الدخول لإضافة أو تعديل الأخبار
            </p>

            <button
              onClick={() => { resetForm(); setShowForm(!showForm) }}
              className="w-full bg-gradient-to-l from-teal-700 to-teal-600 text-white rounded-2xl p-4 font-bold mb-4 shadow-lg hover:scale-[1.01] transition"
            >
              + إضافة خبر جديد
            </button>
          </>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">
              {editing ? 'تعديل الخبر' : 'إضافة خبر جديد'}
            </h3>

            <form onSubmit={handleSubmit}>
              <input
                required
                value={form.title}
                onChange={e => {
                  setForm({ ...form, title: e.target.value })
                  setDuplicateError('')
                }}
                placeholder="عنوان الخبر"
                className="w-full border rounded-xl p-3 mb-3"
              />

              {duplicateError && (
                <p className="text-red-500 text-xs mb-2">⚠️ {duplicateError}</p>
              )}

              <input
                type="date"
                required
                value={form.news_date}
                onChange={e => setForm({ ...form, news_date: e.target.value })}
                className="w-full border rounded-xl p-3 mb-3"
              />

              <textarea
                required
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={4}
                placeholder="تفاصيل الخبر"
                className="w-full border rounded-xl p-3 mb-4"
              />

              <div className="flex gap-2">
                <button className="flex-1 bg-teal-600 text-white py-2 rounded-xl">
                  نشر
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 bg-gray-200 py-2 rounded-xl">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* الأخبار */}
        <div className="space-y-4">
          {news.map((item, i) => {
            const color = newsColors[i % newsColors.length]

            return (
              <div key={item.id}
                className={`bg-white rounded-2xl shadow border ${color.border}`}>

                <div className={`${color.bg} text-white p-3 flex justify-between`}>
                  <span>{item.title}</span>

                  {isAdmin && (
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => handleEdit(item)}>تعديل</button>
                      <button onClick={() => handleDelete(item.id, item.title)}>حذف</button>
                    </div>
                  )}
                </div>

                <div className={`${color.light} p-3`}>
                  <p className="text-xs text-gray-400 mb-2">
                    📅 {formatDate(item.news_date)}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                </div>

              </div>
            )
          })}
        </div>
      </div>

      {/* 🔥 الأنيميشن */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>

    </div>
  )
}