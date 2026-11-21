export const BUSINESS_TIME_ZONE = "Europe/Moscow"

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export type EditableBusinessDateTime = {
  date: string
  time: string
}

function getZonedParts(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function getTimeZoneOffsetMs(instantMs: number, timeZone = BUSINESS_TIME_ZONE) {
  const zoned = getZonedParts(new Date(instantMs), timeZone)
  const zonedAsUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  )
  return zonedAsUtc - instantMs
}

export function getEditableBusinessDateTime(
  utcIso: string | null | undefined,
  timeZone = BUSINESS_TIME_ZONE,
): EditableBusinessDateTime {
  if (!utcIso) return { date: "", time: "" }

  const date = new Date(utcIso)
  if (Number.isNaN(date.getTime())) return { date: "", time: "" }

  const parts = getZonedParts(date, timeZone)
  const year = String(parts.year).padStart(4, "0")
  const month = String(parts.month).padStart(2, "0")
  const day = String(parts.day).padStart(2, "0")
  const hour = String(parts.hour).padStart(2, "0")
  const minute = String(parts.minute).padStart(2, "0")

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  }
}

export function businessDateTimeToUtcIso(
  dateValue: string,
  timeValue: string,
  timeZone = BUSINESS_TIME_ZONE,
) {
  const dateMatch = DATE_RE.exec(dateValue)
  const timeMatch = TIME_RE.exec(timeValue)
  if (!dateMatch || !timeMatch) throw new Error("Некорректная дата или время")

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
  const firstGuess = wallClockAsUtc - getTimeZoneOffsetMs(wallClockAsUtc, timeZone)
  const corrected = wallClockAsUtc - getTimeZoneOffsetMs(firstGuess, timeZone)

  const check = getZonedParts(new Date(corrected), timeZone)
  if (
    check.year !== year
    || check.month !== month
    || check.day !== day
    || check.hour !== hour
    || check.minute !== minute
  ) {
    throw new Error("Дата и время не существуют в выбранном часовом поясе")
  }

  return new Date(corrected).toISOString()
}

export function formatBusinessDateTime(
  utcIso: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
    timeStyle: "short",
  },
  timeZone = BUSINESS_TIME_ZONE,
) {
  if (!utcIso) return ""

  const date = new Date(utcIso)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("ru-RU", {
    ...options,
    timeZone,
  }).format(date)
}

export function resolveBusinessDateTimeForSave(
  originalUtcIso: string | null,
  dateValue: string,
  timeValue: string,
  timeZone = BUSINESS_TIME_ZONE,
) {
  if (!dateValue && !timeValue) return null
  if (!dateValue || !timeValue) throw new Error("Укажите и дату, и время")

  if (originalUtcIso) {
    const originalParts = getEditableBusinessDateTime(originalUtcIso, timeZone)
    if (originalParts.date === dateValue && originalParts.time === timeValue) {
      return originalUtcIso
    }
  }

  return businessDateTimeToUtcIso(dateValue, timeValue, timeZone)
}
