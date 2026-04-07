'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { getAgeCategory } from '../../lib/helpers'
import * as XLSX from 'xlsx'

export default function StatisticsPage() {
  const [individuals, setIndividuals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    sector: '',
    gender: '',
    ageCategory: '',
    hasDisease: '',
    hasDisability: '',
    isWidow: false
  })
  const router = useRouter()

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    fetchAll()
  }

  const fetchAll = async () => {
    const { data } = await supabase
      .from('individuals')
      .select(`
        *,
        individual_diseases(*, diseases(*)),
        individual_disabilities(*, disabilities(*)),
        families(*, houses(*))
      `)
      .order('created_at', { ascending: true })
    if (data) setIndividuals(data)
    setLoading(false)
  }

  const applyFilters = () => {
    return individuals.filter(ind => {
      if (filters.sector && ind.families?.houses?.sector !== filters.sector) return false
      if (filters.gender && ind.gender !== filters.gender) return false
      if (filters.ageCategory && ind.birth_date) {
        if (getAgeCategory(ind.birth_date) !== filters.ageCategory) return false
      } else if (filters.ageCategory && !ind.birth_date) return false
      if (filters.hasDisease === 'yes' && (!ind.individual_diseases || ind.individual_diseases.length === 0)) return false
      if (filters.hasDisease === 'no' && ind.individual_diseases?.length > 0) return false
      if (filters.hasDisability === 'yes' && (!ind.individual_disabilities || ind.individual_disabilities.length === 0)) return false
      if (filters.hasDisability === 'no' && ind.individual_disabilities?.length > 0) return false
      if (filters.isWidow && !ind.notes?.includes('أرملة')) return false
      return true
    })
  }

  const filtered = applyFilters()

  const getAge = (birthDate: string) => {
    if (!birthDate) return '-'
    return new Date().getFullYear() - new Date(birthDate).getFullYear()
  }

  const hasActiveFilters = filters.sector || filters.gender || filters.ageCategory ||
    filters.hasDisease || filters.hasDisability || filters.isWidow

  const exportExcel = () => {
    const rows = filtered.map(ind => ({
      'الاسم': ind.full_name,
      'الجنس': ind.gender,
      'العمر': ind.birth_date ? getAge(ind.birth_date) : '-',
      'الفئة العمرية': ind.birth_date ? getAgeCategory(ind.birth_date) : '-',
      'صلة القرابة': ind.relationship || '-',
      'الأسرة': ind.families?.name || '-',
      'المنزل': ind.families?.houses?.name || '-',
      'المحور': ind.families?.houses?.sector || '-',
      'الأمراض': ind.individual_diseases?.map((d: any) => d.diseases?.name || d.custom_disease).join('، ') || '-',
      'الأدوية': ind.individual_diseases?.map((d: any) => d.medication).filter(Boolean).join('، ') || '-',
      'الإعاقات': ind.individual_disabilities?.map((d: any) => d.disabilities?.type || d.custom_disability).join('، ') || '-',
      'الرقم الوطني': ind.national_id || '-',
      'رقم الحساب': ind.bank_account || '-',
      'ملاحظات': ind.notes || '-'
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'البيانات')
    XLSX.writeFile(wb, 'إحصاء_جمعية_العكنة.xlsx')
  }

  const exportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>إحصاء_جمعية_العكنة</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; font-size: 12px; }
          h2 { color: #166534; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #166534; color: white; padding: 8px; text-align: right; font-size: 11px; }
          td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 11px; }
          tr:nth-child(even) td { background-color: #f9fafb; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin: 1px; }
          .disease { background: #fee2e2; color: #991b1b; }
          .disability { background: #ffedd5; color: #9a3412; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h2>إحصاء جمعية العكنة الخيرية</h2>
        <p>إجمالي النتائج: ${filtered.length} فرد</p>
        <table>
          <thead>
            <tr>
              <th>الاسم</th><th>الجنس</th><th>العمر</th><th>الفئة</th>
              <th>الأسرة</th><th>المنزل</th><th>المحور</th>
              <th>الأمراض</th><th>الإعاقات</th><th>الرقم الوطني</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(ind => `
              <tr>
                <td>${ind.full_name}</td>
                <td>${ind.gender}</td>
                <td>${ind.birth_date ? getAge(ind.birth_date) : '-'}</td>
                <td>${ind.birth_date ? getAgeCategory(ind.birth_date) : '-'}</td>
                <td>${ind.families?.name || '-'}</td>
                <td>${ind.families?.houses?.name || '-'}</td>
                <td>${ind.families?.houses?.sector || '-'}</td>
                <td>${ind.individual_diseases?.map((d: any) =>
                  `<span class="badge disease">${d.diseases?.name || d.custom_disease}</span>`
                ).join('') || '-'}</td>
                <td>${ind.individual_disabilities?.map((d: any) =>
                  `<span class="badge disability">${d.disabilities?.type || d.custom_disability}</span>`
                ).join('') || '-'}</td>
                <td>${ind.national_id || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const resetFilters = () => {
    setFilters({ sector: '', gender: '', ageCategory: '', hasDisease: '', hasDisability: '', isWidow: false })
  }

  const ageCounts = {
    رضيع: individuals.filter(i => i.birth_date && getAgeCategory(i.birth_date) === 'رضيع').length,
    طفل: individuals.filter(i => i.birth_date && getAgeCategory(i.birth_date) === 'طفل').length,
    شاب: individuals.filter(i => i.birth_date && getAgeCategory(i.birth_date) === 'شاب').length,
    بالغ: individuals.filter(i => i.birth_date && getAgeCategory(i.birth_date) === 'بالغ').length,
    مسن: individuals.filter(i => i.birth_date && getAgeCategory(i.birth_date) === 'مسن').length,
  }

  const widowCount = individuals.filter(i => i.notes?.includes('أرملة')).length

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ===== شريط العنوان ===== */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <h1 className="text-base font-bold">الإحصائيات</h1>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
          >
            PDF
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer"
          >
            رجوع
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* ===== بطاقات الفئات العمرية - قابلة للضغط كفلتر ===== */}
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ageCounts).map(([cat, count]) => (
            <div
              key={cat}
              onClick={() => setFilters(f => ({ ...f, ageCategory: f.ageCategory === cat ? '' : cat }))}
              className={`bg-white rounded-xl border-2 p-3 text-center cursor-pointer transition-all shadow-sm
                ${filters.ageCategory === cat ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <p className="text-2xl font-bold text-green-600">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{cat}</p>
            </div>
          ))}
          <div
            onClick={() => setFilters(f => ({ ...f, isWidow: !f.isWidow }))}
            className={`bg-white rounded-xl border-2 p-3 text-center cursor-pointer transition-all shadow-sm
              ${filters.isWidow ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
          >
            <p className="text-2xl font-bold text-green-600">{widowCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">أرامل</p>
          </div>
        </div>

        {/* ===== شريط الفلاتر قابل للطي ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-3 flex justify-between items-center cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">الفلاتر</span>
              {hasActiveFilters && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  مفعّل
                </span>
              )}
            </div>
            <span className="text-gray-400 text-sm">{showFilters ? '▲' : '▼'}</span>
          </button>

          {showFilters && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">المحور</label>
                  <select
                    value={filters.sector}
                    onChange={e => setFilters({ ...filters, sector: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">الكل</option>
                    <option value="شرق">شرق</option>
                    <option value="شمال">شمال</option>
                    <option value="وسط">وسط</option>
                    <option value="الدوراشاب">الدوراشاب</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الجنس</label>
                  <select
                    value={filters.gender}
                    onChange={e => setFilters({ ...filters, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">الكل</option>
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الأمراض</label>
                  <select
                    value={filters.hasDisease}
                    onChange={e => setFilters({ ...filters, hasDisease: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">الكل</option>
                    <option value="yes">مريض</option>
                    <option value="no">سليم</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الإعاقة</label>
                  <select
                    value={filters.hasDisability}
                    onChange={e => setFilters({ ...filters, hasDisability: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">الكل</option>
                    <option value="yes">معاق</option>
                    <option value="no">غير معاق</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="w-full text-xs text-red-500 border border-red-200 bg-red-50 py-2 rounded-xl cursor-pointer mt-1"
                >
                  مسح كل الفلاتر
                </button>
              )}
            </div>
          )}
        </div>

        {/* ===== عداد النتائج ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-500">النتائج</span>
          <div>
            <span className="text-xl font-bold text-green-600">{filtered.length}</span>
            <span className="text-xs text-gray-400 mr-1">من {individuals.length} فرد</span>
          </div>
        </div>

        {/* ===== قائمة الأفراد - بطاقات ===== */}
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-10">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">لا توجد نتائج</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(ind => (
              <div key={ind.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* رأس البطاقة */}
                <div className="px-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{ind.full_name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ind.gender && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {ind.gender}
                          </span>
                        )}
                        {ind.birth_date && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {getAgeCategory(ind.birth_date)} · {getAge(ind.birth_date)} سنة
                          </span>
                        )}
                        {ind.relationship && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {ind.relationship}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* المحور */}
                    {ind.families?.houses?.sector && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {ind.families.houses.sector}
                      </span>
                    )}
                  </div>

                  {/* الأسرة والمنزل */}
                  <p className="text-xs text-gray-400 mt-1.5">
                    {ind.families?.name && `أسرة ${ind.families.name}`}
                    {ind.families?.houses?.name && ` · منزل ${ind.families.houses.name}`}
                  </p>
                </div>

                {/* الأمراض والإعاقات */}
                {(ind.individual_diseases?.length > 0 || ind.individual_disabilities?.length > 0) && (
                  <div className="px-4 pb-3 border-t border-gray-100 pt-2 space-y-1.5">
                    {ind.individual_diseases?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ind.individual_diseases.map((d: any) => (
                          <span key={d.id} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                            {d.diseases?.name || d.custom_disease}
                            {d.medication ? ` · ${d.medication}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {ind.individual_disabilities?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {ind.individual_disabilities.map((d: any) => (
                          <span key={d.id} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                            {d.disabilities?.type || d.custom_disability}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
