import type { NextAuthConfig } from "next-auth"

export default {
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Провайдеры добавим в основном конфиге
} satisfies NextAuthConfig
