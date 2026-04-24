import sodium from "libsodium-wrappers-sumo";

type Envelope = {
  nonce: string;
  ciphertext: string;
};

const BASE64 = sodium.base64_variants.ORIGINAL;

export async function encrypt(key: Uint8Array, plaintext: string): Promise<string> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const message = sodium.from_string(plaintext);
  const ciphertext = sodium.crypto_secretbox_easy(message, nonce, key);
  const envelope: Envelope = {
    nonce: sodium.to_base64(nonce, BASE64),
    ciphertext: sodium.to_base64(ciphertext, BASE64)
  };
  return JSON.stringify(envelope);
}

export async function decrypt(key: Uint8Array, envelope: string): Promise<string> {
  await sodium.ready;
  const parsed = JSON.parse(envelope) as Envelope;
  const nonce = sodium.from_base64(parsed.nonce, BASE64);
  const ciphertext = sodium.from_base64(parsed.ciphertext, BASE64);
  const plaintext = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
  return sodium.to_string(plaintext);
}
