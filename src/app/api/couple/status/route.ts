import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find current user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Find partner if exists
    let partner = null;
    if (user.partner_id) {
      const { data: partnerData } = await supabase
        .from("users")
        .select("id, name, email, couple_code")
        .eq("id", user.partner_id)
        .single();

      if (partnerData) {
        partner = {
          id: partnerData.id,
          name: partnerData.name,
          email: partnerData.email,
          coupleCode: partnerData.couple_code,
        };
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        coupleCode: user.couple_code,
        partnerId: user.partner_id,
      },
      partner,
    });
  } catch (error) {
    console.error("Status error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar status do casal" },
      { status: 500 }
    );
  }
}
