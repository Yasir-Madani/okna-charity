'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { getAgeCategory } from '../../lib/helpers'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function StatisticsPage() {
  const [individuals, setIndividuals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
        p { color: #555; }
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
            <th>الاسم</th>
            <th>الجنس</th>
            <th>العمر</th>
            <th>الفئة</th>
            <th>صلة القرابة</th>
            <th>الأسرة</th>
            <th>المنزل</th>
            <th>المحور</th>
            <th>الأمراض</th>
            <th>الإعاقات</th>
            <th>الرقم الوطني</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(ind => `
            <tr>
              <td>${ind.full_name}</td>
              <td>${ind.gender}</td>
              <td>${ind.birth_date ? getAge(ind.birth_date) : '-'}</td>
              <td>${ind.birth_date ? getAgeCategory(ind.birth_date) : '-'}</td>
              <td>${ind.relationship || '-'}</td>
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
              <td>${ind.notes || '-'}</td>
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

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">الإحصائيات والفلاتر</h1>
        <div className="flex gap-2">
          <button onClick={exportExcel}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-bold cursor-pointer">
            Excel
          </button>
          <button onClick={exportPDF}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-bold cursor-pointer">
            PDF
          </button>
          <button onClick={() => router.push('/dashboard')}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm cursor-pointer">
            رجوع
          </button>
        </div>
      </div>

      <div className="p-4 max-w-6xl mx-auto">

        <div className="grid grid-cols-3 gap-3 mb-4 sm:grid-cols-6">
          {Object.entries(ageCounts).map(([cat, count]) => (
            <div key={cat}
              onClick={() => setFilters({ ...filters, ageCategory: filters.ageCategory === cat ? '' : cat })}
              className={`bg-white p-3 rounded-lg shadow text-center cursor-pointer border-2 transition-all ${filters.ageCategory === cat ? 'border-green-500' : 'border-transparent'}`}>
              <p className="text-xl font-bold text-green-600">{count}</p>
              <p className="text-gray-600 text-xs">{cat}</p>
            </div>
          ))}
          <div
            onClick={() => setFilters({ ...filters, isWidow: !filters.isWidow })}
            className={`bg-white p-3 rounded-lg shadow text-center cursor-pointer border-2 transition-all ${filters.isWidow ? 'border-green-500' : 'border-transparent'}`}>
            <p className="text-xl font-bold text-green-600">
              {individuals.filter(i => i.notes?.includes('أرملة')).length}
            </p>
            <p className="text-gray-600 text-xs">أرامل</p>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow mb-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <div>
              <label className="text-xs text-gray-500 block mb-1">المحور</label>
              <select value={filters.sector}
                onChange={e => setFilters({ ...filters, sector: e.target.value })}
                className="border rounded p-2 text-right text-sm w-full h-10">
                <option value="">الكل</option>
                <option value="شرق">شرق</option>
                <option value="شمال">شمال</option>
                <option value="وسط">وسط</option>
                <option value="الدوراشاب">الدوراشاب</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">الجنس</label>
              <select value={filters.gender}
                onChange={e => setFilters({ ...filters, gender: e.target.value })}
                className="border rounded p-2 text-right text-sm w-full h-10">
                <option value="">الكل</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">الفئة العمرية</label>
              <select value={filters.ageCategory}
                onChange={e => setFilters({ ...filters, ageCategory: e.target.value })}
                className="border rounded p-2 text-right text-sm w-full h-10">
                <option value="">الكل</option>
                <option value="رضيع">رضيع</option>
                <option value="طفل">طفل</option>
                <option value="شاب">شاب</option>
                <option value="بالغ">بالغ</option>
                <option value="مسن">مسن</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">الأمراض</label>
              <select value={filters.hasDisease}
                onChange={e => setFilters({ ...filters, hasDisease: e.target.value })}
                className="border rounded p-2 text-right text-sm w-full h-10">
                <option value="">الكل</option>
                <option value="yes">مريض</option>
                <option value="no">سليم</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">الإعاقة</label>
              <select value={filters.hasDisability}
                onChange={e => setFilters({ ...filters, hasDisability: e.target.value })}
                className="border rounded p-2 text-right text-sm w-full h-10">
                <option value="">الكل</option>
                <option value="yes">معاق</option>
                <option value="no">غير معاق</option>
              </select>
            </div>
          </div>
          <button onClick={resetFilters}
            className="mt-2 text-xs text-blue-600 underline cursor-pointer">
            مسح الفلاتر
          </button>
        </div>

        <div className="bg-white p-3 rounded-lg shadow mb-4 text-center">
          <span className="text-gray-600 text-sm">النتائج: </span>
          <span className="font-bold text-green-600 text-lg">{filtered.length}</span>
          <span className="text-gray-600 text-sm"> من إجمالي {individuals.length} فرد</span>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">جاري التحميل...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">لا توجد نتائج</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-right">الاسم</th>
                  <th className="p-3 text-right">الجنس</th>
                  <th className="p-3 text-right">العمر</th>
                  <th className="p-3 text-right">الفئة</th>
                  <th className="p-3 text-right">الأسرة</th>
                  <th className="p-3 text-right">المنزل</th>
                  <th className="p-3 text-right">المحور</th>
                  <th className="p-3 text-right">الأمراض</th>
                  <th className="p-3 text-right">الإعاقات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ind => (
                  <tr key={ind.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-bold">{ind.full_name}</td>
                    <td className="p-3">{ind.gender}</td>
                    <td className="p-3">{ind.birth_date ? getAge(ind.birth_date) : '-'}</td>
                    <td className="p-3">
                      {ind.birth_date ? (
                        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                          {getAgeCategory(ind.birth_date)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3">{ind.families?.name || '-'}</td>
                    <td className="p-3">{ind.families?.houses?.name || '-'}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                        {ind.families?.houses?.sector || '-'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {ind.individual_diseases?.map((d: any) => (
                          <span key={d.id} className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-xs">
                            {d.diseases?.name || d.custom_disease}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {ind.individual_disabilities?.map((d: any) => (
                          <span key={d.id} className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-xs">
                            {d.disabilities?.type || d.custom_disability}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
