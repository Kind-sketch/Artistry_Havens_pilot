
/* eslint-disable */
const functions = require("firebase-functions");

async function initGenkit() {
  try {
    const { Genkit } = await import("@genkit-ai/core");
    const { googleAI } = await import("@genkit-ai/google-genai");

    const apiKey =
      process.env.GENKIT_KEY ||
      (functions.config().genkit && functions.config().genkit.key) ||
      "";

    const ai = new Genkit({
      plugins: [googleAI({ apiKey })],
      logLevel: "info",
    });

    return ai;
  } catch (err) {
    console.error("Genkit init error:", err);
    throw new Error(
      "🔥 Genkit failed to initialize. Verify @genkit-ai/core & @genkit-ai/google-genai are installed and versions match."
    );
  }
}

let aiInstance = null;
async function getAI() {
  if (!aiInstance) aiInstance = await initGenkit();
  return aiInstance;
}

async function generateResponse(prompt) {
  if (!prompt) throw new Error("Prompt required");
  const ai = await getAI();
  const result = await ai.generate({
    model: "googleai/gemini-1.5-flash-latest",
    prompt,
  });
  return result.text ? result.text() : JSON.stringify(result);
}

module.exports = { generateResponse };
