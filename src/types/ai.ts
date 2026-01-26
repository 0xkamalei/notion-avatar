export type AIGenerationMode = 'photo2avatar' | 'text2avatar';
export type AvatarStyle = 'notion' | 'ghibli' | 'oil_painting';

export interface AIGenerateRequest {
  mode: AIGenerationMode;
  style?: AvatarStyle;
  image?: string; // Base64 for photo2avatar
  description?: string; // Text prompt for text2avatar
}

export interface AIGenerateResponse {
  success: boolean;
  image?: string; // Base64 image
  error?: string;
  requiredCredits?: number;
  creditsCharged?: number;
  usedFree?: boolean;
}

export interface AIUsageState {
  remaining: number;
  total: number;
  isUnlimited: boolean;
}
