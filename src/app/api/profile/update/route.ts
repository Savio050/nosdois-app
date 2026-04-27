import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { name, currentPassword, newPassword } = await request.json()

    const supabase = await createClient()
    const { data: user } = await supabase
      .from('users').select('name, password_hash').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const updates: Record<string, string> = {}

    if (name?.trim() && name.trim() !== user.name) {
      updates.name = name.trim()
    }

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Senha atual é obrigatória' }, { status: 400 })
      if (newPassword.length < 6) return NextResponse.json({ error: 'Nova senha deve ter pelo menos 6 caracteres' }, { status: 400 })

      const isHashed = user.password_hash.startsWith('$2')
      const ok = isHashed
        ? await bcrypt.compare(currentPassword, user.password_hash)
        : user.password_hash === currentPassword
      if (!ok) return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 401 })

      updates.password_hash = await bcrypt.hash(newPassword, 12)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhuma alteração fornecida' }, { status: 400 })
    }

    const { data: updated, error: updateErr } = await supabase
      .from('users').update(updates).eq('id', userId).select('id, email, name, couple_code, avatar_url, partner_id').single()

    if (updateErr) {
      console.error('Profile update error:', updateErr)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    let partner = null
    if (updated.partner_id) {
      const { data: p } = await supabase
        .from('users').select('id, name, email, avatar_url').eq('id', updated.partner_id).single()
      if (p) partner = { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatar_url ?? null }
    }

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        coupleCode: updated.couple_code,
        avatarUrl: updated.avatar_url ?? null,
        partner,
      },
    })
  } catch (err) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
