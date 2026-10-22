import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const captureDirectory = join(root, "public", "captures", "main");
const artifactDirectory = join(root, "artifacts", "main-capture");
const viewport = { width: 1920, height: 1080 };
const captureScale = 2;

type Credentials = { email: string; password: string };
type Scene = {
  id: string;
  path: string;
  role: "public" | "admin" | "teacher" | "principal";
  ready?: (page: Page) => Promise<void>;
  action?: (page: Page) => Promise<void>;
};

function required(name: string) {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} wajib diisi. Lihat video/.env.capture.example.`);
  return value;
}

function optionalCredentials(prefix: string): Credentials | undefined {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email && !password) return undefined;
  if (!email || !password)
    throw new Error(
      `${prefix}_EMAIL dan ${prefix}_PASSWORD harus diisi bersama.`,
    );
  return { email, password };
}

function assertMainSource() {
  if (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    process.env.RAMU_VIDEO_SOURCE !== "main"
  ) {
    throw new Error(
      "Capture ditolak: set RAMU_VIDEO_SOURCE=main dan jangan aktifkan NEXT_PUBLIC_DEMO_MODE.",
    );
  }
}

async function waitForDesktop(page: Page, id: string) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    height: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    width: window.innerWidth,
  }));
  if (
    metrics.width !== 1920 ||
    metrics.height !== 1080 ||
    metrics.clientWidth < 1280
  ) {
    throw new Error(
      `${id}: layout desktop tidak aktif (${JSON.stringify(metrics)}).`,
    );
  }
  if (metrics.scrollWidth > metrics.clientWidth + 2) {
    throw new Error(
      `${id}: terdapat horizontal overflow pada viewport desktop.`,
    );
  }
}

async function login(
  context: BrowserContext,
  baseUrl: string,
  credentials: Credentials,
  apiUrl: string,
) {
  const page = await context.newPage();
  await page.goto(new URL("/login", baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Kata sandi").fill(credentials.password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/app\/dashboard/, { timeout: 20_000 });
  const session = await page.evaluate(
    async (url) => {
      const response = await fetch(`${url}/api/auth/session`, {
        credentials: "include",
      });
      return {
        ok: response.ok,
        value: response.ok ? await response.json() : null,
      };
    },
    apiUrl.replace(/\/$/, ""),
  );
  if (!session.ok || !session.value?.schoolId) {
    throw new Error(
      "Sesi aplikasi utama tidak dapat diverifikasi. Pastikan RAMU_VIDEO_API_URL menunjuk backend utama.",
    );
  }
  const expectedSchoolId = process.env.RAMU_VIDEO_SCHOOL_ID;
  if (expectedSchoolId && session.value.schoolId !== expectedSchoolId) {
    throw new Error(
      "Sesi tidak berada pada sekolah yang disetujui untuk produksi video.",
    );
  }
  return page;
}

async function captureScene(page: Page, baseUrl: string, scene: Scene) {
  await page.goto(new URL(scene.path, baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  await waitForDesktop(page, scene.id);
  if (scene.ready) await scene.ready(page);
  if (scene.action) await scene.action(page);
  await waitForDesktop(page, scene.id);
  await page.screenshot({
    path: join(captureDirectory, `${scene.id}.png`),
    animations: "disabled",
  });
  await page.screenshot({
    path: join(artifactDirectory, `${scene.id}.validation.png`),
    animations: "disabled",
  });
}

async function demonstrateAssessment(page: Page) {
  const choice = page
    .getByRole("radio", { name: /Mulai Berkembang|MB/i })
    .first();
  await choice.scrollIntoViewIfNeeded();
  if (process.env.RAMU_VIDEO_ALLOW_WRITE !== "true") return;
  if (await choice.isChecked()) return;
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        /\/api\/reports\/[^/]+\/assessments\//.test(response.url()) &&
        response.ok(),
      { timeout: 15_000 },
    ),
    choice.check(),
  ]);
}

async function prepareStudentEntry(page: Page) {
  await page.getByRole("button", { name: "Tambah murid" }).click();
  await page.getByPlaceholder("Nama lengkap murid").fill("Nadia Pertiwi");
  await page.getByPlaceholder("Nomor induk (opsional)").fill("TK-061");
  await page.locator('select[name="classGroupId"]').selectOption({ index: 1 });
  await page.locator('select[name="gender"]').selectOption("FEMALE");
}

async function waitForReportWorkspace(page: Page) {
  await page
    .getByText("Memuat ruang kerja raport...", { exact: true })
    .waitFor({ state: "hidden", timeout: 30_000 });
  await page.getByText("Editor raport", { exact: true }).waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function showNarrative(page: Page) {
  await page
    .getByText("Narasi perkembangan", { exact: true })
    .first()
    .scrollIntoViewIfNeeded();
}

async function showLandingFlow(page: Page) {
  const heading = page.getByRole("heading", {
    name: "Dari catatan kelas menjadi raport yang bermakna.",
  });
  await heading.waitFor({ state: "visible", timeout: 20_000 });
  await heading.scrollIntoViewIfNeeded();
}

async function waitForReviewQueue(page: Page) {
  await page
    .getByRole("heading", { level: 1, name: "Tinjauan raport" })
    .waitFor({ state: "visible", timeout: 20_000 });
  await page
    .getByRole("button", { name: "Detail" })
    .first()
    .waitFor({ state: "visible", timeout: 30_000 });
}

async function openReviewDetail(page: Page) {
  await page.getByRole("button", { name: "Detail" }).first().click();
  await page
    .getByRole("heading", { name: /^Tinjau / })
    .waitFor({ state: "visible", timeout: 15_000 });
}

async function demonstrateNarrative(page: Page) {
  if (process.env.RAMU_VIDEO_ALLOW_WRITE !== "true") return;
  await page
    .locator("button:not(:disabled)", { hasText: "Buat draf dari nilai" })
    .first()
    .click();
  const replacement = page.getByRole("button", {
    name: "Ganti dengan draf baru",
  });
  if (await replacement.isVisible()) await replacement.click();
  await page
    .getByText("Draf memakai nilai indikator dan tetap dapat diedit guru.")
    .first()
    .waitFor({ timeout: 15_000 });
}

async function verifyParentReport(
  browser: Browser,
  parentUrl: string,
  pin: string,
) {
  // Akses wali tidak boleh mewarisi cookie staf. Ini juga membuktikan bahwa
  // laporan benar-benar dapat dibuka hanya dengan tautan dan PIN.
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: captureScale,
    viewport,
  });
  const page = await context.newPage();
  try {
    await page.goto(parentUrl, { waitUntil: "networkidle" });
    await waitForDesktop(page, "parent-pin");
    await page.screenshot({
      path: join(captureDirectory, "parent-pin.png"),
      animations: "disabled",
    });
    await page.getByPlaceholder("PIN enam digit").fill(pin);
    await page.getByRole("button", { name: "Buka raport" }).click();
    await page.getByLabel("Unduh PDF").waitFor({ timeout: 20_000 });
    if (await page.getByText("PIN atau tautan tidak valid.").isVisible()) {
      throw new Error("Akses wali ditolak setelah verifikasi PIN.");
    }
    await waitForDesktop(page, "parent-report");
    await page.screenshot({
      path: join(captureDirectory, "parent-report.png"),
      animations: "disabled",
    });
    await page.screenshot({
      path: join(artifactDirectory, "parent-report.validation.png"),
      animations: "disabled",
    });
  } finally {
    await context.close();
  }
}

async function main() {
  assertMainSource();
  const baseUrl = required("RAMU_VIDEO_BASE_URL");
  const apiUrl = required("RAMU_VIDEO_API_URL");
  const reportId = required("RAMU_VIDEO_REPORT_ID");
  const deliveryReportId =
    process.env.RAMU_VIDEO_DELIVERY_REPORT_ID || reportId;
  const admin =
    optionalCredentials("RAMU_VIDEO_ADMIN") ??
    requiredCredentials("RAMU_VIDEO");
  const teacher = optionalCredentials("RAMU_VIDEO_TEACHER") ?? admin;
  const principal = optionalCredentials("RAMU_VIDEO_PRINCIPAL") ?? admin;
  await Promise.all([
    mkdir(captureDirectory, { recursive: true }),
    mkdir(artifactDirectory, { recursive: true }),
  ]);

  const browser = await chromium.launch({ headless: true });
  try {
    const pages = new Map<string, Page>();
    const publicContext = await browser.newContext({
      colorScheme: "light",
      deviceScaleFactor: captureScale,
      viewport,
    });
    pages.set("public", await publicContext.newPage());
    for (const [role, credentials] of [
      ["admin", admin],
      ["teacher", teacher],
      ["principal", principal],
    ] as const) {
      const context = await browser.newContext({
        colorScheme: "light",
        deviceScaleFactor: captureScale,
        viewport,
      });
      pages.set(role, await login(context, baseUrl, credentials, apiUrl));
    }
    const scenes: Scene[] = [
      {
        id: "landing",
        path: "/",
        role: "public",
        ready: async (page) => {
          await page
            .getByRole("heading", {
              level: 1,
              name: "Raport yang tumbuh bersama anak.",
            })
            .waitFor({ state: "visible" });
        },
      },
      {
        id: "landing-flow",
        path: "/#cara-kerja",
        role: "public",
        action: showLandingFlow,
      },
      { id: "dashboard", path: "/app/dashboard", role: "admin" },
      { id: "semester", path: "/app/academic", role: "admin" },
      { id: "classes", path: "/app/academic", role: "admin" },
      {
        id: "students",
        path: "/app/academic/students",
        role: "admin",
        action: prepareStudentEntry,
      },
      {
        id: "assessment",
        path: `/app/reports/${reportId}`,
        role: "teacher",
        ready: waitForReportWorkspace,
        action: demonstrateAssessment,
      },
      {
        id: "narrative",
        path: `/app/reports/${reportId}`,
        role: "teacher",
        ready: waitForReportWorkspace,
        action: async (page) => {
          await showNarrative(page);
          await demonstrateNarrative(page);
        },
      },
      {
        id: "review",
        path: "/app/reports/review",
        role: "principal",
        ready: waitForReviewQueue,
        action: openReviewDetail,
      },
      { id: "publish", path: "/app/reports/publication", role: "admin" },
      {
        id: "delivery",
        path: `/app/reports/${deliveryReportId}/deliveries`,
        role: "admin",
      },
    ];
    const requestedSceneIds = new Set(
      (process.env.RAMU_VIDEO_CAPTURE_SCENES || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    );
    const selectedScenes = requestedSceneIds.size
      ? scenes.filter((scene) => requestedSceneIds.has(scene.id))
      : scenes;
    if (
      requestedSceneIds.size &&
      selectedScenes.length !== requestedSceneIds.size
    )
      throw new Error(
        "RAMU_VIDEO_CAPTURE_SCENES memuat scene yang tidak dikenal.",
      );
    for (const scene of selectedScenes)
      await captureScene(pages.get(scene.role)!, baseUrl, scene);
    if (!requestedSceneIds.size) {
      await verifyParentReport(
        browser,
        required("RAMU_VIDEO_PARENT_URL"),
        required("RAMU_VIDEO_PARENT_PIN"),
      );
      await writeFile(
        join(captureDirectory, "manifest.json"),
        JSON.stringify(
          {
            source: "main",
            viewport,
            deviceScaleFactor: captureScale,
            reportId,
            deliveryReportId,
            capturedAt: new Date().toISOString(),
            scenes: [
              ...scenes.map((scene) => scene.id),
              "parent-pin",
              "parent-report",
            ],
          },
          null,
          2,
        ),
      );
    }
    console.log(
      "Capture aplikasi utama selesai. Tidak ada WhatsApp, approval, atau publication yang dijalankan.",
    );
  } finally {
    await browser.close();
  }
}

function requiredCredentials(prefix: string): Credentials {
  return {
    email: required(`${prefix}_EMAIL`),
    password: required(`${prefix}_PASSWORD`),
  };
}

void main();
