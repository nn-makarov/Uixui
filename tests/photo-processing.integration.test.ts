import assert from "node:assert/strict"
import test from "node:test"
import sharp from "sharp"
import {
  MAX_INPUT_WIDTH,
  MAX_OUTPUT_DIMENSION,
  PhotoProcessingError,
  processUploadedPhoto,
} from "@/lib/images/photo-processing"

async function sourceImage(format: "jpeg" | "png" | "webp", width = 320, height = 240) {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 90, g: 120, b: 160 },
    },
  })
  if (format === "jpeg") return image.jpeg().toBuffer()
  if (format === "png") return image.png().toBuffer()
  return image.webp().toBuffer()
}

test("JPEG, PNG and WebP are decoded and re-encoded", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const processed = await processUploadedPhoto(await sourceImage(format))
    const metadata = await sharp(processed.buffer).metadata()

    assert.equal(metadata.format, format)
    assert.equal(processed.mimeType, `image/${format}`)
    assert.ok(processed.size > 0)
    assert.ok((metadata.width ?? 0) > 0)
    assert.ok((metadata.height ?? 0) > 0)
  }
})

test("oversized dimensions are resized and EXIF/GPS metadata is removed", async () => {
  const input = await sharp({
    create: {
      width: MAX_OUTPUT_DIMENSION + 800,
      height: 80,
      channels: 3,
      background: { r: 20, g: 40, b: 60 },
    },
  })
    .jpeg()
    .withMetadata({
      exif: {
        IFD0: {
          Copyright: "stage4d-private",
          GPSLatitudeRef: "N",
          GPSLatitude: "55/1 45/1 0/1",
        },
      },
    })
    .toBuffer()
  const originalMetadata = await sharp(input).metadata()
  assert.ok(originalMetadata.exif)

  const processed = await processUploadedPhoto(input)
  const metadata = await sharp(processed.buffer).metadata()

  assert.ok((metadata.width ?? 0) <= MAX_OUTPUT_DIMENSION)
  assert.equal(metadata.exif, undefined)
})

test("fake and corrupted image files are rejected", async () => {
  const fakeJpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02, 0x03, 0x04])
  const fakePng = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(32, 0x41),
  ])

  await assert.rejects(processUploadedPhoto(fakeJpeg), PhotoProcessingError)
  await assert.rejects(processUploadedPhoto(fakePng), PhotoProcessingError)
})

test("images wider than the server limit are rejected", async () => {
  const tooWide = await sharp({
    create: {
      width: MAX_INPUT_WIDTH + 1,
      height: 1,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  }).png().toBuffer()

  await assert.rejects(processUploadedPhoto(tooWide), PhotoProcessingError)
})
