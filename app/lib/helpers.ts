export function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function getAgeCategory(birthDate: string): string {
  const age = calculateAge(birthDate)
  if (age <= 2) return 'رضيع'
  if (age <= 14) return 'طفل'
  if (age <= 24) return 'شاب'
  if (age <= 64) return 'بالغ'
  return 'مسن'
}

export function checkBreastfeeding(
  relationship: string,
  gender: string,
  familyMembers: { birth_date?: string }[]
): string {
  if (relationship !== 'زوجة' || gender !== 'أنثى') return ''
  const hasInfant = familyMembers.some(m => {
    if (!m.birth_date) return false
    return calculateAge(m.birth_date) <= 2
  })
  return hasInfant ? 'مرضعة' : ''
}