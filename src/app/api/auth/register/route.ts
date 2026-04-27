import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { setSession } from '@/lib/session'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email.toLowerCase()).single()
    if (existing) {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 400 })
    }

    // Unique couple code
    let coupleCode = generateCode()
    let exists = true
    while (exists) {
      const { data } = await supabase.from('users').select('id').eq('couple_code', coupleCode).single()
      if (!data) exists = false
      else coupleCode = generateCode()
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({ email: email.toLowerCase(), name: name.trim(), couple_code: coupleCode, password_hash: passwordHash })
      .select()
      .single()

    if (error) {
      console.error('Register insert error:', error)
      return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 })
    }

    await setSession(newUser.id)

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        coupleCode: newUser.couple_code,
        avatarUrl: newUser.avatar_url ?? null,
        partner: null,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erro ao registrar' }, { status: 500 })
  }
}
