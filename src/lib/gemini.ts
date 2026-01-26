import { GoogleGenAI } from '@google/genai';
import { AIGenerationMode, AvatarStyle } from '@/types/ai';

// Mock Avatar (Simple SVG)
const MOCK_AVATAR_SVG = `<svg viewBox="0 0 1080 1080" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="#fffefc"/>
  <path d="M540 200C350 200 200 350 200 540C200 730 350 880 540 880C730 880 880 730 880 540C880 350 730 200 540 200Z" stroke="black" stroke-width="20"/>
  <circle cx="400" cy="450" r="50" fill="black"/>
  <circle cx="680" cy="450" r="50" fill="black"/>
  <path d="M400 700Q540 800 680 700" stroke="black" stroke-width="20" fill="none"/>
</svg>`;

const MOCK_AVATAR_BASE64 = `data:image/svg+xml;base64,${Buffer.from(
  MOCK_AVATAR_SVG,
).toString('base64')}`;

const PROMPTS: Record<AvatarStyle, { photo: string; text: string }> = {
  notion: {
    photo: `Transform this photo into a minimalist black-and-white avatar illustration with these exact characteristics:
- Pure black and white color scheme only
- Simple black outline strokes for facial contours
- Solid black fill for hair (no gradients, no strokes)
- Minimalist facial features: simple shapes for eyes, single line for nose, simple curve for mouth
- Pure white background (#ffffff) - MUST be solid white, no other colors, no gradients, no transparency
- Cartoon proportions with slightly larger head
- Completely flat design with NO shadows or gradients
- Slight hand-drawn imperfection in lines
- Head and shoulders composition only
- Keep the person's key facial features recognizable but simplified`,
    text: `Generate a minimalist black-and-white portrait illustration based on this description:
- Pure black and white color scheme only
- Simple black outline strokes for facial contours  
- Solid black fill for hair (no gradients)
- Minimalist facial features: simple shapes for eyes, single line for nose, simple curve for mouth
- Pure white background (#ffffff) - MUST be solid white, no other colors, no gradients, no transparency
- Cartoon proportions with slightly larger head
- Completely flat design with NO shadows or gradients
- Slight hand-drawn imperfection in lines
- Head and shoulders composition only

User description: `,
  },
  ghibli: {
    photo: `Transform this photo into a Studio Ghibli style anime character. Key characteristics:
- Hand-drawn anime aesthetic similar to Miyazaki films
- Soft, vibrant colors and lush palette
- Expressive, wide eyes typical of the style
- Detailed, painterly hair and clothes
- Simple but atmospheric background (sky blue or grassy green tones)
- Gentle lighting and shading
- Whimsical and charming feel
- Head and shoulders composition
- Keep the person's key facial features recognizable but stylized`,
    text: `Generate a Studio Ghibli style anime character portrait based on this description:
- Hand-drawn anime aesthetic similar to Miyazaki films
- Soft, vibrant colors and lush palette
- Expressive, wide eyes
- Detailed, painterly hair and clothes
- Simple but atmospheric background
- Gentle lighting and shading
- Whimsical and charming feel
- Head and shoulders composition

User description: `,
  },
  oil_painting: {
    photo: `Transform this photo into a classic oil painting portrait. Key characteristics:
- Visible brush strokes and rich texture
- Deep, resonant colors and tonal depth
- Classical lighting (chiaroscuro) with dramatic shadows
- Realistic proportions but painterly execution
- Canvas texture effect
- Elegant and timeless look
- Neutral, dark, or textured background appropriate for a portrait
- Head and shoulders composition
- Maintain resemblance but with artistic interpretation`,
    text: `Generate a classic oil painting portrait based on this description:
- Visible brush strokes and rich texture
- Deep, resonant colors and tonal depth
- Classical lighting (chiaroscuro)
- Realistic proportions but painterly execution
- Canvas texture effect
- Elegant and timeless look
- Neutral, dark, or textured background
- Head and shoulders composition

User description: `,
  },
};

export async function generateAvatar(
  mode: AIGenerationMode,
  input: string,
  style: AvatarStyle = 'notion',
): Promise<string> {
  // 1. Mock Mode Check
  if (process.env.USE_MOCK_AI === 'true' || !process.env.GEMINI_API_KEY) {
    // eslint-disable-next-line no-console
    console.log('[Mock AI] Generating avatar...');
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 2000);
    });
    return MOCK_AVATAR_BASE64;
  }

  // 2. Real API Call
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Using gemini-2.5-flash-image which supports image generation
  const model = 'gemini-2.5-flash-image';

  try {
    let result;
    const promptConfig = PROMPTS[style] || PROMPTS.notion;

    if (mode === 'photo2avatar') {
      // Input is base64 image (removed data:image/xxx;base64, prefix if needed)
      const base64Data = input.replace(/^data:image\/\w+;base64,/, '');

      result = await genai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptConfig.photo },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            ],
          },
        ],
        config: { responseModalities: ['IMAGE'] },
      });
    } else {
      // Input is text description
      const promptText = promptConfig.text;
      result = await genai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${promptText}${input}` }],
          },
        ],
        config: { responseModalities: ['IMAGE'] },
      });
    }

    // Safety check for response
    if (!result?.candidates || result.candidates.length === 0) {
      throw new Error('No image generated');
    }

    // Extract image data
    const parts = result.candidates[0]?.content?.parts;
    if (!parts) {
      throw new Error('No content parts in response');
    }

    const imagePart = parts.find((p: any) => p.inlineData);

    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }

    throw new Error('Unexpected response format');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Gemini API Error:', error);
    throw error;
  }
}
