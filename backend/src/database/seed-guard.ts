export function assertSeedAllowed(
  environment: NodeJS.ProcessEnv = process.env,
) {
  if (environment.NODE_ENV === "production") {
    throw new Error("Seed akun demo tidak boleh dijalankan di production");
  }
}
