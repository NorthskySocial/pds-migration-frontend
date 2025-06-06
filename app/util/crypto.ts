import { Secp256k1Keypair } from "@atproto/crypto";
import { generatePassphrase } from "niceware";

export const toBase64 = (buffer: Uint8Array<ArrayBuffer>) =>
  btoa(String.fromCharCode(...buffer));

export const encryptKey = async (keypair: Secp256k1Keypair) => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passphrase = generatePassphrase(16).join(" "); // generate 8-word passphrase
  const exported = await keypair.export();

  const PBKDF2 = async (
    iterations: number,
    length: number,
    hash: string,
    algorithm = "AES-CBC"
  ) => {
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt.buffer,
        iterations,
        hash,
      },
      keyMaterial,
      { name: algorithm, length },
      false, // we don't need to export our key!!!
      ["encrypt", "decrypt"]
    );
  };

  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const plain_text = exported.buffer as ArrayBuffer;
  const key = await PBKDF2(100000, 256, "SHA-256");

  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    plain_text
  );

  return { encrypted, passphrase, exported, salt: toBase64(salt) };
};
