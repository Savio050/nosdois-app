import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("couple_code, partner_id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if user has a partner
    if (!user.partner_id) {
      return NextResponse.json({
        question: null,
        userAnswer: null,
        partnerAnswer: null,
        datesWithAnswers: [],
      });
    }

    // If date provided, get answers and question for that date
    if (date) {
      // Get or create the daily question assignment
      let { data: coupleDaily } = await supabase
        .from("couple_daily")
        .select("question_id")
        .eq("couple_code", user.couple_code)
        .eq("assigned_date", date)
        .single();

      if (!coupleDaily) {
        // Assign a random question for this date
        const { data: questions } = await supabase
          .from("daily_questions")
          .select("id");

        if (!questions || questions.length === 0) {
          return NextResponse.json(
            { error: "Nenhuma pergunta disponível" },
            { status: 404 }
          );
        }

        // Get already used questions
        const { data: usedQuestions } = await supabase
          .from("couple_daily")
          .select("question_id")
          .eq("couple_code", user.couple_code);

        const usedIds = new Set(usedQuestions?.map((q) => q.question_id) || []);
        const availableQuestions = questions.filter((q) => !usedIds.has(q.id));
        const questionPool =
          availableQuestions.length > 0 ? availableQuestions : questions;
        const randomQuestion =
          questionPool[Math.floor(Math.random() * questionPool.length)];

        const { data: newCoupleDaily, error: insertError } = await supabase
          .from("couple_daily")
          .insert({
            couple_code: user.couple_code,
            question_id: randomQuestion.id,
            assigned_date: date,
          })
          .select("question_id")
          .single();

        if (insertError) {
          console.error("Insert couple_daily error:", insertError);
          return NextResponse.json(
            { error: "Erro ao atribuir pergunta" },
            { status: 500 }
          );
        }

        coupleDaily = newCoupleDaily;
      }

      // Get the question
      const { data: question } = await supabase
        .from("daily_questions")
        .select("id, question, category")
        .eq("id", coupleDaily!.question_id)
        .single();

      // Get user's answer
      const { data: userAnswer } = await supabase
        .from("answers")
        .select("answer")
        .eq("user_id", userId)
        .eq("answer_date", date)
        .single();

      // Get partner's answer
      const { data: partnerAnswer } = await supabase
        .from("answers")
        .select("answer")
        .eq("user_id", user.partner_id)
        .eq("answer_date", date)
        .single();

      return NextResponse.json({
        question: question
          ? {
              id: question.id,
              text: question.question,
              category: question.category,
            }
          : null,
        userAnswer: userAnswer?.answer || null,
        partnerAnswer: partnerAnswer?.answer || null,
      });
    }

    // Otherwise return all dates with answers for history
    const { data: allCoupleDaily } = await supabase
      .from("couple_daily")
      .select("assigned_date")
      .eq("couple_code", user.couple_code)
      .order("assigned_date", { ascending: false });

    const datesWithAnswers: string[] = [];

    for (const daily of allCoupleDaily || []) {
      // Check if at least one person answered
      const { data: answers } = await supabase
        .from("answers")
        .select("id")
        .eq("answer_date", daily.assigned_date)
        .in("user_id", [userId, user.partner_id]);

      if (answers && answers.length > 0) {
        datesWithAnswers.push(daily.assigned_date);
      }
    }

    return NextResponse.json({ datesWithAnswers });
  } catch (error) {
    console.error("Get answers error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar respostas" },
      { status: 500 }
    );
  }
}
