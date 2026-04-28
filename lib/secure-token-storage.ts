import "server-only";

import { getStore } from "@netlify/blobs";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_TOKEN_STORE_PATH = path.join(process.cwd(), ".data", "strava-oauth.json");
const BLOB_STORE_NAME = "private-strava-oauth";
const BLOB_TOKEN_KEY = "token-state";

type EncryptedPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
};

function getStorageMode() {
  return process.env.STRAVA_TOKEN_STORAGE ?? (process.env.NETLIFY ? "netlify-blobs" : "local-file");
}

export function getTokenStorageMetadata() {
  const mode = getStorageMode();

  return {
    mode,
    encrypted: mode === "netlify-blobs" || Boolean(process.env.TOKEN_ENCRYPTION_KEY),
  };
}

function getEncryptionKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    if (getStorageMode() === "netlify-blobs") {
      throw new Error("Missing TOKEN_ENCRYPTION_KEY for encrypted Netlify token storage.");
    }

    return null;
  }

  return createHash("sha256").update(secret).digest();
}

function encryptString(plaintext: string) {
  const key = getEncryptionKey();

  if (!key) {
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const payload: EncryptedPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
  };

  return JSON.stringify(payload);
}

function decryptString(payload: string) {
  const parsed = JSON.parse(payload) as Partial<EncryptedPayload>;

  if (
    parsed.v !== 1 ||
    parsed.alg !== "aes-256-gcm" ||
    !parsed.iv ||
    !parsed.tag ||
    !parsed.ciphertext
  ) {
    return payload;
  }

  const key = getEncryptionKey();

  if (!key) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to decrypt stored Strava tokens.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(parsed.iv, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(parsed.tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(parsed.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

async function readLocalTokenState() {
  try {
    return await readFile(LOCAL_TOKEN_STORE_PATH, "utf8");
  } catch {
    return null;
  }
}

async function writeLocalTokenState(payload: string) {
  await mkdir(path.dirname(LOCAL_TOKEN_STORE_PATH), { recursive: true });
  await writeFile(LOCAL_TOKEN_STORE_PATH, payload, "utf8");
}

async function deleteLocalTokenState() {
  await rm(LOCAL_TOKEN_STORE_PATH, { force: true });
}

async function readBlobTokenState() {
  const store = getStore(BLOB_STORE_NAME);
  return store.get(BLOB_TOKEN_KEY, { type: "text" });
}

async function writeBlobTokenState(payload: string) {
  const store = getStore(BLOB_STORE_NAME);
  await store.set(BLOB_TOKEN_KEY, payload);
}

async function deleteBlobTokenState() {
  const store = getStore(BLOB_STORE_NAME);
  await store.delete(BLOB_TOKEN_KEY);
}

export async function readTokenState<T>() {
  const rawPayload =
    getStorageMode() === "netlify-blobs"
      ? await readBlobTokenState()
      : await readLocalTokenState();

  if (!rawPayload) {
    return null;
  }

  return JSON.parse(decryptString(rawPayload)) as T;
}

export async function writeTokenState<T>(state: T) {
  const payload = encryptString(JSON.stringify(state));

  if (getStorageMode() === "netlify-blobs") {
    await writeBlobTokenState(payload);
    return;
  }

  await writeLocalTokenState(payload);
}

export async function deleteTokenState() {
  if (getStorageMode() === "netlify-blobs") {
    await deleteBlobTokenState();
    return;
  }

  await deleteLocalTokenState();
}
