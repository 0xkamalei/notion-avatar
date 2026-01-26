import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { getPricingConfig } from '@/lib/billing';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const pricing = getPricingConfig();
    const supabase = createClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(200).json({
        remaining: 0,
        total: pricing.siteFreeDailyLimit,
        isUnlimited: false,
        isAuthenticated: false,
        freeRemaining: 0,
        paidCredits: 0,
      });
    }

    const serviceClient = createServiceClient();

    // Check credit packages
    const { data: credits } = await serviceClient
      .from('credit_packages')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .gt('credits_remaining', 0);

    const totalCredits =
      credits?.reduce((sum, pkg) => sum + pkg.credits_remaining, 0) || 0;

    const today = new Date().toISOString().split('T')[0];
    const { data: siteUsage } = await serviceClient
      .from('site_daily_usage')
      .select('count')
      .eq('usage_date', today)
      .single();

    const usedToday = siteUsage?.count || 0;
    const freeRemaining = Math.max(0, pricing.siteFreeDailyLimit - usedToday);

    return res.status(200).json({
      remaining: freeRemaining + totalCredits,
      freeRemaining,
      paidCredits: totalCredits,
      total: pricing.siteFreeDailyLimit,
      isUnlimited: false,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('Usage check error:', error);
    return res.status(500).json({ error: 'Failed to check usage' });
  }
}
