import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuario e obrigatorio' },
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

    await supabase
      .from('users')
      .update({ partner_id: null })
      .eq('id', userId);

    if (partnerId) {
      await supabase
        .from('users')
        .update({ partner_id: null })
        .eq('id', partnerId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
