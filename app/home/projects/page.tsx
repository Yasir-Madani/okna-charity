'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [togglingVisibility, setTogglingVisibility] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [duplicateError, setDuplicateError] = useState('')
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data: visData } = await supabase
      .from('page_visibility')
      .select('is_visible')
      .eq('page_key', 'projects')
      .single()
    if (visData) setIsVisible(visData.is_visible)

    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setProjects(data)
    setLoading(false)
  }

  const toggleVisibility = async () => {
    setTogglingVisibility(true)
    const newVal = !isVisible
    await supabase
      .from('page_visibility')
      .update({ is_visible: newVal, updated_at: new Date().toISOString() })
      .eq('page_key', 'projects')
    setIsVisible(newVal)
    setTogglingVisibility(false)
  }

  const resetForm = () => {
    setForm({ name: '', description: '' })
    setEditing(null)
    setShowForm(false)
    setDuplicateError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', form.name.trim())
      .neq('id', editing?.id ?? '00000000-0000-0000-0000-000000000000')
      .single()

    if (existing) {
      setDuplicateError(`"${form.name.trim()}" موجود مسبقاً في قائمة المشاريع`)
      return
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      created_by: user.id
    }

    if (editing) {
      await supabase.from('projects').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('projects').insert(payload)
    }

    resetForm()
    fetchData()
  }

  const handleEdit = (project: any) => {
    setForm({ name: project.name, description: project.description || '' })
    setEditing(project)
    setShowForm(true)
    setDuplicateError('')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
    await supabase.from('projects').delete().eq('id', id)
    fetchData()
  }

  // Arabic ordinal numerals
  const arabicNum = (n: number) =>
    n.toLocaleString('ar-EG')

  return (
    <div
      className="min-h-screen bg-gray-50"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div className="bg-indigo-800 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-white/75 hover:text-white transition-colors cursor-pointer"
          >
            ← رجوع
          </button>
          <h1 className="text-base font-semibold tracking-wide">مشاريع الجمعية</h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 relative min-h-[60vh]">

        {/* غطاء الزائر */}
        {!loading && !isAdmin && !isVisible && (
          <div className="absolute inset-0 z-20 flex items-start justify-center pt-6 px-0">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-80 backdrop-blur-sm rounded-2xl" />
            <div className="relative bg-white rounded-2xl border border-gray-100 p-8 text-center w-full shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-2">البيانات قيد الإدخال</h2>
              <p className="text-gray-400 text-sm leading-loose mb-5">
                يتم حالياً إدخال وتدقيق بيانات المشاريع
                <br />
                ستتوفر للعرض بعد اكتمال عملية الإدخال
              </p>
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3 mb-5">
                <p className="text-indigo-600 text-sm text-right flex-1">
                  نعتذر عن عدم توفر البيانات مؤقتاً
                </p>
              </div>
              <button
                onClick={() => router.push('/home')}
                className="w-full bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold cursor-pointer hover:bg-indigo-800 transition-colors"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>
          </div>
        )}

        {/* تحكم الأدمن بالرؤية */}
        {isAdmin && (
          <div className="mb-3 flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">حالة الصفحة للزوار</p>
              <p className={`text-xs mt-0.5 font-medium ${isVisible ? 'text-green-600' : 'text-red-500'}`}>
                {isVisible ? '✅ مرئية للزوار' : '🔒 مخفية — تغطية نشطة'}
              </p>
            </div>
            <button
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                isVisible
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {togglingVisibility ? '...' : isVisible ? '🔒 إخفاء' : '🔓 إظهار'}
            </button>
          </div>
        )}

        {/* زر الإضافة */}
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm) }}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl py-3 text-sm font-semibold mb-4 transition-colors cursor-pointer"
          >
            + إضافة مشروع
          </button>
        )}

        {/* نموذج الإضافة / التعديل */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {editing ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم المشروع *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => { setForm({ ...form, name: e.target.value }); setDuplicateError('') }}
                  placeholder="أدخل اسم المشروع"
                  className={`w-full border rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${duplicateError ? 'border-red-400' : 'border-gray-200'}`}
                />
                {duplicateError && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {duplicateError}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">وصف المشروع</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="اكتب وصفاً موجزاً للمشروع وأهدافه..."
                  className="w-full border border-black-500 rounded-lg p-2.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none leading-relaxed"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-800 transition-colors"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-500 py-2.5 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* تحميل */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-300 text-4xl mb-3">🏗️</p>
            <p className="text-gray-400 text-sm">لا توجد مشاريع مسجلة بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3.5"
              >
                <div className="flex gap-3 items-start">
                  {/* رقم المشروع */}
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
                    <span className="text-indigo-700 font-bold text-sm leading-none">
                      {arabicNum(index + 1)}
                    </span>
                  </div>

                  {/* المحتوى */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black-800 leading-snug">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* أزرار الأدمن */}
                    {isAdmin && (
                      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(project)}
                          className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer transition-colors font-medium"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => handleDelete(project.id, project.name)}
                          className="text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors font-medium"
                        >
                          حذف
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ملخص */}
        {projects.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-900">إجمالي المشاريع</p>
              <p className="text-xs text-gray-900 mt-0.5">
                {arabicNum(projects.length)} مشروع مسجل
              </p>
            </div>
            <p className="text-2xl font-bold text-indigo-700">
              {arabicNum(projects.length)}
            </p>
          </div>
        )}

        <p className="text-center text-black-300 text-xs mt-6">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </div>
    </div>
  )
}