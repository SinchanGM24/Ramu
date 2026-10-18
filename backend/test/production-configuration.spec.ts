import { describe, expect, it } from "vitest";
import { assertSeedAllowed } from "../src/database/seed-guard";
import { getObjectStorageConfig } from "../src/files/object-storage-config";

describe("production configuration safeguards", () => {
  it("rejects demo seed execution in production", () => {
    expect(() => assertSeedAllowed({ NODE_ENV: "production" })).toThrow(
      "Seed akun demo tidak boleh dijalankan di production",
    );
    expect(() => assertSeedAllowed({ NODE_ENV: "development" })).not.toThrow();
  });

  it("requires explicit non-local object storage credentials in production", () => {
    expect(() => getObjectStorageConfig({ NODE_ENV: "production" })).toThrow(
      "Konfigurasi object storage production belum lengkap",
    );
    expect(() =>
      getObjectStorageConfig({
        NODE_ENV: "production",
        OBJECT_STORAGE_ACCESS_KEY: "ramu_minio",
        OBJECT_STORAGE_BUCKET: "ramu-private",
        OBJECT_STORAGE_ENDPOINT: "http://localhost:9010",
        OBJECT_STORAGE_REGION: "us-east-1",
        OBJECT_STORAGE_SECRET_KEY: "ramu_minio_password",
      }),
    ).toThrow("tidak boleh memakai kredensial atau endpoint MinIO lokal");
  });

  it("accepts an explicit production object storage configuration", () => {
    expect(
      getObjectStorageConfig({
        NODE_ENV: "production",
        OBJECT_STORAGE_ACCESS_KEY: "production-access-key",
        OBJECT_STORAGE_BUCKET: "ramu-production",
        OBJECT_STORAGE_ENDPOINT: "https://storage.example.test",
        OBJECT_STORAGE_REGION: "ap-southeast-1",
        OBJECT_STORAGE_SECRET_KEY: "production-secret-key",
      }),
    ).toEqual({
      accessKeyId: "production-access-key",
      bucket: "ramu-production",
      endpoint: "https://storage.example.test",
      region: "ap-southeast-1",
      secretAccessKey: "production-secret-key",
    });
  });
});
