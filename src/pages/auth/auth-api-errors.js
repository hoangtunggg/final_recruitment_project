/**
 * Backend auth endpoints answer with fixed English messages. Map the known ones to keys under
 * auth:apiErrors so Vietnamese users read Vietnamese; unknown messages fall back to a generic
 * translated text (never to raw English).
 */
const KNOWN_MESSAGES = {
  "Invalid email or password": "invalidCredentials",
  "Your account has been blocked. Please contact support.": "blocked",
  "User with this email already exists": "emailExists",
  "Please provide a valid email address": "invalidEmail",
  "Password must be at least 6 characters long": "passwordShort",
  "Name, email, and password are required": "requiredFields",
  "Email and password are required": "requiredFields",
  "Server error during login": "serverError",
  "Server error during registration": "serverError",
};

/**
 * @param t        translation function bound to the "auth" namespace
 * @param message  raw message returned by the API (may be empty)
 * @param fallback key under auth:apiErrors used when the message is unknown/empty
 */
export const translateAuthError = (t, message, fallback) => {
  const key = KNOWN_MESSAGES[message] || fallback;
  return t(`apiErrors.${key}`);
};
