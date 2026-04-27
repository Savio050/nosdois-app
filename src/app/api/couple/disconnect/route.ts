import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const supabase = await createClient()

    const { data: user } = await supabase
      .from('users').select('partner_id').eq('id', userId).single()

    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const partnerId = user.partner_id
    await supabase.from('users').update({ partner_id: null }).eq('id', userId)
    if (partnerId) await supabase.from('users').update({ partner_id: null }).eq('id', partnerId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Disconnect error:', err)
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 })
  }
}
