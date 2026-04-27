import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { setSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, couple_code, partner_id, avatar_url, password_hash')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
    }

    // Support both bcrypt hashes and legacy plain text (migrate on login)
    let passwordOk = false
    const isHashed = user.password_hash.startsWith('$2')
    if (isHashed) {
      passwordOk = await bcrypt.compare(password, user.password_hash)
    } else {
      passwordOk = user.password_hash === password
      if (passwordOk) {
        // Migrate to bcrypt
        const newHash = await bcrypt.hash(password, 12)
        await supabase.from('users').update({ password_hash: newHash }).eq('id', user.id)
      }
    }

    if (!passwordOk) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 })
    }

    let partner = null
    if (user.partner_id) {
      const { data: p } = await supabase
        .from('users').select('id, name, email, avatar_url').eq('id', user.partner_id).single()
      if (p) partner = { id: p.id, name: p.name, email: p.email, avatarUrl: p.avatar_url ?? null }
    }

    await setSession(user.id)

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
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
