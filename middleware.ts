import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  if (req.nextUrl.pathname.startsWith("/admin") && req.nextUrl.pathname !== "/login") {
    if (!req.auth) {
      const loginUrl = new URL("/login", req.nextUrl.origin)
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.href)
      return Response.redirect(loginUrl)
    }
  }
})

export const config = {
  matcher: ["/admin/:path*"],
}
