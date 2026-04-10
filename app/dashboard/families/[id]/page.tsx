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
  const [individualError, setIndividualError] = useState('')

  const [selectedDiseases, setSelectedDiseases] = useState<{ id?: string; name: string; medication: string }[]>([])
  const [diseaseInput, setDiseaseInput] = useState('')
  const [diseaseSuggestions, setDiseaseSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const diseaseInputRef = useRef<HTMLInputElement>(null)

  const [selectedDisabilities, setSelectedDisabilities] = useState<string[]>([])
  const [otherDisability, setOtherDisability] = useState('')
  const [otherDisabilityInput, setOtherDisabilityInput] = useState('')
  const [otherDisabilitySuccess, setOtherDisabilitySuccess] = useState('')
  const [addedCustomDisabilities, setAddedCustomDisabilities] = useState<string[]>([])

  // ===== حقول تاريخ الميلاد المنفصلة =====
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')

  // ===== نموذج تعديل الأسرة =====
  const [showFamilyEditForm, setShowFamilyEditForm] = useState(false)
  const [familyForm, setFamilyForm] = useState({ name: '' })

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
    setFamilyForm({ name: familyData.name || '' })

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
    setOtherDisabilityInput('')
    setOtherDisabilitySuccess('')
    setAddedCustomDisabilities([])
    setBirthDay('')
    setBirthMonth('')
    setBirthYear('')
    setEditingIndividual(null)
    setShowForm(false)
    setIndividualError('')
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
    setIndividualError('')
    setForm({
      full_name: ind.full_name || '',
      national_id: ind.national_id || '',
      bank_account: ind.bank_account || '',
      gender: ind.gender || 'ذكر',
      birth_date: ind.birth_date || '',
      relationship: ind.relationship || '',
      notes: ind.notes || ''
    })

    // تقسيم تاريخ الميلاد إلى يوم وشهر وسنة
    if (ind.birth_date) {
      const parts = ind.birth_date.split('-')
      setBirthYear(parts[0] || '')
      setBirthMonth(parts[1] ? String(parseInt(parts[1])) : '')
      setBirthDay(parts[2] ? String(parseInt(parts[2])) : '')
    } else {
      setBirthDay('')
      setBirthMonth('')
      setBirthYear('')
    }
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
    setAddedCustomDisabilities([])
    setOtherDisabilityInput('')
    setOtherDisabilitySuccess('')
    if (custom) {
      setSelectedDisabilities([...standard, 'أخرى'])
      setOtherDisability(custom)
      setAddedCustomDisabilities([custom])
    }

    setEditingIndividual(ind)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const addCustomDisabilityHandler = () => {
    const name = otherDisabilityInput.trim()
    if (!name) return
    if (!addedCustomDisabilities.includes(name)) {
      const updated = [...addedCustomDisabilities, name]
      setAddedCustomDisabilities(updated)
      setOtherDisability(name)
      if (!selectedDisabilities.includes('أخرى')) {
        setSelectedDisabilities(prev => [...prev, 'أخرى'])
      }
    }
    setOtherDisabilityInput('')
    setOtherDisabilitySuccess(`✓ تمت إضافة "${name}" بنجاح`)
    setTimeout(() => setOtherDisabilitySuccess(''), 3000)
  }

  const removeCustomDisability = (name: string) => {
    const updated = addedCustomDisabilities.filter(d => d !== name)
    setAddedCustomDisabilities(updated)
    if (updated.length === 0) {
      setSelectedDisabilities(prev => prev.filter(x => x !== 'أخرى'))
      setOtherDisability('')
    } else {
      setOtherDisability(updated[updated.length - 1])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIndividualError('')

    const trimmedName = form.full_name.trim()
    const alreadyExists = individuals.some(
      (ind) =>
        ind.full_name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        ind.id !== editingIndividual?.id
    )
    if (alreadyExists) {
      setIndividualError(`⚠️ الفرد "${trimmedName}" مسجّل مسبقاً في هذه الأسرة!`)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // بناء تاريخ الميلاد من الحقول المنفصلة
    let builtBirthDate = ''
    if (birthYear && birthMonth && birthDay) {
      const d = String(birthDay).padStart(2, '0')
      const m = String(birthMonth).padStart(2, '0')
      builtBirthDate = `${birthYear}-${m}-${d}`
    }

    const allMembers = [...individuals, { birth_date: builtBirthDate }]
    const breastfeeding = checkBreastfeeding(form.relationship, form.gender, allMembers)

    const payload = {
      family_id: id,
      full_name: trimmedName,
      national_id: form.national_id || null,
      bank_account: form.bank_account || null,
      gender: form.gender,
      birth_date: builtBirthDate || null,
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

    const finalDisabilities = [
      ...selectedDisabilities.filter(d => d !== 'أخرى'),
      ...addedCustomDisabilities
    ].filter(Boolean)

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

  // ===== حفظ تعديل الأسرة =====
  const handleFamilyEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = familyForm.name.trim()
    if (!trimmedName) return
    await supabase.from('families').update({ name: trimmedName }).eq('id', id)
    setShowFamilyEditForm(false)
    fetchData()
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <p className="text-gray-400 text-sm">جاري التحميل...</p>
    </div>
  )

  const standardDisabilityTypes = ['بصرية', 'سمعية', 'حركية', 'عقلية']

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ===== شريط العنوان ===== */}
      <div className="bg-green-700 text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-green-200 truncate">منزل {house?.name}</p>
          <h1 className="text-sm font-bold truncate">أسرة {family?.name}</h1>
        </div>
        <button
          onClick={() => router.push(`/dashboard/houses/${family?.house_id}`)}
          className="bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer flex-shrink-0 mr-2"
        >
          رجوع
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-3">

        {/* ===== بطاقة معلومات الأسرة ===== */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {house?.sector}
              </span>
              <p className="text-xs text-gray-400 mt-1">
                {individuals.length} فرد
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFamilyEditForm(true)}
              className="text-blue-400 text-xs border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-50"
            >
              تعديل الأسرة
            </button>
            <button
              onClick={handleDeleteFamily}
              className="text-red-400 text-xs border border-red-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-red-50"
            >
              حذف الأسرة
            </button>
          </div>
        </div>

        {/* ===== نموذج تعديل الأسرة ===== */}
        {showFamilyEditForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">تعديل اسم الأسرة</h2>
              <button onClick={() => setShowFamilyEditForm(false)} className="text-gray-400 text-xl cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleFamilyEditSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">اسم الأسرة *</label>
                <input
                  required
                  value={familyForm.name}
                  onChange={e => setFamilyForm({ name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold text-sm cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => setShowFamilyEditForm(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== نموذج الإضافة/التعديل ===== */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">
                {editingIndividual ? 'تعديل الفرد' : 'إضافة فرد جديد'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {/* الاسم */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">الاسم الكامل *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => { setForm({ ...form, full_name: e.target.value }); setIndividualError('') }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                    ${individualError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {individualError && (
                  <p className="text-red-600 text-xs mt-1.5 bg-red-50 border border-red-200 rounded-lg p-2">
                    {individualError}
                  </p>
                )}
              </div>

              {/* الجنس + صلة القرابة */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الجنس *</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="ذكر">ذكر</option>
                    <option value="أنثى">أنثى</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">صلة القرابة</label>
                  <input
                    value={form.relationship}
                    onChange={e => setForm({ ...form, relationship: e.target.value })}
                    placeholder="رب أسرة / زوجة..."
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* تاريخ الميلاد - يوم / شهر / سنة */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">تاريخ الميلاد</label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="اليوم"
                      value={birthDay}
                      onChange={e => setBirthDay(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">يوم</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="الشهر"
                      value={birthMonth}
                      onChange={e => setBirthMonth(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">شهر</p>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1900"
                      max="2100"
                      placeholder="السنة"
                      value={birthYear}
                      onChange={e => setBirthYear(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    />
                    <p className="text-xs text-gray-400 text-center mt-1">سنة</p>
                  </div>
                </div>
              </div>

              {/* الرقم الوطني + الحساب البنكي */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">الرقم الوطني</label>
                  <input
                    value={form.national_id}
                    onChange={e => setForm({ ...form, national_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">رقم الحساب البنكي</label>
                  <input
                    value={form.bank_account}
                    onChange={e => setForm({ ...form, bank_account: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* الأمراض */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">الأمراض المزمنة</label>
                <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                  {selectedDiseases.length > 0 && (
                    <div className="space-y-2">
                      {selectedDiseases.map(d => (
                        <div key={d.name} className="bg-red-50 border border-red-200 rounded-xl p-2.5">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-red-800 font-bold text-sm">{d.name}</span>
                            <button
                              type="button"
                              onClick={() => removeDisease(d.name)}
                              className="text-red-400 text-lg cursor-pointer leading-none"
                            >✕</button>
                          </div>
                          <input
                            value={d.medication}
                            onChange={e => updateMedication(d.name, e.target.value)}
                            placeholder="الدواء (اختياري)"
                            className="w-full border border-red-200 rounded-lg p-2 text-xs bg-white"
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
                      className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={addCustomDisease}
                      className="bg-green-600 text-white px-4 rounded-xl text-sm cursor-pointer font-bold"
                    >+</button>
                    {showSuggestions && diseaseSuggestions.length > 0 && (
                      <div className="absolute top-full right-0 left-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 overflow-hidden">
                        {diseaseSuggestions.map(d => (
                          <button key={d.id} type="button"
                            onClick={() => addDiseaseFromSuggestion(d)}
                            className="w-full text-right px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                            {d.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">اكتب واختر من الاقتراحات أو اضغط + لإضافة مرض جديد</p>
                </div>
              </div>

              {/* الإعاقة */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">الإعاقة</label>
                <div className="border border-gray-200 rounded-xl p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {standardDisabilityTypes.map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-sm py-1">
                        <input
                          type="checkbox"
                          checked={selectedDisabilities.includes(type)}
                          onChange={() => toggleDisability(type)}
                          className="w-4 h-4 accent-green-600 cursor-pointer"
                        />
                        {type}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer text-sm py-1">
                      <input
                        type="checkbox"
                        checked={selectedDisabilities.includes('أخرى')}
                        onChange={() => toggleDisability('أخرى')}
                        className="w-4 h-4 accent-green-600 cursor-pointer"
                      />
                      أخرى
                    </label>
                  </div>
                  {selectedDisabilities.includes('أخرى') && (
                    <div className="mt-3 space-y-2">
                      {/* الإعاقات المضافة */}
                      {addedCustomDisabilities.length > 0 && (
                        <div className="space-y-1.5">
                          {addedCustomDisabilities.map(name => (
                            <div key={name} className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex justify-between items-center">
                              <span className="text-orange-800 font-bold text-sm">{name}</span>
                              <button
                                type="button"
                                onClick={() => removeCustomDisability(name)}
                                className="text-orange-400 text-lg cursor-pointer leading-none"
                              >✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* حقل الإدخال + زر الإضافة */}
                      <div className="flex gap-2">
                        <input
                          value={otherDisabilityInput}
                          onChange={e => setOtherDisabilityInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomDisabilityHandler() } }}
                          placeholder="حدد نوع الإعاقة..."
                          className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={addCustomDisabilityHandler}
                          className="bg-green-600 text-white px-4 rounded-xl text-sm cursor-pointer font-bold"
                        >+</button>
                      </div>
                      {/* رسالة النجاح */}
                      {otherDisabilitySuccess && (
                        <p className="text-green-700 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          {otherDisabilitySuccess}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ملاحظات */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">ملاحظات</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-green-700 text-white py-3 rounded-xl font-bold text-sm cursor-pointer"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl text-sm cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===== زر إضافة فرد ===== */}
        {!showForm && (
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="w-full bg-green-700 text-white py-3.5 rounded-xl font-bold text-sm cursor-pointer shadow-sm"
          >
            + إضافة فرد
          </button>
        )}

        {/* ===== قائمة الأفراد ===== */}
        {individuals.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">لا يوجد أفراد بعد</p>
        ) : (
          <div className="space-y-2">
            {individuals.map(ind => {
              const indDiseases = ind.individual_diseases || []
              const indDisabilities = ind.individual_disabilities || []

              return (
                <div key={ind.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                  {/* رأس بطاقة الفرد */}
                  <div className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{ind.full_name}</p>

                      {/* ===== مخفي مؤقتاً: badges الجنس وصلة القرابة وتاريخ الميلاد =====
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {ind.gender && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {ind.gender}
                          </span>
                        )}
                        {ind.relationship && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {ind.relationship}
                          </span>
                        )}
                        {ind.birth_date && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {new Date(ind.birth_date).toLocaleDateString('ar-LY')}
                          </span>
                        )}
                      </div>
                      ===== نهاية المخفي ===== */}

                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ind)}
                        className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg cursor-pointer border border-blue-100"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(ind.id)}
                        className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg cursor-pointer border border-red-100"
                      >
                        حذف
                      </button>
                    </div>
                  </div>

                  {/* ===== مخفي مؤقتاً: قسم الأمراض والإعاقات =====
                  {(indDiseases.length > 0 || indDisabilities.length > 0) && (
                    <div className="px-4 pb-3 border-t border-gray-100 pt-2 space-y-1.5">
                      {indDiseases.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {indDiseases.map((d: any) => (
                            <span key={d.id} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">
                              {d.diseases?.name || d.custom_disease}
                              {d.medication ? ` · ${d.medication}` : ''}
                            </span>
                          ))}
                        </div>
                      )}
                      {indDisabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {indDisabilities.map((d: any) => (
                            <span key={d.id} className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full">
                              إعاقة: {d.disabilities?.type || d.custom_disability}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  ===== نهاية المخفي ===== */}

                  {/* ملاحظات */}
                  {ind.notes && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">{ind.notes}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
