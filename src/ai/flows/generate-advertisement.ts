
'use server';
/**
 * @fileOverview A flow to generate a short video advertisement for an artisan's products.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/google-genai';
import { textToSpeech } from './text-to-speech';

const ProductInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  imageDataUri: z.string().describe("A data URI of the product image. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

export const GenerateAdvertisementInputSchema = z.object({
  artisanName: z.string(),
  products: z.array(ProductInfoSchema).min(3).max(3),
});
export type GenerateAdvertisementInput = z.infer<typeof GenerateAdvertisementInputSchema>;

export const GenerateAdvertisementOutputSchema = z.object({
    videoDataUri: z.string().describe("A data URI of the generated video."),
    audioDataUri: z.string().describe("A data URI of the generated audio narration."),
    generatedVideoPrompt: z.string(),
    generatedAudioScript: z.string(),
});
export type GenerateAdvertisementOutput = z.infer<typeof GenerateAdvertisementOutputSchema>;

const AdPromptSchema = z.object({
  videoPrompt: z.string().describe("A visually descriptive prompt for the Veo model, under 250 characters, describing a dynamic, engaging sequence showing all three products."),
  audioScript: z.string().describe("A short, engaging audio script (under 40 words) for a narrator, introducing the artisan and their three products."),
});

const promptGenerator = ai.definePrompt({
    name: 'advertisementPromptGenerator',
    input: { schema: GenerateAdvertisementInputSchema },
    output: { schema: AdPromptSchema },
    prompt: `You are a creative director for a high-end artisan marketplace. Your task is to generate a video prompt and an audio script for a short, 4-second video ad.

    Artisan: {{{artisanName}}}
    Products:
    1. {{{products.0.name}}}: {{{products.0.description}}}
    2. {{{products.1.name}}}: {{{products.1.description}}}
    3. {{{products.2.name}}}: {{{products.2.description}}}

    Instructions:
    1.  **Video Prompt:** Create a single, visually rich prompt for a video generation model (like Veo). The prompt should describe a beautiful, flowing sequence that showcases all three products. Imagine cinematic shots, smooth transitions, and an elegant, professional aesthetic. For example: "A cinematic reveal of a ceramic vase, transitioning to a detailed shot of a woven tapestry, ending on a shimmering silver necklace."
    2.  **Audio Script:** Write a very brief narration script. Start with the artisan's name and then briefly mention each product. The tone should be warm and inviting. For example: "Discover the creations of Elena Vance: the Ceramic Dawn Vase, the Bohemian Wall Weave, and the Azure Dream Necklace. Find your masterpiece."

    Return a JSON object with 'videoPrompt' and 'audioScript' keys.`,
});

export async function generateAdvertisement(input: GenerateAdvertisementInput): Promise<GenerateAdvertisementOutput> {
  // Step 1: Generate the prompts for video and audio using an LLM.
  const { output: adPrompts } = await promptGenerator(input);
  if (!adPrompts) {
    throw new Error('Failed to generate advertisement prompts.');
  }

  const { videoPrompt, audioScript } = adPrompts;

  // Step 2: Generate audio and video in parallel.
  const [audioResult, videoResult] = await Promise.all([
    textToSpeech(audioScript),
    ai.generate({
      model: googleAI.model('veo-3.0-generate-preview'),
      prompt: [
        { text: videoPrompt },
        { media: { contentType: 'image/jpeg', url: input.products[0].imageDataUri } },
        { media: { contentType: 'image/jpeg', url: input.products[1].imageDataUri } },
        { media: { contentType: 'image/jpeg', url: input.products[2].imageDataUri } },
      ],
      config: {
        personGeneration: 'allow_adult',
      }
    }),
  ]);
  
  let { operation } = videoResult;
  if (!operation) {
    throw new Error('Expected the video model to return an operation.');
  }
  
  // Wait for the video operation to complete.
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds.
    operation = await ai.checkOperation(operation);
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message}`);
  }

  const video = operation.output?.message?.content.find(p => !!p.media);
  if (!video || !video.media?.url) {
    throw new Error('Failed to find the generated video in the operation result.');
  }

  // NOTE: This basic flow returns separate audio and video. A more advanced implementation
  // would use a tool like FFMPEG to combine them into a single file.
  // For now, the client will have to handle playing them.
  return {
    videoDataUri: video.media.url,
    audioDataUri: audioResult,
    generatedVideoPrompt: videoPrompt,
    generatedAudioScript: audioScript,
  };
}
