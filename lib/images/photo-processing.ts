import sharp from "sharp"

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
export const MAX_STORED_BYTES = 8 * 1024 * 1024
export const MAX_FILES = 3
export const MAX_INPUT_WIDTH = 12_000
export const MAX_INPUT_HEIGHT = 12_000
export const MAX_INPUT_PIXELS = 50_000_000
export const MAX_OUTPUT_DIMENSION = 4096

const FORMATS = {
  jpeg: { mimeType: "image/jpeg", extension: "jpg" },
  png: { mimeType: "image/png", extension: "png" },
  webp: { mimeType: "image/webp", extension: "webp" },
} as const

export const ALLOWED_PHOTO_MIME_TYPES = new Set<string>(
  Object.values(FORMATS).map((format) => format.mimeType),
)

type SupportedFormat = keyof typeof FORMATS

export class PhotoProcessingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PhotoProcessingError"
  }
}

export async function processUploadedPhoto(input: Uint8Array) {
  if (input.byteLength <= 0 || input.byteLength > MAX_UPLOAD_BYTES) {
    throw new PhotoProcessingError("Размер фотографии должен быть не более 5 МБ")
  }

  const pipeline = sharp(input, {
    animated: false,
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
    pages: 1,
    sequentialRead: true,
  })

  let metadata
  try {
    metadata = await pipeline.metadata()
  } catch {
    throw new PhotoProcessingError("Не удалось прочитать изображение")
  }

  const format = metadata.format as SupportedFormat | undefined
  if (!format || !(format in FORMATS)) {
    throw new PhotoProcessingError("Допустимы только JPEG, PNG и WebP")
  }
  if (metadata.pages && metadata.pages > 1) {
    throw new PhotoProcessingError("Анимированные изображения не поддерживаются")
  }

  const width = metadata.width ?? 0
  const height = metadata.height ?? 0
  if (
    width <= 0
    || height <= 0
    || width > MAX_INPUT_WIDTH
    || height > MAX_INPUT_HEIGHT
    || width * height > MAX_INPUT_PIXELS
  ) {
    throw new PhotoProcessingError("Слишком большое разрешение изображения")
  }

  let outputPipeline = pipeline
    .rotate()
    .resize({
      width: MAX_OUTPUT_DIMENSION,
      height: MAX_OUTPUT_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })

  if (format === "jpeg") {
    outputPipeline = outputPipeline.jpeg({ quality: 85, progressive: true, mozjpeg: true })
  } else if (format === "png") {
    outputPipeline = outputPipeline.png({ compressionLevel: 9, adaptiveFiltering: true })
  } else {
    outputPipeline = outputPipeline.webp({ quality: 85, effort: 4 })
  }

  try {
    const { data, info } = await outputPipeline.toBuffer({ resolveWithObject: true })
    if (data.byteLength > MAX_STORED_BYTES) {
      throw new PhotoProcessingError("Обработанное изображение слишком большое")
    }
    return {
      buffer: data,
      mimeType: FORMATS[format].mimeType,
      extension: FORMATS[format].extension,
      width: info.width,
      height: info.height,
      size: data.byteLength,
    }
  } catch (error) {
    if (error instanceof PhotoProcessingError) throw error
    throw new PhotoProcessingError("Не удалось безопасно обработать изображение")
  }
}
