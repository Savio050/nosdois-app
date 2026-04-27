import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Apenas imagens são aceitas' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Imagem muito grande (máx 5MB)' }, { status: 400 })

    const supabase = await createClient()

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadErr) {
      console.error('Avatar upload error:', uploadErr)
      return NextResponse.json({ error: 'Erro ao fazer upload da foto' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

    await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId)

    return NextResponse.json({ avatarUrl })
  } catch (err) {
    console.error('Avatar route error:', err)
    return NextResponse.json({ error: 'Erro ao atualizar foto' }, { status: 500 })
  }
}
