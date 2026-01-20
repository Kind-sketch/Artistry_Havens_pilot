
/**
 * ✅ Artistry Havens Firebase Backend
 * Handles: User creation, message processing with Genkit AI,
 * and HTTPS callable endpoints.
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const {
  onCall,
  onRequest,
  HttpsError,
} = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// 🌍 Set Global Options (Region: Delhi)
setGlobalOptions({ region: "asia-south2" });

// 🏗 Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: "artistry-havens-1-654483-678d5",
});

// 🔹 Firestore reference
const db = admin.firestore();
logger.info("✅ Connected to Firestore database: (default)");

/**
 * 🌐 Health Check Endpoint
 * Confirms backend + region + Firestore connection.
 */
exports.testBackend = onRequest((req, res) => {
  logger.info("testBackend function called!");
  res.status(200).json({
    message: "Firebase backend is running successfully!",
    database: "(default)",
    region: "asia-south2",
  });
});

/**
 * 👤 Trigger: When a new user document is created in Firestore.
 * Path: users/{userId}
 */
exports.onNewUserCreate = onDocumentCreated("users/{userId}", async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error("No data in onUserCreate event.");
    return null;
  }

  const userData = snap.data();
  const userId = event.params.userId;

  logger.info(`🧑‍💻 New user created: ${userId}`, userData);

  // Basic validation
  if (!userData.email || !userData.name || !userData.role) {
    logger.warn(`User ${userId} missing email, name, or role.`);
  }

  // Add createdAt if not set
  if (!userData.createdAt) {
    await snap.ref.set(
      { createdAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  return null;
});


const { createUserProfile } = require("./users/createProfile");
exports.createUserProfile = createUserProfile;

/**
 * 🔔 Trigger: When a new CustomizationRequest is created.
 * Path: /CustomizationRequest/{requestId}
 */
exports.onCustomizationRequestCreate = onDocumentCreated("CustomizationRequest/{requestId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const request = snap.data();
  const requestId = event.params.requestId;

  const category = request.category || request.style; // handle both naming conventions
  if (!category) {
    logger.warn(`CustomizationRequest ${requestId} missing category.`);
    return;
  }

  logger.info(`Processing CustomizationRequest ${requestId} for category: ${category}`);

  try {
    // Find artisans with matching craft
    const artisansSnap = await db.collection('users')
      .where('userType', '==', 'artisan')
      .where('crafts', 'array-contains', category)
      .get();

    if (artisansSnap.empty) {
      logger.info(`No artisans found for category: ${category}`);
      return;
    }

    const batch = db.batch();
    let count = 0;

    artisansSnap.forEach(doc => {
      const notifRef = doc.ref.collection('notifications').doc();
      batch.set(notifRef, {
        type: 'new_request',
        requestId: requestId,
        title: 'New Custom Opportunity',
        body: `A buyer is looking for a ${category} piece!`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        link: `/artisan/requests/${requestId}`
      });
      count++;
    });

    await batch.commit();
    logger.info(`Notification sent to ${count} artisans.`);

  } catch (error) {
    logger.error("Error sending notifications:", error);
  }
});
