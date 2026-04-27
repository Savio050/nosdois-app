import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ user: null })

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, couple_code, partner_id, avatar_url')
    .eq('id', userId)
    .single()

  if (!user) return NextResponse.json({ user: null })

  let partner = null
  if (user.partner_id) {
    const { data: p } = await supabase
      .from('users').select('id, name, email, avatar_url').eq('id', user.partner_id).single()
    if (p) partner = { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatar_url ?? null }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      coupleCode: user.couple_code,
      avatarUrl: user.avatar_url ?? null,
      partner,
    },
  })
}
