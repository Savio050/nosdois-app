import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, partnerName } = body;

    if (!userId || !partnerName) {
      return NextResponse.json(
        { error: 'userId e partnerName sao obrigatorios' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario nao encontrado' },
        { status: 404 }
      );
    }

    const partnerId = user.partner_id;
    if (!partnerId) {
      return NextResponse.json(
        { error: 'Nenhum parceiro vinculado' },
        { status: 400 }
      );
    }

    await supabase
      .from('users')
      .update({ name: partnerName })
      .eq('id', partnerId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update partner name error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
