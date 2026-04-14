'use client'
import { useState, useRef } from 'react'
import { supabase } from '../.././lib/supabase'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

// ضع هذا في: app/dashboard/import/page.tsx
// تأكد من تثبيت: npm install xlsx

type ImportRow = {
  house_number: string
  house_name: string
  sector: string
  house_notes: string
  family_name: string
  full_name: string
  gender: string
  birth_date: string
  relationship: string
  national_id: string
  bank_account: string
  diseases: string
  medications: string
  disabilities: string
  notes: string
}

type ValidationError = { row: number; sheet: string; message: string }
type ImportResult = { success: number; failed: number; errors: ValidationError[] }

const VALID_SECTORS = ['شرق', 'شمال', 'وسط', 'الدوراشاب']
const VALID_GENDERS = ['ذكر', 'أنثى']

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ houses: any[]; families: any[]; individuals: any[] } | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [progress, setProgress] = useState({ current: 0, total: 0, label: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const parseExcel = (file: File) => {
    return new Promise<{ houses: any[]; families: any[]; individuals: any[] }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb = XLSX.read(data, { type: 'array' })

          const housesSheet = wb.Sheets['المنازل']
          const familiesSheet = wb.Sheets['الأسر']
          const individualsSheet = wb.Sheets['الأفراد']

          if (!housesSheet || !familiesSheet || !individualsSheet) {
            reject(new Error('الملف لا يحتوي على الأوراق المطلوبة: المنازل، الأسر، الأفراد'))
            return
          }

          const houses = XLSX.utils.sheet_to_json(housesSheet, { defval: '' })
          const families = XLSX.utils.sheet_to_json(familiesSheet, { defval: '' })
          const individuals = XLSX.utils.sheet_to_json(individualsSheet, { defval: '' })

          resolve({ houses, families, individuals })
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const validate = (data: { houses: any[]; families: any[]; individuals: any[] }): ValidationError[] => {
    const errors: ValidationError[] = []

    // تحقق من المنازل
    data.houses.forEach((row, i) => {
      const rowNum = i + 2
      if (!row['رقم المنزل'] && row['رقم المنزل'] !== 0)
        errors.push({ sheet: 'المنازل', row: rowNum, message: 'رقم المنزل مطلوب' })
      if (!row['اسم المنزل'])
        errors.push({ sheet: 'المنازل', row: rowNum, message: 'اسم المنزل مطلوب' })
      if (!VALID_SECTORS.includes(row['المحور']))
        errors.push({ sheet: 'المنازل', row: rowNum, message: `المحور "${row['المحور']}" غير صحيح` })
    })

    // تحقق من الأسر
    const houseKeys = new Set(data.houses.map(h => `${h['رقم المنزل']}_${h['المحور']}`))
    data.families.forEach((row, i) => {
      const rowNum = i + 2
      if (!row['اسم الأسرة'])
        errors.push({ sheet: 'الأسر', row: rowNum, message: 'اسم الأسرة مطلوب' })
      const key = `${row['رقم المنزل']}_${row['محور المنزل']}`
      if (!houseKeys.has(key))
        errors.push({ sheet: 'الأسر', row: rowNum, message: `المنزل رقم "${row['رقم المنزل']}" في محور "${row['محور المنزل']}" غير موجود في ورقة المنازل` })
    })

    // تحقق من الأفراد
    const familyKeys = new Set(data.families.map(f => `${f['رقم المنزل']}_${f['محور المنزل']}_${f['اسم الأسرة']}`))
    data.individuals.forEach((row, i) => {
      const rowNum = i + 2
      if (!row['الاسم الكامل'])
        errors.push({ sheet: 'الأفراد', row: rowNum, message: 'الاسم الكامل مطلوب' })
      if (!VALID_GENDERS.includes(row['الجنس']))
        errors.push({ sheet: 'الأفراد', row: rowNum, message: `الجنس "${row['الجنس']}" غير صحيح (ذكر أو أنثى)` })
      const key = `${row['رقم المنزل']}_${row['محور المنزل']}_${row['اسم الأسرة']}`
      if (!familyKeys.has(key))
        errors.push({ sheet: 'الأفراد', row: rowNum, message: `الأسرة "${row['اسم الأسرة']}" غير موجودة في ورقة الأسر` })
      if (row['تاريخ الميلاد (YYYY-MM-DD)'] && !/^\d{4}-\d{2}-\d{2}$/.test(String(row['تاريخ الميلاد (YYYY-MM-DD)']).trim())) {
        errors.push({ sheet: 'الأفراد', row: rowNum, message: `تاريخ الميلاد غير صحيح - يجب أن يكون YYYY-MM-DD` })
      }
    })

    return errors
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setValidationErrors([])

    try {
      const data = await parseExcel(f)
      const errors = validate(data)
      setPreview(data)
      setValidationErrors(errors)
      setStep('preview')
    } catch (err: any) {
      alert(err.message || 'خطأ في قراءة الملف')
    }
  }

  const handleImport = async () => {
    if (!preview || validationErrors.length > 0) return
    setImporting(true)
    setStep('done')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const errors: ValidationError[] = []
    let success = 0

    // خريطة: key -> house_id
    const houseMap = new Map<string, string>()
    // خريطة: key -> family_id
    const familyMap = new Map<string, string>()

    const totalOps = preview.houses.length + preview.families.length + preview.individuals.length
    setProgress({ current: 0, total: totalOps, label: 'جاري رفع المنازل...' })

    // ===== 1. رفع المنازل =====
    for (let i = 0; i < preview.houses.length; i++) {
      const row = preview.houses[i]
      setProgress(p => ({ ...p, current: i + 1, label: `رفع المنازل... (${i + 1}/${preview.houses.length})` }))

      const house_number = String(row['رقم المنزل']).trim()
      const name = String(row['اسم المنزل']).trim()
      const sector = String(row['المحور']).trim()
      const notes = row['ملاحظات'] ? String(row['ملاحظات']).trim() : null

      // تحقق من وجود مسبق
      const { data: existing } = await supabase
        .from('houses').select('id')
        .eq('house_number', house_number).eq('sector', sector).maybeSingle()

      if (existing) {
        houseMap.set(`${house_number}_${sector}`, existing.id)
        success++
        continue
      }

      const { data: inserted, error } = await supabase.from('houses')
        .insert({ house_number, name, sector, notes, created_by: user.id })
        .select('id').single()

      if (error || !inserted) {
        errors.push({ sheet: 'المنازل', row: i + 2, message: error?.message || 'خطأ في الإدراج' })
      } else {
        houseMap.set(`${house_number}_${sector}`, inserted.id)
        success++
      }
    }

    // ===== 2. رفع الأسر =====
    setProgress(p => ({ ...p, label: 'جاري رفع الأسر...' }))
    for (let i = 0; i < preview.families.length; i++) {
      const row = preview.families[i]
      const offset = preview.houses.length
      setProgress(p => ({ ...p, current: offset + i + 1, label: `رفع الأسر... (${i + 1}/${preview.families.length})` }))

      const house_number = String(row['رقم المنزل']).trim()
      const sector = String(row['محور المنزل']).trim()
      const family_name = String(row['اسم الأسرة']).trim()
      const house_id = houseMap.get(`${house_number}_${sector}`)

      if (!house_id) {
        errors.push({ sheet: 'الأسر', row: i + 2, message: 'المنزل المرجعي غير موجود' })
        continue
      }

      // تحقق من وجود مسبق
      const { data: existing } = await supabase
        .from('families').select('id')
        .eq('house_id', house_id).eq('name', family_name).maybeSingle()

      if (existing) {
        familyMap.set(`${house_number}_${sector}_${family_name}`, existing.id)
        success++
        continue
      }

      const { data: inserted, error } = await supabase.from('families')
        .insert({ house_id, name: family_name, created_by: user.id })
        .select('id').single()

      if (error || !inserted) {
        errors.push({ sheet: 'الأسر', row: i + 2, message: error?.message || 'خطأ في الإدراج' })
      } else {
        familyMap.set(`${house_number}_${sector}_${family_name}`, inserted.id)
        success++
      }
    }

    // ===== 3. رفع الأفراد =====
    setProgress(p => ({ ...p, label: 'جاري رفع الأفراد...' }))
    for (let i = 0; i < preview.individuals.length; i++) {
      const row = preview.individuals[i]
      const offset = preview.houses.length + preview.families.length
      setProgress(p => ({ ...p, current: offset + i + 1, label: `رفع الأفراد... (${i + 1}/${preview.individuals.length})` }))

      const house_number = String(row['رقم المنزل']).trim()
      const sector = String(row['محور المنزل']).trim()
      const family_name = String(row['اسم الأسرة']).trim()
      const family_id = familyMap.get(`${house_number}_${sector}_${family_name}`)

      if (!family_id) {
        errors.push({ sheet: 'الأفراد', row: i + 2, message: 'الأسرة المرجعية غير موجودة' })
        continue
      }

      const full_name = String(row['الاسم الكامل']).trim()
      const gender = String(row['الجنس']).trim()
      const birth_date_raw = row['تاريخ الميلاد (YYYY-MM-DD)'] ? String(row['تاريخ الميلاد (YYYY-MM-DD)']).trim() : null
      const birth_date = birth_date_raw && /^\d{4}-\d{2}-\d{2}$/.test(birth_date_raw) ? birth_date_raw : null
      const relationship = row['صلة القرابة'] ? String(row['صلة القرابة']).trim() : null
      const national_id = row['الرقم الوطني'] ? String(row['الرقم الوطني']).trim() : null
      const bank_account = row['رقم الحساب البنكي'] ? String(row['رقم الحساب البنكي']).trim() : null
      const notes = row['ملاحظات'] ? String(row['ملاحظات']).trim() : null

      // تحقق من وجود مسبق
      const { data: existingInd } = await supabase
        .from('individuals').select('id')
        .eq('family_id', family_id).eq('full_name', full_name).maybeSingle()

      let ind_id = existingInd?.id

      if (!existingInd) {
        const { data: inserted, error } = await supabase.from('individuals')
          .insert({ family_id, full_name, gender, birth_date, relationship, national_id, bank_account, notes, created_by: user.id })
          .select('id').single()

        if (error || !inserted) {
          errors.push({ sheet: 'الأفراد', row: i + 2, message: error?.message || 'خطأ في الإدراج' })
          continue
        }
        ind_id = inserted.id
      }

      // الأمراض
      const diseasesRaw = row['الأمراض (فاصلة بين كل مرض)'] ? String(row['الأمراض (فاصلة بين كل مرض)']).trim() : ''
      const medicationsRaw = row['الأدوية (بنفس ترتيب الأمراض)'] ? String(row['الأدوية (بنفس ترتيب الأمراض)']).trim() : ''
      const diseaseNames = diseasesRaw ? diseasesRaw.split(',').map(d => d.trim()).filter(Boolean) : []
      const medications = medicationsRaw ? medicationsRaw.split(',').map(m => m.trim()) : []

      if (diseaseNames.length > 0 && !existingInd) {
        for (let di = 0; di < diseaseNames.length; di++) {
          const dName = diseaseNames[di]
          const medication = medications[di] || null

          // ابحث عن المرض أو أنشئه
          let { data: disease } = await supabase.from('diseases').select('id').eq('name', dName).maybeSingle()
          if (!disease) {
            const { data: newD } = await supabase.from('diseases').insert({ name: dName }).select('id').single()
            disease = newD
          }
          if (disease) {
            await supabase.from('individual_diseases').insert({
              individual_id: ind_id,
              disease_id: disease.id,
              medication: medication || null
            })
          }
        }
      }

      // الإعاقات
      const disabilitiesRaw = row['الإعاقات'] ? String(row['الإعاقات']).trim() : ''
      const disabilityNames = disabilitiesRaw ? disabilitiesRaw.split(',').map(d => d.trim()).filter(Boolean) : []
      const standardTypes = ['بصرية', 'سمعية', 'حركية', 'عقلية']

      if (disabilityNames.length > 0 && !existingInd) {
        for (const dtype of disabilityNames) {
          if (standardTypes.includes(dtype)) {
            const { data: dis } = await supabase.from('disabilities').select('id').eq('type', dtype).maybeSingle()
            if (dis) {
              await supabase.from('individual_disabilities').insert({
                individual_id: ind_id,
                disability_id: dis.id
              })
            }
          } else {
            await supabase.from('individual_disabilities').insert({
              individual_id: ind_id,
              disability_id: null,
              custom_disability: dtype
            })
          }
        }
      }

      success++
    }

    setResult({ success, failed: errors.length, errors })
    setImporting(false)
    setProgress({ current: 0, total: 0, label: '' })
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setValidationErrors([])
    setResult(null)
    setStep('upload')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* شريط العنوان */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div>
          <p className="text-xs text-green-200">الاستيراد الجماعي</p>
          <h1 className="text-sm font-bold">رفع البيانات من Excel</h1>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 space-y-4">

        {/* ===== خطوة 1: رفع الملف ===== */}
        {step === 'upload' && (
          <>
            {/* بطاقة تحميل القالب */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">الخطوة الأولى: تحميل القالب</h2>
              <p className="text-xs text-gray-500 mb-4">
                حمّل ملف Excel الجاهز، عبّئ بياناتك فيه، ثم ارفعه.
              </p>
              <a
                href="/import_template.xlsx"
                download
                className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              >
                ⬇️ تحميل قالب Excel
              </a>
              <p className="text-xs text-gray-400 mt-3">
                القالب يحتوي على 3 أوراق: المنازل، الأسر، الأفراد — مع أمثلة توضيحية وتعليمات
              </p>
            </div>

            {/* بطاقة رفع الملف */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-800 mb-1">الخطوة الثانية: رفع الملف</h2>
              <p className="text-xs text-gray-500 mb-4">بعد تعبئة القالب، ارفعه هنا للمراجعة قبل الحفظ.</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-green-300 rounded-xl p-8 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                <span className="text-4xl mb-2">📂</span>
                <span className="text-sm font-bold text-green-700">اختر ملف Excel</span>
                <span className="text-xs text-gray-400 mt-1">.xlsx أو .xls</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </>
        )}

        {/* ===== خطوة 2: معاينة وتحقق ===== */}
        {step === 'preview' && preview && (
          <>
            {/* ملخص الأرقام */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'منزل', count: preview.houses.length, color: 'green' },
                { label: 'أسرة', count: preview.families.length, color: 'blue' },
                { label: 'فرد', count: preview.individuals.length, color: 'purple' },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
                  <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* أخطاء التحقق */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="font-bold text-red-700 mb-2">⚠️ يوجد {validationErrors.length} خطأ يجب تصحيحه:</p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="bg-white border border-red-100 rounded-lg px-3 py-2 text-xs text-red-700">
                      <span className="font-bold">[{err.sheet} - صف {err.row}]</span> {err.message}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-500 mt-3">يرجى تصحيح الأخطاء في ملف Excel وإعادة رفعه.</p>
              </div>
            )}

            {/* معاينة المنازل */}
            {preview.houses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between">
                  <h3 className="font-bold text-gray-700 text-sm">معاينة المنازل</h3>
                  <span className="text-xs text-gray-400">{preview.houses.length} منزل</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">الرقم</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">الاسم</th>
                        <th className="px-3 py-2 text-right text-gray-500 font-medium">المحور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.houses.slice(0, 5).map((h, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">{h['رقم المنزل']}</td>
                          <td className="px-3 py-2">{h['اسم المنزل']}</td>
                          <td className="px-3 py-2">{h['المحور']}</td>
                        </tr>
                      ))}
                      {preview.houses.length > 5 && (
                        <tr className="border-t border-gray-100 bg-gray-50">
                          <td colSpan={3} className="px-3 py-2 text-center text-gray-400">
                            + {preview.houses.length - 5} منازل أخرى
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* أزرار */}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                className="flex-1 bg-green-700 text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {validationErrors.length > 0 ? '❌ صحح الأخطاء أولاً' : '✅ بدء الرفع إلى قاعدة البيانات'}
              </button>
              <button
                onClick={reset}
                className="bg-gray-100 text-gray-600 px-4 py-3.5 rounded-xl text-sm cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </>
        )}

        {/* ===== خطوة 3: الرفع والنتيجة ===== */}
        {step === 'done' && (
          <>
            {importing && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <svg className="animate-spin w-16 h-16 text-green-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                </div>
                <p className="font-bold text-gray-700">{progress.label}</p>
                {progress.total > 0 && (
                  <>
                    <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.current} / {progress.total}</p>
                  </>
                )}
              </div>
            )}

            {result && !importing && (
              <div className="space-y-3">
                <div className={`rounded-xl border p-5 ${result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <p className={`text-xl font-bold mb-1 ${result.failed === 0 ? 'text-green-700' : 'text-orange-700'}`}>
                    {result.failed === 0 ? '✅ تم الرفع بنجاح!' : '⚠️ اكتمل الرفع مع بعض الأخطاء'}
                  </p>
                  <p className="text-sm text-gray-600">
                    تم رفع <span className="font-bold text-green-700">{result.success}</span> عنصر بنجاح
                    {result.failed > 0 && <>, فشل <span className="font-bold text-red-600">{result.failed}</span> عنصر</>}
                  </p>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4">
                    <p className="font-bold text-red-700 mb-2 text-sm">الأخطاء:</p>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <div key={i} className="bg-red-50 rounded-lg px-3 py-2 text-xs text-red-700">
                          <span className="font-bold">[{err.sheet} - صف {err.row}]</span> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-green-700 text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    العودة للرئيسية
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl text-sm cursor-pointer"
                  >
                    رفع ملف آخر
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
