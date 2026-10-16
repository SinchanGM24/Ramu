import { BadRequestException } from "@nestjs/common";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ImageValidationService } from "../src/files/image-validation.service";

describe("ImageValidationService", () => {
  const service = new ImageValidationService();

  it("rejects a file whose declared MIME type does not match its magic bytes", async () => {
    const png = await sharp({
      create: {
        width: 8,
        height: 8,
        channels: 3,
        background: "#ffffff",
      },
    })
      .png()
      .toBuffer();

    await expect(
      service.validateAndNormalize({
        body: png,
        declaredContentType: "image/jpeg",
        purpose: "SCHOOL_LOGO",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects malformed bytes even when the client claims that they are an image", async () => {
    await expect(
      service.validateAndNormalize({
        body: Buffer.from("bukan-file-gambar"),
        declaredContentType: "image/png",
        purpose: "PORTFOLIO",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("normalizes a valid portfolio image to a safe JPEG", async () => {
    const png = await sharp({
      create: {
        width: 20,
        height: 20,
        channels: 4,
        background: "#2f7d5a",
      },
    })
      .png()
      .toBuffer();

    const normalized = await service.validateAndNormalize({
      body: png,
      declaredContentType: "image/png",
      purpose: "PORTFOLIO",
    });

    expect(normalized.contentType).toBe("image/jpeg");
    expect(normalized.extension).toBe("jpg");
    expect(normalized.body.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });
});
