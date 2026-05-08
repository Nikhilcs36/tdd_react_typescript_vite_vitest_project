import { API_ENDPOINTS } from "../services/apiEndpoints";

/**
 * Encrypts data using RSA-OAEP with SHA-256.
 * Uses the Web Crypto API (SubtleCrypto) available in modern browsers.
 *
 * @param publicKeyPem - The RSA public key in PEM format (including -----BEGIN PUBLIC KEY----- and -----END PUBLIC KEY-----)
 * @param data - The plaintext string to encrypt
 * @returns The encrypted data as a hex-encoded string
 * @throws If key import or encryption fails
 */
export async function encryptWithPublicKey(
  publicKeyPem: string,
  data: string
): Promise<string> {
  if (!data) {
    throw new Error("Data to encrypt cannot be empty");
  }

  // 1. Convert PEM string to ArrayBuffer (base64 decode between header/footer)
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = publicKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, ""); // Remove all whitespace (newlines, spaces, tabs)

  // Decode base64 to binary
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  // 2. Import the RSA public key using the Web Crypto API
  const publicKey = await crypto.subtle.importKey(
    "spki", // SubjectPublicKeyInfo format
    binaryDer.buffer,
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    false, // Not extractable
    ["encrypt"]
  );

  // 3. Encrypt the data
  const encodedData = new TextEncoder().encode(data);
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedData
  );

  // 4. Convert to hex string (backend expects hex format for bytes.fromhex())
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const hexCiphertext = Array.from(encryptedArray, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");

  return hexCiphertext;
}

/**
 * Fetches the RSA public key from the backend API.
 * @returns The PEM-encoded public key string
 * @throws If the fetch fails or the key is invalid
 */
export async function fetchPublicKey(): Promise<string> {
  const response = await fetch(API_ENDPOINTS.PUBLIC_KEY);
  if (!response.ok) {
    throw new Error(`Failed to fetch public key: ${response.status}`);
  }
  const data = await response.json();
  return data.public_key;
}