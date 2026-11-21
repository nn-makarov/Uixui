export function normalizeLoginEmail(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim().toLowerCase()
  return normalized && normalized.length <= 254 ? normalized : null
}

export async function extractLoginEmail(req: Request) {
  try {
    const form = await req.clone().formData()
    const values = form.getAll("email")
    return normalizeLoginEmail(values.at(-1))
  } catch {
    return null
  }
}
