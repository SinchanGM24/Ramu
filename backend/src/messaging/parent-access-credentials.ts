import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

type ParentAccessCredentials = {
  pin: string;
  token: string;
};

function encryptionKey() {
  const configuredKey = process.env.PARENT_ACCESS_CREDENTIAL_KEY;

  if (!configuredKey && process.env.NODE_ENV === "production") {
    throw new Error("Kunci enkripsi akses wali belum dikonfigurasi");
  }

  return createHash("sha256")
    .update(
      configuredKey ||
        process.env.DATABASE_URL ||
        "ramu-development-parent-access-credentials",
    )
    .digest();
}

export function encryptParentAccessCredentials(
  credentials: ParentAccessCredentials,
) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    initializationVector,
  );
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(credentials), "utf8"),
    cipher.final(),
  ]);

  return [
    initializationVector.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptParentAccessCredentials(value: string) {
  const [initializationVector, authenticationTag, encrypted] = value.split(".");
  if (!initializationVector || !authenticationTag || !encrypted) {
    throw new Error("Kredensial akses wali tidak dapat digunakan");
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(initializationVector, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(authenticationTag, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const credentials = JSON.parse(decrypted) as Partial<ParentAccessCredentials>;

    if (typeof credentials.token !== "string" || typeof credentials.pin !== "string") {
      throw new Error("Kredensial akses wali tidak dapat digunakan");
    }

    return { token: credentials.token, pin: credentials.pin };
  } catch {
    throw new Error("Kredensial akses wali tidak dapat digunakan");
  }
}
