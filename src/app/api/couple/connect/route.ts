import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { userId, partnerCode } = await request.json();

    if (!userId || !partnerCode) {
      return NextResponse.json(
        { error: "ID do usuário e código do parceiro são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Find current user
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check if already connected
    if (currentUser.partner_id) {
      return NextResponse.json(
        { error: "Você já está conectado com um parceiro" },
        { status: 400 }
      );
    }

    // Find partner by code
    const { data: partner, error: partnerError } = await supabase
      .from("users")
      .select("*")
      .eq("couple_code", partnerCode.toUpperCase())
      .single();

    if (partnerError || !partner) {
      return NextResponse.json(
        { error: "Código inválido" },
        { status: 404 }
      );
    }

    // Can't connect to yourself
    if (partner.id === userId) {
      return NextResponse.json(
        { error: "Você não pode conectar consigo mesmo" },
        { status: 400 }
      );
    }

    // Check if partner already connected
    if (partner.partner_id) {
      return NextResponse.json(
        { error: "Este usuário já está conectado com outra pessoa" },
        { status: 400 }
      );
    }

    // Link both users - update current user
    const { error: updateError1 } = await supabase
      .from("users")
      .update({ partner_id: partner.id })
      .eq("id", userId);

    // Update partner
    const { error: updateError2 } = await supabase
      .from("users")
      .update({ partner_id: userId })
      .eq("id", partner.id);

    if (updateError1 || updateError2) {
      console.error("Update errors:", updateError1, updateError2);
      return NextResponse.json(
        { error: "Erro ao conectar com parceiro" },
        { status: 500 }
      );
    }

    // Get updated user
    const { data: updatedUser } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      user: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        name: updatedUser!.name,
        coupleCode: updatedUser!.couple_code,
        partnerId: updatedUser!.partner_id,
      },
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        coupleCode: partner.couple_code,
      },
    });
  } catch (error) {
    console.error("Connect error:", error);
    return NextResponse.json(
      { error: "Erro ao conectar com parceiro" },
      { status: 500 }
    );
  }
}
