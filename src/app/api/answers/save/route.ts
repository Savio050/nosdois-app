import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { date, answer } = await request.json()
    if (!date || !answer?.trim()) {
      return NextResponse.json({ error: 'Data e resposta são obrigatórios' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: user, error: userErr } = await supabase
      .from('users').select('couple_code, partner_id').eq('id', userId).single()
    if (userErr || !user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    if (!user.partner_id) return NextResponse.json({ error: 'Você precisa estar conectado com um parceiro' }, { status: 400 })

    // Ensure couple_daily exists
    let { data: coupleDaily } = await supabase
      .from('couple_daily').select('question_id')
      .eq('couple_code', user.couple_code).eq('assigned_date', date).single()

    if (!coupleDaily) {
      const { data: allQs } = await supabase.from('daily_questions').select('id')
      if (!allQs || allQs.length === 0) return NextResponse.json({ error: 'Nenhuma pergunta disponível' }, { status: 404 })

      const { data: used } = await supabase
        .from('couple_daily').select('question_id').eq('couple_code', user.couple_code)
      const usedIds = new Set((used ?? []).map((q: { question_id: string }) => q.question_id))
      const pool = allQs.filter((q: { id: string }) => !usedIds.has(q.id))
      const pick = pool.length > 0 ? pool : allQs
      const chosen = pick[Math.floor(Math.random() * pick.length)]

      const { data: inserted } = await supabase
        .from('couple_daily')
        .insert({ couple_code: user.couple_code, question_id: chosen.id, assigned_date: date })
        .select('question_id').single()
      coupleDaily = inserted
    }

    // Upsert answer
    const { data: existing } = await supabase
      .from('answers').select('id').eq('user_id', userId).eq('answer_date', date).single()

    if (existing) {
      await supabase.from('answers').update({ answer: answer.trim(), question_id: coupleDaily!.question_id }).eq('id', existing.id)
    } else {
      await supabase.from('answers').insert({
        user_id: userId,
        question_id: coupleDaily!.question_id,
        answer: answer.trim(),
        answer_date: date,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Save answer error:', err)
    return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
  }
}
