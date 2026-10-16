import { BadRequestException, Injectable } from "@nestjs/common";
import sharp from "sharp";

type ImagePurpose = "SCHOOL_LOGO" | "PORTFOLIO";

type ImageLimits = {
  acceptedTypes: ReadonlySet<string>;
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
  maxPixels: number;
};

export type NormalizedImage = {
  body: Buffer;
  contentType: "image/jpeg";
  extension: "jpg";
};

const limitsByPurpose: Record<ImagePurpose, ImageLimits> = {
  SCHOOL_LOGO: {
    acceptedTypes: new Set(["image/jpeg", "image/png"]),
    maxBytes: 2 * 1024 * 1024,
    maxWidth: 2048,
    maxHeight: 2048,
    maxPixels: 4_000_000,
  },
  PORTFOLIO: {
    acceptedTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
    maxBytes: 5 * 1024 * 1024,
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixels: 12_000_000,
  },
};

function detectImageType(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  )
    return "image/jpeg";

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "image/webp";

  return null;
}

@Injectable()
export class ImageValidationService {
  async validateAndNormalize(input: {
    body: Buffer;
    declaredContentType: string;
    purpose: ImagePurpose;
  }): Promise<NormalizedImage> {
    const limits = limitsByPurpose[input.purpose];
    if (!input.body.length)
      throw new BadRequestException("File gambar tidak boleh kosong.");
    if (input.body.length > limits.maxBytes)
      throw new BadRequestException(
        input.purpose === "SCHOOL_LOGO"
          ? "Ukuran logo maksimal 2 MB."
          : "Ukuran foto portfolio maksimal 5 MB.",
      );

    const detectedType = detectImageType(input.body);
    if (!detectedType || !limits.acceptedTypes.has(detectedType))
      throw new BadRequestException(
        input.purpose === "SCHOOL_LOGO"
          ? "Pilih logo JPG atau PNG yang valid."
          : "Pilih foto JPG, PNG, atau WebP yang valid.",
      );
    if (input.declaredContentType.toLowerCase() !== detectedType)
      throw new BadRequestException(
        "Format file tidak sesuai dengan isi gambar yang diunggah.",
      );

    try {
      const source = sharp(input.body, {
        failOn: "error",
        limitInputPixels: limits.maxPixels,
        pages: 1,
      });
      const metadata = await source.metadata();
      if (!metadata.width || !metadata.height)
        throw new BadRequestException("Dimensi gambar tidak dapat dibaca.");
      if (
        metadata.width > limits.maxWidth ||
        metadata.height > limits.maxHeight ||
        metadata.width * metadata.height > limits.maxPixels
      )
        throw new BadRequestException(
          input.purpose === "SCHOOL_LOGO"
            ? "Dimensi logo terlalu besar. Maksimal 2048 × 2048 piksel."
            : "Dimensi foto portfolio terlalu besar. Maksimal 4096 × 4096 piksel.",
        );

      const normalized = await source
        .rotate()
        .resize({
          width: input.purpose === "SCHOOL_LOGO" ? 1600 : 2400,
          height: input.purpose === "SCHOOL_LOGO" ? 1600 : 2400,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ mozjpeg: true, progressive: true, quality: 88 })
        .toBuffer();

      return {
        body: normalized,
        contentType: "image/jpeg",
        extension: "jpg",
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("File gambar tidak dapat diproses.");
    }
  }
}
