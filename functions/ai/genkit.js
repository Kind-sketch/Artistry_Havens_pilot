const { genkit, configureGenkit } = require("genkit");
const { googleAI } = require("@genkit-ai/google-genai");

// Initialize Genkit with the Google AI plugin
configureGenkit({
  plugins: [
    googleAI({
      // When deployed, Genkit will use Application Default Credentials.
      // No API key is needed in the production environment.
    }),
  ],
  logLevel: "debug", // Set to 'info' for production to reduce noise
  enableTracingAndMetrics: true,
});

/**
 * Processes a given text prompt using the Gemini 1.5 Flash model.
 * @param {string} promptText - The text input to send to the model.
 * @returns {Promise<string>} - The generated text response from the model.
 */
async function processPrompt(promptText) {
  const llmResponse = await genkit.generate({
    model: "googleai/gemini-1.5-flash-latest",
    prompt: promptText,
  });

  return llmResponse.text();
}

module.exports = { processPrompt };
