import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data: individuals } = await supabase
    .from('individuals')
    .select('gender, birth_date, individual_diseases(id)')

  const { count: housesCount } = await supabase
    .from('houses')
    .select('*', { count: 'exact', head: true })

  const { count: familiesCount } = await supabase
    .from('families')
    .select('*', { count: 'exact', head: true })

  const total = individuals?.length || 0
  const males = individuals?.filter(i => i.gender === 'ذكر').length || 0
  const females = individuals?.filter(i => i.gender === 'أنثى').length || 0

  const getAge = (b: string) => new Date().getFullYear() - new Date(b).getFullYear()

  const infants = individuals?.filter(i => i.birth_date && getAge(i.birth_date) <= 2).length || 0
  const children = individuals?.filter(i => i.birth_date && getAge(i.birth_date) > 2 && getAge(i.birth_date) <= 14).length || 0
  const youth = individuals?.filter(i => i.birth_date && getAge(i.birth_date) >= 15 && getAge(i.birth_date) <= 24).length || 0
  const adults = individuals?.filter(i => i.birth_date && getAge(i.birth_date) >= 25 && getAge(i.birth_date) <= 64).length || 0
  const elderly = individuals?.filter(i => i.birth_date && getAge(i.birth_date) >= 65).length || 0
  const sick = individuals?.filter(i => i.individual_diseases && (i.individual_diseases as any[]).length > 0).length || 0

  return NextResponse.json({
    total, males, females,
    houses: housesCount || 0,
    families: familiesCount || 0,
    infants, children, youth, adults, elderly, sick
  })
}