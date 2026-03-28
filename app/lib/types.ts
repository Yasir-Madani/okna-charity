export type Sector = 'شرق' | 'شمال' | 'وسط' | 'الدوراشاب'
export type Gender = 'ذكر' | 'أنثى'
export type DisabilityType = 'بصرية' | 'سمعية' | 'حركية' | 'عقلية'

export interface House {
  id: string
  name: string
  sector: Sector
  notes?: string
  created_at: string
  created_by?: string
  families?: Family[]
}

export interface Family {
  id: string
  house_id: string
  notes?: string
  created_at: string
  created_by?: string
  individuals?: Individual[]
}

export interface Individual {
  id: string
  family_id: string
  full_name: string
  national_id?: string
  bank_account?: string
  gender: Gender
  birth_date?: string
  relationship?: string
  breastfeeding?: string
  notes?: string
  created_at: string
  created_by?: string
  diseases?: Disease[]
  disabilities?: Disability[]
}

export interface Disease {
  id: string
  name: string
  medication?: string
}

export interface Disability {
  id: string
  type: DisabilityType
}