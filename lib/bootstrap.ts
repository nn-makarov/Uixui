export class BootstrapConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "BootstrapConfigError"
  }
}

type BootstrapInput = {
  email?: string
  password?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EXAMPLE_DOMAINS = new Set(["example.com", "example.org", "example.net"])
const EXAMPLE_TLDS = [".test", ".invalid", ".example"]

export function resolveBootstrapAdmin(
  input: BootstrapInput,
  nodeEnv = process.env.NODE_ENV,
) {
  const email = input.email?.trim().toLowerCase()
  const password = input.password

  if (!email || !password) {
    throw new BootstrapConfigError(
      "Задайте BOOTSTRAP_ADMIN_EMAIL и BOOTSTRAP_ADMIN_PASSWORD перед запуском seed",
    )
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    throw new BootstrapConfigError("BOOTSTRAP_ADMIN_EMAIL содержит некорректный email")
  }
  if (password.length < 12) {
    throw new BootstrapConfigError("BOOTSTRAP_ADMIN_PASSWORD должен содержать минимум 12 символов")
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    throw new BootstrapConfigError("BOOTSTRAP_ADMIN_PASSWORD не должен превышать 72 байта UTF-8")
  }
  if (password.toLowerCase() === email) {
    throw new BootstrapConfigError("BOOTSTRAP_ADMIN_PASSWORD не должен совпадать с email")
  }

  const characterGroups = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  if (characterGroups < 3) {
    throw new BootstrapConfigError(
      "BOOTSTRAP_ADMIN_PASSWORD должен содержать минимум три группы: строчные, заглавные, цифры и символы",
    )
  }

  if (nodeEnv === "production") {
    const domain = email.split("@")[1]
    if (EXAMPLE_DOMAINS.has(domain) || EXAMPLE_TLDS.some((tld) => email.endsWith(tld))) {
      throw new BootstrapConfigError(
        "В production запрещён bootstrap-администратор с тестовым email-доменом",
      )
    }
  }

  return { email, password }
}
