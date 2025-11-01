
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

/* eslint-disable no-undef */
const { processPrompt } = require("./ai/genkit.js");
/* eslint-enable no-undef */

// 🌍 Global region
setGlobalOptions({ region: "asia-south2" });

// 🏗 Initialize Firebase Admin for the correct project
admin.initializeApp({
  projectId: "artistry-havens-1-654483-678d5",
});

// ✅ Connect to the default Firestore database
const db = admin.firestore();
logger.info("✅ Connected to Firestore database: (default)");

// 🌐 Simple health check endpoint
exports.testBackend = onRequest((req, res) => {
  logger.info("testBackend function called!");
  res.status(200).send({
    message: "Firebase backend is running successfully!",
    database: "(default)",
    region: "asia-south2",
  });
});

/**
 * ✅ Firestore trigger when a new user document is created.
 */
exports.onUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error("No data associated with the onUserCreate event.");
    return;
  }
  const userData = snap.data();
  const userId = event.params.userId;

  logger.log(`🧑‍💻 New user created with ID: ${userId}`, userData);

  // Basic validation
  if (!userData.email || !userData.name || !userData.role) {
    logger.error(`User ${userId} is missing email, name, or role.`);
    // Optionally, you could send a notification or perform a cleanup action.
  }

  // Add createdAt if not set
  if (!userData.createdAt) {
    await snap.ref.set(
        {createdAt: admin.firestore.FieldValue.serverTimestamp()},
        {merge: true},
    );
  }
});

/**
 * ✅ Firestore trigger when a new message document is created.
 */
exports.onMessageCreate = onDocumentCreated(
    "messages/{messageId}",
    async (event) => {
      const snap = event.data;
      if (!snap) {
        logger.log("No data associated with the onMessageCreate event.");
        return;
      }
      const messageData = snap.data();

      if (!messageData || !messageData.text) {
        logger.log(
            "Message document has no text, skipping AI processing.",
        );
        return;
      }

      try {
        const aiResponseText = await processPrompt(messageData.text);

        await db.collection("aiRequests").add({
          userId: messageData.senderId || "unknown",
          prompt: messageData.text,
          response: aiResponseText,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.log(
            "🤖 AI response stored successfully for message:",
            event.params.messageId,
        );
      } catch (error) {
        logger.error("❌ Error processing message with Genkit AI:", error);
      }
    },
);

/**
 * ✅ HTTPS Callable function for AI responses.
 */
exports.generateAIResponse = onCall(async (request) => {
  const context = request.auth;
  const data = request.data;

  if (!context || !context.uid) {
    throw new onCall.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { prompt } = data;
  const userId = context.uid;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    throw new onCall.HttpsError("invalid-argument", "'prompt' must be a non-empty string.");
  }

  try {
    const aiResponseText = await processPrompt(prompt);

    await db.collection("aiRequests").add({
      userId,
      prompt,
      response: aiResponseText,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { response: aiResponseText };
  } catch (error) {
    logger.error("❌ Error in generateAIResponse:", error);
    throw new onCall.HttpsError("internal", "Failed to generate AI response.");
  }
});
