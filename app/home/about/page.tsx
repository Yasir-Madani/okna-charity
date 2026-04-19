'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

export default function AboutPage() {
  const [content, setContent] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  // المحتوى الافتراضي بالتنسيق الذي طلبته (Markdown)
  const defaultAboutContent = `هي جمعية خيرية مقرها في حي العكنة وهو أحد أحياء قرية كلي التي تقع غرب نهر النيل بجمهورية السودان شمال غرب مدينة شندي على بعد 48 كلم تقريبًا من مدينة شندي.

### من أهداف الجمعية:

* **تنظيم البيانات:** بناء قاعدة بيانات دقيقة للأسر.
* **الدعم الصحي:** تأمين الاحتياجات الدوائية والعلاجية للأسر بالتنسيق مع المانحين.
* **إعمار المرافق:** تطوير المنشآت التعليمية والخدمية بروح النفير والعمل الجماعي لأبناء المنطقة.
* **الإصحاح البيئي:** قيادة حملات الوقاية ومكافحة الأوبئة لضمان بيئة صحية وآمنة للقرية.
* **الإشراف المنظم:** توزيع المساعدات والمنح بمهنية عالية.`

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setIsAdmin(true)

    const { data, error } = await supabase
      .from('about_content')
      .select('*')
      .single()

    if (data) {
      setContent(data.content)
      setEditContent(data.content)
    } else {
      // إذا لم يوجد محتوى في القاعدة، نضع المحتوى الافتراضي
      setContent(defaultAboutContent)
      setEditContent(defaultAboutContent)
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

      {/* Header */}
      <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-lg mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="bg-white/15 border border-white/20 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/25 transition-all cursor-pointer"
          >
            رجوع
          </button>
          <h1 className="text-lg font-bold">عن الجمعية</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
          <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-5 py-4 flex items-center gap-3">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-white font-bold text-lg">جمعية نهضة العكنة الخيرية</h2>
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3 text-xs text-blue-700 leading-relaxed">
                  <p className="font-bold mb-1">📝 دليل التنسيق:</p>
                  <p>**نص غامق للأهداف** ← لتبرز باللون الغامق</p>
                  <p>* عنصر قائمة ← سيظهر كدائرة صغيرة</p>
                  <p>### عنوان فرعي</p>
                </div>
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={15}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="اكتب نبذة عن الجمعية هنا..."
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-700 transition-all">
                    {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditContent(content) }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm cursor-pointer hover:bg-gray-200 transition-all">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {content ? (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-loose text-sm
                    [&>h3]:text-blue-700 [&>h3]:font-bold [&>h3]:mb-4 [&>h3]:mt-6
                    [&>p]:mb-4 [&>p]:leading-relaxed
                    [&>ul]:list-disc [&>ul]:pr-6 [&>ul]:mb-4 [&>ul]:space-y-2
                    [&>ul_li]:marker:text-blue-500
                    [&_strong]:font-extrabold [&_strong]:text-blue-900">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">لم يتم إضافة محتوى بعد.</p>
                )}
                
                {isAdmin && (
                  <button onClick={() => setEditing(true)}
                    className="mt-6 w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                    <span>✏️</span> تعديل محتوى الصفحة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Feature Icons */}
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
        <p className="text-gray-400 text-xs">جميع الحقوق محفوظة © جمعية نهضة العكنة الخيرية</p>
      </footer>
    </div>
  )
}