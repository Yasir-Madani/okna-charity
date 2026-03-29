'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { getAgeCategory, checkBreastfeeding } from '../../../lib/helpers'

export default function FamilyPage() {
  const [family, setFamily] = useState<any>(null)
  const [house, setHouse] = useState<any>(null)
  const [individuals, setIndividuals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingIndividual, setEditingIndividual] = useState<any>(null)
  const [diseases, setDiseases] = useState<any[]>([])
  const [disabilities, setDisabilities] = useState<any[]>([])

  const [selectedDiseases, setSelectedDiseases] = useState<{ id?: string; name: string; medication: string }[]>([])
  const [diseaseInput, setDiseaseInput] = useState('')
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const diseaseInputRef = useRef<HTMLInputElement>(null)

  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>([])
  const [otherDisability, setOtherDisability] = useState('')

  const router = useRouter()
  const { id } = useParams()

  const [form, setForm] = useState({
    full_name: '',
    national_id: '',
    bank_account: '',
    gender: 'ذكر',
    birth_date: '',
    relationship: '',
    notes: ''
  })

  useEffect(() => { checkUser() }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    fetchData()
  }

  const fetchData = async () => {
    const { data: familyData } = await supabase
      .from('families').select('*, houses(*)').eq('id', id).single()
    if (!familyData) { router.push('/dashboard'); return }
    setFamily(familyData)
    setHouse(familyData.houses)

    const { data: inds } = await supabase
      .from('individuals')
      .select(`*, individual_diseases(*, diseases(*)), individual_disabilities(*, disabilities(*))`)
      .eq('family_id', id)
      .order('created_at', { ascending: true })
    if (inds) setIndividuals(inds)

    const { data: dis } = await supabase.from('diseases').select('*').order('name')
    if (dis) setDiseases(dis)

    const { data: disab } = await supabase.from('disabilities').select('*')
    if (disab) setDisabilities(disab)

    setLoading(false)
  }

  const resetForm = () => {
    setForm({ full_name: '', national_id: '', bank_account: '', gender: 'ذكر', birth_date: '', relationship: '', notes: '' })
    setSelectedDiseases([])
    setDiseaseInput('')
    setSelectedDisabilities([])
    setOtherDisability('')
    setEditingIndividual(null)
    setShowForm(false)
  }

  const handleDiseaseInput = (val: string) => {
    setDiseaseInput(val)
    if (val.trim().length > 0) {
      const filtered = diseases.filter(d =>
        d.name.includes(val) && !selectedDiseases.find(s => s.name === d.name)
      )
      setDiseaseSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  const addDiseaseFromSuggestion = (disease: any) => {
    if (!selectedDiseases.find(s => s.name === disease.name)) {
      setSelectedDiseases([...selectedDiseases, { id: disease.id, name: disease.name, medication: '' }])
    }
    setDiseaseInput('')
    setShowSuggestions(false)
    diseaseInputRef.current?.focus()
  }

  const addCustomDisease = async () => {
    const name = diseaseInput.trim()
    if (!name || selectedDiseases.find(s => s.name === name)) {
      setDiseaseInput('')
      setShowSuggestions(false)
      return
    }
    const existing = diseases.find(d => d.name === name)
    if (existing) {
      addDiseaseFromSuggestion(existing)
    } else {
      const { data: newDisease } = await supabase.from('diseases').insert({ name }).select().single()
      if (newDisease) {
        setDiseases([...diseases, newDisease])
        setSelectedDiseases([...selectedDiseases, { id: newDisease.id, name, medication: '' }])
      }
    }
    setDiseaseInput('')
    setShowSuggestions(false)
  }

  const removeDisease = (name: string) => {
  if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return
  setSelectedDiseases(selectedDiseases.filter(d => d.name !== name))
}

  const updateMedication = (name: string, medication: string) => {
    setSelectedDiseases(selectedDiseases.map(d => d.name === name ? { ...d, medication } : d))
  }

  const toggleDisability = (type: string) => {
    setSelectedDisabilities(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
  }

  const handleEdit = (ind: any) => {
    setForm({
      full_name: ind.full_name || '',
      national_id: ind.national_id || '',
      bank_account: ind.bank_account || '',
      gender: ind.gender || 'ذكر',
      birth_date: ind.birth_date || '',
      relationship: ind.relationship || '',
      notes: ind.notes || ''
    })
    const ds = ind.individual_diseases?.map((d: any) => ({
      id: d.disease_id,
      name: d.diseases?.name || d.custom_disease || '',
      medication: d.medication || ''
    })) || []
    setSelectedDiseases(ds)

    const disabTypes = ind.individual_disabilities?.map((d: any) => d.disabilities?.type || d.custom_disability || '') || []
    const standardTypes = ['بصرية', 'سمعية', 'حركية', 'عقلية']
    const standard = disabTypes.filter((t: string) => standardTypes.includes(t))
    const custom = disabTypes.find((t: string) => !standardTypes.includes(t)) || ''
    setSelectedDisabilities(standard)
    if (custom) {
      setSelectedDisabilities([...standard, 'أخرى'])
      setOtherDisability(custom)
    }

    setEditingIndividual(ind)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const allMembers = [...individuals, { birth_date: form.birth_date }]
    const breastfeeding = checkBreastfeeding(form.relationship, form.gender, allMembers)

    const payload = {
      family_id: id,
      full_name: form.full_name,
      national_id: form.national_id || null,
      bank_account: form.bank_account || null,
      gender: form.gender,
      birth_date: form.birth_date || null,
      relationship: form.relationship || null,
      breastfeeding: breastfeeding || null,
      notes: form.notes || null,
      created_by: user.id
    }

    let indId = editingIndividual?.id

    if (editingIndividual) {
      await supabase.from('individuals').update(payload).eq('id', indId)
      await supabase.from('individual_diseases').delete().eq('individual_id', indId)
      await supabase.from('individual_disabilities').delete().eq('individual_id', indId)
    } else {
      const { data: newInd } = await supabase.from('individuals').insert(payload).select().single()
      indId = newInd?.id
    }

    if (selectedDiseases.length > 0) {
      await supabase.from('individual_diseases').insert(
        selectedDiseases.map(d => ({
          individual_id: indId,
          disease_id: d.id || null,
          custom_disease: d.id ? null : d.name,
          medication: d.medication || null
        }))
      )
    }

    const finalDisabilities = selectedDisabilities.includes('أخرى')
      ? [...selectedDisabilities.filter(d => d !== 'أخرى'), otherDisability].filter(Boolean)
      : selectedDisabilities

    if (finalDisabilities.length > 0) {
      const standardTypes = ['بصرية', 'سمعية', 'حركية', 'عقلية']
      await supabase.from('individual_disabilities').insert(
        finalDisabilities.map(type => {
          const existing = disabilities.find(d => d.type === type)
          return {
            individual_id: indId,
            disability_id: existing?.id || null,
            custom_disability: existing ? null : type
          }
        })
      )
    }

    resetForm()
    fetchData()
  }

  const handleDelete = async (indId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرد؟')) return
    await supabase.from('individuals').delete().eq('id', indId)
    fetchData()
  }

  const handleDeleteFamily = async () => {
    if (!confirm('هل أنت متأكد من حذف هذه الأسرة؟')) return
    await supabase.from('families').delete().eq('id', id)
    router.push(`/dashboard/houses/${family.house_id}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>

  const standardDisabilityTypes = ['بصرية', 'سمعية', 'حركية', 'عقلية']

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">أسرة {family?.name} ← منزل {house?.name}</h1>
        <button
          onClick={() => router.push(`/dashboard/houses/${family?.house_id}`)}
          className="bg-white text-green-600 px-3 py-1 rounded text-sm cursor-pointer"
        >
          رجوع
        </button>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        <div className="bg-white p-4 rounded-lg shadow mb-4 flex justify-between items-center">
          <div>
            

            {/* <p className="text-sm text-gray-500">
  المنزل: <span className="font-bold text-gray-700">{house?.name}</span>
</p> */}
            <p className="text-sm text-gray-500">المحور: <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">{house?.sector}</span></p>
            <p className="text-sm text-gray-500 mt-1">عدد الأفراد: <span className="font-bold">{individuals.length}</span></p>
          </div>
          <button onClick={handleDeleteFamily} className="text-red-500 text-sm underline cursor-pointer">حذف الأسرة</button>
        </div>

        <button
          onClick={() => { resetForm(); setShowForm(!showForm) }}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold mb-4 cursor-pointer"
        >
          + إضافة فرد
        </button>

        {showForm && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="font-bold text-lg mb-4">{editingIndividual ? 'تعديل الفرد' : 'إضافة فرد جديد'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-sm text-gray-600">الاسم الكامل *</label>
                  <input required value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">الرقم الوطني</label>
                  <input value={form.national_id}
                    onChange={e => setForm({ ...form, national_id: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">رقم الحساب البنكي</label>
                  <input value={form.bank_account}
                    onChange={e => setForm({ ...form, bank_account: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">الجنس *</label>
                  <select value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full border rounded p-2 text-right text-sm cursor-pointer">
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">تاريخ الميلاد</label>
                  <input type="date" value={form.birth_date}
                    onChange={e => setForm({ ...form, birth_date: e.target.value })}
                    className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">صلة القرابة</label>
                  <input value={form.relationship}
                    onChange={e => setForm({ ...form, relationship: e.target.value })}
                    placeholder="رب أسرة / زوجة / ابن..."
                    className="w-full border rounded p-2 text-right text-sm" />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700 block mb-2">الأمراض المزمنة</label>
                <div className="border rounded-lg p-3">
                  {selectedDiseases.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedDiseases.map(d => (
                        <div key={d.name} className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-red-800 font-bold">{d.name}</span>
                            <button type="button" onClick={() => removeDisease(d.name)}
                              className="text-red-400 hover:text-red-600 cursor-pointer text-xs mr-1">✕</button>
                          </div>
                          <input
                            value={d.medication}
                            onChange={e => updateMedication(d.name, e.target.value)}
                            placeholder="الدواء (اختياري)"
                            className="w-full border border-red-200 rounded p-1 text-xs text-right bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}


                <div className="relative flex gap-2">
  <input
    ref={diseaseInputRef}
    value={diseaseInput}
    onChange={e => handleDiseaseInput(e.target.value)}
    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomDisease() } }}
    placeholder="اكتب اسم المرض..."
    className="flex-1 border rounded p-2 text-right text-sm"
  />
  <button
    type="button"
    onClick={addCustomDisease}
    className="bg-green-600 text-white px-4 rounded text-sm cursor-pointer flex-shrink-0 font-bold"
  >
    +
  </button>
   
                    {showSuggestions && diseaseSuggestions.length > 0 && (
                      <div className="absolute top-full right-0 left-0 bg-white border rounded-lg shadow-lg z-10 mt-1">
                        {diseaseSuggestions.map(d => (
                          <button key={d.id} type="button"
                            onClick={() => addDiseaseFromSuggestion(d)}
                            className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b last:border-0">
                            {d.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">اكتب واختر من الاقتراحات أو اضغط Enter لإضافة مرض جديد</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold text-gray-700 block mb-2">الإعاقة</label>
                <div className="border rounded-lg p-3">
                  <div className="flex flex-wrap gap-3">
                    {standardDisabilityTypes.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input type="checkbox"
                          checked={selectedDisabilities.includes(type)}
                          onChange={() => toggleDisability(type)}
                          className="cursor-pointer" />
                        {type}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox"
                        checked={selectedDisabilities.includes('أخرى')}
                        onChange={() => toggleDisability('أخرى')}
                        className="cursor-pointer" />
                      أخرى
                    </label>
                  </div>
                  {selectedDisabilities.includes('أخرى') && (
                    <input
                      value={otherDisability}
                      onChange={e => setOtherDisability(e.target.value)}
                      placeholder="حدد نوع الإعاقة..."
                      className="mt-2 w-full border rounded p-2 text-right text-sm"
                    />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm text-gray-600">ملاحظات</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border rounded p-2 text-right text-sm" rows={2} />
              </div>

              <div className="flex gap-2 mt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded font-bold cursor-pointer">حفظ</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 py-2 rounded cursor-pointer">إلغاء</button>
              </div>
            </form>
          </div>
        )}

        {individuals.length === 0 ? (
          <p className="text-center text-gray-500 mt-8">لا يوجد أفراد بعد</p>
        ) : (
          <div className="space-y-3">
            {individuals.map(ind => (
              <div key={ind.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div>
  <h3 className="font-bold text-lg">{ind.full_name}</h3>
</div>
                  <div className="flex flex-col gap-1 items-end">
                    <button onClick={() => handleEdit(ind)} className="text-blue-600 text-sm underline cursor-pointer">تعديل</button>
                    <button onClick={() => handleDelete(ind.id)} className="text-red-500 text-sm underline cursor-pointer">حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
