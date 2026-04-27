import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { getQuestionForDate, questions } from '@/lib/questions'

export async function GET(request: Request) {
  const userId = await getSession()
  if (!userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const supabase = await createClient()

    const { data: user, error: userErr } = await supabase
      .from('users').select('couple_code, partner_id').eq('id', userId).single()
    if (userErr || !user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    if (!user.partner_id) {
      return NextResponse.json({ question: null, userAnswer: null, partnerAnswer: null, datesWithAnswers: [] })
    }

    if (date) {
      // Ensure couple_daily record exists for this date
      let { data: coupleDaily } = await supabase
        .from('couple_daily')
        .select('question_id')
        .eq('couple_code', user.couple_code)
        .eq('assigned_date', date)
        .single()

      if (!coupleDaily) {
        const { data: allQuestions } = await supabase.from('daily_questions').select('id')

        if (!allQuestions || allQuestions.length === 0) {
          // Fallback to local questions list
          const dateObj = new Date(date + 'T12:00:00')
          const questionText = getQuestionForDate(dateObj)
          const questionIndex = questions.indexOf(questionText)
          return NextResponse.json({
            question: { id: String(questionIndex), text: questionText, category: 'Conexão' },
            userAnswer: null,
            partnerAnswer: null,
          })
        }

        const { data: used } = await supabase
          .from('couple_daily').select('question_id').eq('couple_code', user.couple_code)
        const usedIds = new Set((used ?? []).map((q: { question_id: string }) => q.question_id))
        const pool = allQuestions.filter((q: { id: string }) => !usedIds.has(q.id))
        const pick = pool.length > 0 ? pool : allQuestions
        const chosen = pick[Math.floor(Math.random() * pick.length)]

        const { data: inserted } = await supabase
          .from('couple_daily')
          .insert({ couple_code: user.couple_code, question_id: chosen.id, assigned_date: date })
          .select('question_id').single()
        coupleDaily = inserted
      }

      const { data: q } = await supabase
        .from('daily_questions').select('id, question, category').eq('id', coupleDaily!.question_id).single()
      const { data: myAns } = await supabase
        .from('answers').select('answer').eq('user_id', userId).eq('answer_date', date).single()
      const { data: partnerAns } = await supabase
        .from('answers').select('answer').eq('user_id', user.partner_id).eq('answer_date', date).single()

      return NextResponse.json({
        question: q ? { id: q.id, text: q.question, category: q.category } : null,
        userAnswer: myAns?.answer ?? null,
        partnerAnswer: partnerAns?.answer ?? null,
      })
    }

    // Return dates with answers for calendar
    const { data: allDailies } = await supabase
      .from('couple_daily').select('assigned_date')
      .eq('couple_code', user.couple_code)
      .order('assigned_date', { ascending: false })

    const datesWithAnswers: string[] = []
    for (const daily of allDailies ?? []) {
      const { data: ans } = await supabase
        .from('answers').select('id').eq('answer_date', daily.assigned_date)
        .in('user_id', [userId, user.partner_id])
      if (ans && ans.length > 0) datesWithAnswers.push(daily.assigned_date)
    }

    return NextResponse.json({ datesWithAnswers })
  } catch (err) {
    console.error('Get answers error:', err)
    return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
  }
}
