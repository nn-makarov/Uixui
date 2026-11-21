export const SAME_ORIGIN_REQUEST_HEADER = "x-cleaning-same-origin"
export const SAME_ORIGIN_REQUEST_VALUE = "1"

export function hasSameOrigin(req: Request) {
  if (req.headers.get(SAME_ORIGIN_REQUEST_HEADER) === SAME_ORIGIN_REQUEST_VALUE) {
    return true
  }

  const origin = req.headers.get("origin")
  if (!origin) {
    return req.headers.get("sec-fetch-site") === "same-origin"
  }
  try {
    const publicHost = req.headers.get("host")
    return Boolean(publicHost && new URL(origin).host === publicHost)
  } catch {
    return false
  }
}
