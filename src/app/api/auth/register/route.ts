import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateCoupleCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      );
    }

    // Generate unique couple code
    let coupleCode = generateCoupleCode();
    let codeExists = true;
    while (codeExists) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("couple_code", coupleCode)
        .single();
      if (!data) {
        codeExists = false;
      } else {
        coupleCode = generateCoupleCode();
      }
    }

    // Insert new user (storing password as plain text for simplicity - in production use bcrypt)
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        name,
        couple_code: coupleCode,
        password_hash: password,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Erro ao criar conta" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        coupleCode: newUser.couple_code,
        partnerId: newUser.partner_id,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro ao registrar usuário" },
      { status: 500 }
    );
  }
}
