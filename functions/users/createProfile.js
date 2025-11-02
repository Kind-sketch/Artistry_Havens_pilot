/* eslint-disable */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Ensure admin is initialized once globally
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Callable function: createUserProfile
 * Allows authenticated users to create their profile document securely.
 */
exports.createUserProfile = functions.https.onCall(async (data, context) => {
  // ✅ 1. Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to create a profile."
    );
  }

  const uid = context.auth.uid;
  const { role, profileData } = data;

  // ✅ 2. Validate role
  const allowedRoles = ["artisan", "buyer", "sponsor"];
  if (!allowedRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid role '${role}'. Allowed roles: artisan, buyer, sponsor.`
    );
  }

  // ✅ 3. Define Firestore collection
  const collectionName = `${role}s`; // artisans / buyers / sponsors
  const docRef = db.collection(collectionName).doc(uid);

  // ✅ 4. Check if profile already exists
  const existing = await docRef.get();
  if (existing.exists) {
    throw new functions.https.HttpsError(
      "already-exists",
      "Profile already exists for this user."
    );
  }

  // ✅ 5. Save profile
  const profileToSave = {
    ...profileData,
    uid,
    role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(profileToSave);

  // ✅ 6. Return success
  return {
    success: true,
    message: `Profile created successfully for ${role}`,
    profile: profileToSave,
  };
});
