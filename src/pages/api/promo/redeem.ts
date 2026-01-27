import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const requestSchema = z.object({
  code: z.string().min(1, 'Invalid promo code'),
});

function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(req, res);
    const serviceClient = createServiceClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = session.user.id;
    const parseResult = requestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ error: parseResult.error.issues[0].message });
    }

    const normalizedCode = normalizePromoCode(parseResult.data.code);
    const { data: creditsAwarded, error: redeemError } =
      await serviceClient.rpc('redeem_promo_code', {
        p_user_id: userId,
        p_promo_code: normalizedCode,
      });
    if (redeemError) {
      const message = redeemError.message || 'Invalid promo code';
      if (
        message.includes('Invalid promo code') ||
        message.includes('already redeemed') ||
        message.includes('has expired') ||
        message.includes('limit reached')
      ) {
        return res.status(400).json({ error: message });
      }
      console.error('Promo redeem error:', redeemError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({
      success: true,
      credits: creditsAwarded,
      message: `Successfully redeemed ${creditsAwarded} credits!`,
    });
  } catch (error) {
    console.error('Promo redeem error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
