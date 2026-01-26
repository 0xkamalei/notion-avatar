
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs/promises';
import path from 'node:path';

// Configuration
const SOURCE_IMAGES = [
  { path: 'public/image/angelina.jpg', id: '1' },
  { path: 'public/image/jack-chen.jpeg', id: '2' },
  { path: 'public/image/smith.jpg', id: '3' },
];

const STYLES = ['notion', 'ghibli', 'oil_painting'] as const;
type AvatarStyle = typeof STYLES[number];

const PROMPTS: Record<AvatarStyle, string> = {
  notion: `Transform this photo into a minimalist black-and-white avatar illustration with these exact characteristics:
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
  ghibli: `Transform this photo into a Studio Ghibli style anime character. Key characteristics:
- Hand-drawn anime aesthetic similar to Miyazaki films
- Soft, vibrant colors and lush palette
- Expressive, wide eyes typical of the style
- Detailed, painterly hair and clothes
- Simple but atmospheric background (sky blue or grassy green tones)
- Gentle lighting and shading
- Whimsical and charming feel
- Head and shoulders composition
- Keep the person's key facial features recognizable but stylized`,
  oil_painting: `Transform this photo into a classic oil painting portrait. Key characteristics:
- Visible brush strokes and rich texture
- Deep, resonant colors and tonal depth
- Classical lighting (chiaroscuro) with dramatic shadows
- Realistic proportions but painterly execution
- Canvas texture effect
- Elegant and timeless look
- Neutral, dark, or textured background appropriate for a portrait
- Head and shoulders composition
- Maintain resemblance but with artistic interpretation`
};

const TEXT_PROMPTS: Record<AvatarStyle, string[]> = {
  notion: [
    "A girl with glasses and long hair, smiling",
    "A man with a beard, wearing a hat",
    "A short-haired woman with earrings, confident expression"
  ],
  ghibli: [
    "Young girl with short hair in Ghibli style",
    "Boy with big eyes and smile",
    "Magical character with nature background"
  ],
  oil_painting: [
    "Classic portrait of a man",
    "Elegant woman with pearl earring",
    "Elderly man with beard"
  ]
};

const STYLE_DESCRIPTIONS: Record<AvatarStyle, string> = {
  notion: `Create a minimalist black-and-white avatar illustration with these exact characteristics:
- Pure black and white color scheme only
- Simple black outline strokes for facial contours
- Solid black fill for hair (no gradients, no strokes)
- Minimalist facial features: simple shapes for eyes, single line for nose, simple curve for mouth
- Pure white background (#ffffff) - MUST be solid white, no other colors, no gradients, no transparency
- Cartoon proportions with slightly larger head
- Completely flat design with NO shadows or gradients
- Slight hand-drawn imperfection in lines
- Head and shoulders composition only`,
  ghibli: `Create a Studio Ghibli style anime character. Key characteristics:
- Hand-drawn anime aesthetic similar to Miyazaki films
- Soft, vibrant colors and lush palette
- Expressive, wide eyes typical of the style
- Detailed, painterly hair and clothes
- Simple but atmospheric background (sky blue or grassy green tones)
- Gentle lighting and shading
- Whimsical and charming feel
- Head and shoulders composition`,
  oil_painting: `Create a classic oil painting portrait. Key characteristics:
- Visible brush strokes and rich texture
- Deep, resonant colors and tonal depth
- Classical lighting (chiaroscuro) with dramatic shadows
- Realistic proportions but painterly execution
- Canvas texture effect
- Elegant and timeless look
- Neutral, dark, or textured background appropriate for a portrait
- Head and shoulders composition`
};

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in environment variables.');
    process.exit(1);
  }

  const genai = new GoogleGenAI({ apiKey });
  const MODEL_NAME = 'gemini-2.5-flash-image'; 

  console.log(`Using model: ${MODEL_NAME}`);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'examples');
  await fs.mkdir(outputDir, { recursive: true });

  // 1. Generate Photo-to-Avatar Examples
  console.log('--- Generating Photo-to-Avatar Examples ---');
  for (const imageInfo of SOURCE_IMAGES) {
    const imagePath = path.join(process.cwd(), imageInfo.path);
    console.log(`Processing image: ${imageInfo.path}`);
    
    let imageBuffer: Buffer;
    try {
      imageBuffer = await fs.readFile(imagePath);
    } catch (err) {
      console.error(`Failed to read file ${imagePath}:`, err);
      continue;
    }

    const base64Image = imageBuffer.toString('base64');

    for (const style of STYLES) {
      const outputPath = path.join(outputDir, `${style}-${imageInfo.id}.png`);
      
      // Check if file already exists to avoid regenerating (optional, but good for saving credits/time)
      // For this task, user wants to update, so we might want to overwrite.
      // But since I already generated photo examples, I can skip them if they exist?
      // User said "对于 text generation examples 的图片资源也需要更新", implying I should focus on text.
      // But "也需要" (also need) implies both or addition.
      // I'll skip existing photo examples to save time, unless I want to ensure consistency.
      // Let's just generate everything to be safe and consistent.
      
      console.log(`  Generating ${style} style...`);
      
      try {
        const result = await genai.models.generateContent({
            model: MODEL_NAME,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: PROMPTS[style] },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                ]
              }
            ],
            config: {
              responseModalities: ['IMAGE']
            }
        });

        const buffer = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (buffer) {
           await fs.writeFile(outputPath, new Uint8Array(Buffer.from(buffer, 'base64')));
           console.log(`  Saved to ${outputPath}`);
        } else {
           console.error(`  No image data in response for ${style}`);
        }

      } catch (error) {
        console.error(`  Error generating ${style}:`, error);
      }
    }
  }

  // 2. Generate Text-to-Avatar Examples
  console.log('\n--- Generating Text-to-Avatar Examples ---');
  for (const style of STYLES) {
    console.log(`Processing style: ${style}`);
    const prompts = TEXT_PROMPTS[style];
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const outputPath = path.join(outputDir, `${style}-text-${i + 1}.png`);
      console.log(`  Generating text example ${i + 1}: "${prompt}"...`);

      const fullPrompt = `${prompt}. ${STYLE_DESCRIPTIONS[style]}`;

      try {
        const result = await genai.models.generateContent({
            model: MODEL_NAME,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: fullPrompt }
                ]
              }
            ],
            config: {
              responseModalities: ['IMAGE']
            }
        });

        const buffer = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (buffer) {
           await fs.writeFile(outputPath, new Uint8Array(Buffer.from(buffer, 'base64')));
           console.log(`  Saved to ${outputPath}`);
        } else {
           console.error(`  No image data in response for ${style} text example ${i + 1}`);
        }
      } catch (error) {
        console.error(`  Error generating text example ${i + 1} for ${style}:`, error);
      }
    }
  }
}

main().catch(console.error);
