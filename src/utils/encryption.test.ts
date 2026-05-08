import { describe, expect, it } from "vitest";
import { encryptWithPublicKey } from "./encryption";

// A valid RSA public key in PEM format (2048-bit) for testing
// Generated with Node.js crypto.generateKeyPairSync
const validPublicKeyPem = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqWkeynxt+9WEI88BSdxX
5cCNHv8Z1A88wB1QGu9Qxv4q0waJ82/4DvZ8mhi9e7zOuepiuAPSpcZIefdxuUab
VpioiV8LvFJAW1mnnRESNycQ5gMfI/piI5BaeHyWhEw7t/8coUrEsIst99v3GW7z
kaATt6w7hA0HDQiFPcXwaUD5QfiGbcfxc7hyaMjIXgjL83Ff6XzVVpiFc7e5Up9e
vbqiHVaJ+CZB6X429gQCJc18AST6cscfFvGDknMWJ7f/7JpcNbAR3Ww32z+MjVwG
FiFHDnq0XqBiacU8fk3NdlY8TqjxR8e9GaTTgx+UMvfR2itgEuKGfd2oImkMxC4L
5QIDAQAB
-----END PUBLIC KEY-----`;

describe("encryptWithPublicKey", () => {
  it("returns a hex-encoded string when given valid PEM key and data", async () => {
    const ciphertext = await encryptWithPublicKey(validPublicKeyPem, "testpassword");
    expect(typeof ciphertext).toBe("string");
    expect(ciphertext.length).toBeGreaterThan(0);
    // Hex pattern check (only 0-9 and a-f)
    expect(/^[0-9a-f]+$/i.test(ciphertext)).toBe(true);
  });

  it("returns an even-length hex string (valid hex format)", async () => {
    const ciphertext = await encryptWithPublicKey(validPublicKeyPem, "testpassword");
    // Each byte is 2 hex characters, so length must be even
    expect(ciphertext.length % 2).toBe(0);
  });

  it("produces ciphertext of expected length for 2048-bit RSA (256 bytes = 512 hex chars)", async () => {
    const ciphertext = await encryptWithPublicKey(validPublicKeyPem, "testpassword");
    // RSA-OAEP with 2048-bit key produces 256-byte ciphertext
    // 256 bytes = 512 hex characters
    expect(ciphertext.length).toBe(512);
  });

  it("produces different ciphertext for different data (RSA-OAEP is probabilistic)", async () => {
    const cipher1 = await encryptWithPublicKey(validPublicKeyPem, "password1");
    const cipher2 = await encryptWithPublicKey(validPublicKeyPem, "password2");
    expect(cipher1).not.toBe(cipher2);
  });

  it("produces different ciphertext each time for the same data (OAEP uses random salt)", async () => {
    const cipher1 = await encryptWithPublicKey(validPublicKeyPem, "samepassword");
    const cipher2 = await encryptWithPublicKey(validPublicKeyPem, "samepassword");
    expect(cipher1).not.toBe(cipher2);
  });

  it("throws an error when given an invalid PEM key", async () => {
    await expect(
      encryptWithPublicKey("invalid-pem-key", "testpassword")
    ).rejects.toThrow();
  });

  it("throws an error when given empty data", async () => {
    await expect(
      encryptWithPublicKey(validPublicKeyPem, "")
    ).rejects.toThrow();
  });
});