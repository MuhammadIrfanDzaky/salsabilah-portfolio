import "server-only";

import sharp from "sharp";

/**
 * Cover-image intake (competency 22 — File & Media).
 *
 * The bucket already caps size and declared MIME type, but a declared type is
 * just a string the uploader chose. The real check is here: the bytes must
 * actually decode as a raster image, or nothing is uploaded.
 *
 * Re-encoding is what strips EXIF — which matters beyond tidiness, because
 * phone photos carry GPS coordinates, and Salsabilah's field notes would
 * otherwise publish where the photo was taken.
 */

export const MAX_COVER_BYTES = 5 * 1024 * 1024; // must match the bucket limit
export const COVER_MAX_WIDTH = 1600;
export const COVER_MIN_WIDTH = 600;

/** SVG is absent on purpose: it can carry <script> and is not a raster image. */
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "avif"]);

/** Guards against decompression bombs: a small file can declare a huge canvas. */
const MAX_INPUT_PIXELS = 40_000_000;

export type CoverProcessingError =
  | "too-large"
  | "not-an-image"
  | "unsupported-format"
  | "too-small";

/**
 * Angka terukur dari berkas yang ditolak.
 *
 * Ada supaya pesan di layar bisa menyebut **berapa** alih-alih sekadar
 * "terlalu besar" atau "terlalu kecil". Tanpa ini, satu-satunya cara pengguna
 * tahu berkasnya meleset seberapa jauh adalah menebak lalu mencoba lagi, dan
 * batas yang tidak disebutkan angkanya praktis tidak bisa dipatuhi.
 */
export type CoverErrorDetail = {
  /** Ukuran berkas masuk, byte. Diisi pada `too-large`. */
  bytes?: number;
  /** Lebar gambar masuk, piksel. Diisi pada `too-small`. */
  width?: number;
  /** Format hasil deteksi isi berkas — bukan ekstensi. Diisi pada `unsupported-format`. */
  format?: string;
};

export class CoverError extends Error {
  constructor(
    readonly reason: CoverProcessingError,
    readonly detail: CoverErrorDetail = {},
  ) {
    super(reason);
    this.name = "CoverError";
  }
}

export type ProcessedCover = {
  data: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  bytes: number;
};

/**
 * Validates and normalises an uploaded cover. Throws `CoverError` with a
 * machine-readable reason so the route handler can map it to a message in
 * whichever locale the dashboard is showing.
 */
export async function processCoverImage(input: ArrayBuffer | Buffer): Promise<ProcessedCover> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  if (buffer.byteLength > MAX_COVER_BYTES) {
    throw new CoverError("too-large", { bytes: buffer.byteLength });
  }

  const pipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, animated: false });

  // Not decodable — whatever the Content-Type header claimed.
  const metadata = await pipeline.metadata().catch(() => null);
  if (!metadata) {
    throw new CoverError("not-an-image");
  }

  if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
    throw new CoverError("unsupported-format", { format: metadata.format });
  }
  if (!metadata.width || !metadata.height) {
    throw new CoverError("not-an-image");
  }
  if (metadata.width < COVER_MIN_WIDTH) {
    throw new CoverError("too-small", { width: metadata.width });
  }

  const data = await pipeline
    // .rotate() with no argument applies the EXIF orientation flag *before* the
    // metadata is dropped; without it, portrait phone photos come out sideways.
    .rotate()
    .resize({ width: COVER_MAX_WIDTH, withoutEnlargement: true })
    // sharp drops all metadata unless asked to keep it, so this re-encode is
    // also the EXIF/GPS strip.
    .webp({ quality: 82 })
    .toBuffer();

  const out = await sharp(data).metadata();

  return {
    data,
    contentType: "image/webp",
    width: out.width ?? 0,
    height: out.height ?? 0,
    bytes: data.byteLength,
  };
}

/**
 * Storage path for a cover. The random segment means replacing a cover never
 * collides with the CDN's cached copy of the old one.
 */
export function buildCoverPath(postSlug: string): string {
  return `${postSlug}/${crypto.randomUUID()}.webp`;
}

/**
 * Path untuk gambar di dalam isi artikel.
 *
 * Sengaja **tidak** memakai slug seperti cover. Gambar isi disisipkan saat
 * mengetik, dan pada artikel baru belum ada slug apa pun untuk dipakai —
 * menunggu artikel tersimpan lebih dulu adalah persis friksi yang baru saja
 * dihapus dari alur cover. Awalan `isi/` memisahkannya dari cover sehingga
 * keduanya bisa dibedakan sekilas saat menelusuri bucket.
 */
export function buildBodyImagePath(): string {
  return `isi/${crypto.randomUUID()}.webp`;
}

/** Public URL of a stored cover — the bucket is public, so no signing needed. */
export function coverPublicUrl(supabaseUrl: string, coverPath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/post-covers/${coverPath}`;
}
