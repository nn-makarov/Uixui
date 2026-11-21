export type ResolvedTheme = "light" | "dark"

export function getNextTheme(resolvedTheme: string | undefined): ResolvedTheme {
  return resolvedTheme === "dark" ? "light" : "dark"
}
