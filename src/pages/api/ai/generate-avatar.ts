import type { NextApiRequest, NextApiResponse } from 'next';
import { generateAvatar } from '@/lib/gemini';
import { AIGenerateRequest, AIGenerateResponse } from '@/types/ai';
import { estimateGenerationUsage, getPricingConfig } from '@/lib/billing';
import {
  createClient,
  createServiceClient,
  base64ToBuffer,
  uploadImageToStorage,
} from '@/lib/supabase/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIGenerateResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
    });
  }

  try {
    const { mode, image, description } = req.body as AIGenerateRequest;

    if (!mode || (mode !== 'photo2avatar' && mode !== 'text2avatar')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid generation mode',
      });
    }

    if (mode === 'photo2avatar' && !image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required for photo2avatar mode',
      });
    }

    if (mode === 'text2avatar' && !description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required for text2avatar mode',
      });
    }

    const supabase = createClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Please sign in to generate avatars',
      });
    }

    const pricing = getPricingConfig();
    const today = new Date().toISOString().split('T')[0];

    const input = mode === 'photo2avatar' ? image! : description!;
    const { estimatedTokens, requiredCredits } = estimateGenerationUsage(
      mode,
      input,
    );

    const serviceClient = createServiceClient();

    const { data: usedFree } = await serviceClient.rpc(
      'try_consume_site_free_usage',
      {
        p_date: today,
        p_limit: pricing.siteFreeDailyLimit,
      },
    );

    let reservedCredits = 0;

    if (!usedFree) {
      const { data: creditData } = await serviceClient
        .from('credit_packages')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .gt('credits_remaining', 0);

      const totalCredits =
        creditData?.reduce((sum, pkg) => sum + pkg.credits_remaining, 0) || 0;

      if (totalCredits < requiredCredits) {
        return res.status(402).json({
          success: false,
          error:
            totalCredits <= 0
              ? 'Today’s free quota has been used. Please recharge credits to continue.'
              : 'Insufficient credits. Please recharge to continue.',
          requiredCredits,
        });
      }

      const { data: consumedCredits } = await serviceClient.rpc(
        'consume_user_credits',
        {
          p_user_id: user.id,
          p_amount: requiredCredits,
        },
      );

      if (!consumedCredits) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient credits. Please recharge to continue.',
          requiredCredits,
        });
      }

      reservedCredits = requiredCredits;
    }

    let generatedImage: string;
    try {
      generatedImage = await generateAvatar(mode, input);
    } catch (generationError) {
      if (usedFree) {
        await serviceClient.rpc('refund_site_free_usage', { p_date: today });
      }
      if (reservedCredits > 0) {
        await serviceClient.rpc('refund_user_credits', {
          p_user_id: user.id,
          p_amount: reservedCredits,
        });
      }
      throw generationError;
    }

    // Upload image to Supabase Storage
    let imagePath: string | null = null;
    try {
      const imageBuffer = base64ToBuffer(generatedImage);
      imagePath = await uploadImageToStorage(imageBuffer, user!.id);
    } catch (uploadError) {
      console.error('Failed to upload image to storage:', uploadError);
      // Continue without storing image path - don't fail the request
      // The base64 image is still returned to the client
    }

    // Insert usage record with image_path if upload succeeded
    await serviceClient.from('usage_records').insert({
      user_id: user!.id,
      generation_mode: mode,
      input_type: mode === 'photo2avatar' ? 'image' : 'text',
      image_path: imagePath,
      credits_charged: reservedCredits,
      estimated_tokens: estimatedTokens,
      used_free: !!usedFree,
    });

    return res.status(200).json({
      success: true,
      image: generatedImage,
      creditsCharged: reservedCredits,
      usedFree: !!usedFree,
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Support large image uploads
    },
  },
};
