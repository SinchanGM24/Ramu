export type ObjectStorageConfig = {
  accessKeyId: string;
  bucket: string;
  endpoint?: string;
  region: string;
  secretAccessKey: string;
};

const localDefaults = {
  accessKeyId: "ramu_minio",
  bucket: "ramu-private",
  region: "us-east-1",
  secretAccessKey: "ramu_minio_password",
} as const;

export function getObjectStorageConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ObjectStorageConfig {
  const isProduction = environment.NODE_ENV === "production";
  const config = {
    accessKeyId:
      environment.OBJECT_STORAGE_ACCESS_KEY || localDefaults.accessKeyId,
    bucket: environment.OBJECT_STORAGE_BUCKET || localDefaults.bucket,
    endpoint: environment.OBJECT_STORAGE_ENDPOINT,
    region: environment.OBJECT_STORAGE_REGION || localDefaults.region,
    secretAccessKey:
      environment.OBJECT_STORAGE_SECRET_KEY || localDefaults.secretAccessKey,
  };

  if (!isProduction) return config;

  const missing = [
    ["OBJECT_STORAGE_BUCKET", environment.OBJECT_STORAGE_BUCKET],
    ["OBJECT_STORAGE_REGION", environment.OBJECT_STORAGE_REGION],
    ["OBJECT_STORAGE_ACCESS_KEY", environment.OBJECT_STORAGE_ACCESS_KEY],
    ["OBJECT_STORAGE_SECRET_KEY", environment.OBJECT_STORAGE_SECRET_KEY],
  ].filter(([, value]) => !value);
  if (missing.length) {
    throw new Error(
      `Konfigurasi object storage production belum lengkap: ${missing
        .map(([name]) => name)
        .join(", ")}`,
    );
  }

  const usesLocalCredentials =
    config.accessKeyId === localDefaults.accessKeyId ||
    config.secretAccessKey === localDefaults.secretAccessKey;
  const usesLocalEndpoint =
    config.endpoint?.includes("localhost") ||
    config.endpoint?.includes("127.0.0.1") ||
    config.endpoint?.includes(":9010");
  if (usesLocalCredentials || usesLocalEndpoint) {
    throw new Error(
      "Konfigurasi object storage production tidak boleh memakai kredensial atau endpoint MinIO lokal.",
    );
  }

  return config;
}
