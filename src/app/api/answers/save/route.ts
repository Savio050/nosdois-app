import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { userId, date, answer } = await request.json();

    if (!userId || !date || !answer) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
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
      return NextResponse.json(
        { error: "Você precisa estar conectado com um parceiro" },
        { status: 400 }
      );
    }

    // Get or create the daily question assignment for this couple
    let { data: coupleDaily } = await supabase
      .from("couple_daily")
      .select("question_id")
      .eq("couple_code", user.couple_code)
      .eq("assigned_date", date)
      .single();

    if (!coupleDaily) {
      // Assign a random question for today
      const { data: questions } = await supabase
        .from("daily_questions")
        .select("id");

      if (!questions || questions.length === 0) {
        return NextResponse.json(
          { error: "Nenhuma pergunta disponível" },
          { status: 404 }
        );
      }

      // Get already used questions for this couple
      const { data: usedQuestions } = await supabase
        .from("couple_daily")
        .select("question_id")
        .eq("couple_code", user.couple_code);

      const usedIds = new Set(usedQuestions?.map((q) => q.question_id) || []);
      const availableQuestions = questions.filter((q) => !usedIds.has(q.id));

      // If all questions used, reset the pool
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

    // Check if answer already exists for this user and date
    const { data: existingAnswer } = await supabase
      .from("answers")
      .select("id")
      .eq("user_id", userId)
      .eq("answer_date", date)
      .single();

    if (existingAnswer) {
      // Update existing answer
      const { error: updateError } = await supabase
        .from("answers")
        .update({ answer, question_id: coupleDaily!.question_id })
        .eq("id", existingAnswer.id);

      if (updateError) {
        console.error("Update answer error:", updateError);
        return NextResponse.json(
          { error: "Erro ao atualizar resposta" },
          { status: 500 }
        );
      }
    } else {
      // Insert new answer
      const { error: insertError } = await supabase.from("answers").insert({
        user_id: userId,
        question_id: coupleDaily!.question_id,
        answer,
        answer_date: date,
      });

      if (insertError) {
        console.error("Insert answer error:", insertError);
        return NextResponse.json(
          { error: "Erro ao salvar resposta" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save answer error:", error);
    return NextResponse.json(
      { error: "Erro ao salvar resposta" },
      { status: 500 }
    );
  }
}
