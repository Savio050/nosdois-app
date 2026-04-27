import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { partnerCode } = await request.json()
    if (!partnerCode) return NextResponse.json({ error: 'Código do parceiro é obrigatório' }, { status: 400 })

    const supabase = await createClient()

    const { data: me, error: meErr } = await supabase
      .from('users').select('*').eq('id', userId).single()
    if (meErr || !me) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (me.partner_id) return NextResponse.json({ error: 'Você já está conectado com um parceiro' }, { status: 400 })

    const { data: partner, error: pErr } = await supabase
      .from('users').select('*').eq('couple_code', partnerCode.toUpperCase()).single()
    if (pErr || !partner) return NextResponse.json({ error: 'Código inválido' }, { status: 404 })

    if (partner.id === userId) return NextResponse.json({ error: 'Você não pode conectar consigo mesmo' }, { status: 400 })
    if (partner.partner_id) return NextResponse.json({ error: 'Este usuário já está conectado com outra pessoa' }, { status: 400 })

    await supabase.from('users').update({ partner_id: partner.id }).eq('id', userId)
    await supabase.from('users').update({ partner_id: userId }).eq('id', partner.id)

    return NextResponse.json({
      user: {
        id: me.id,
        email: me.email,
        name: me.name,
        coupleCode: me.couple_code,
        avatarUrl: me.avatar_url ?? null,
        partner: { id: partner.id, name: partner.name, email: partner.email, avatarUrl: partner.avatar_url ?? null },
      },
    })
  } catch (err) {
    console.error('Connect error:', err)
    return NextResponse.json({ error: 'Erro ao conectar' }, { status: 500 })
  }
}
