import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const adminUser = process.env.AUTH_USER;
const adminPass = process.env.AUTH_PASS;

if (typeof process !== "undefined" && process.env.NEXT_PHASE !== "phase-production-build") {
  if (!adminUser || !adminPass) {
    throw new Error("FATAL: AUTH_USER and AUTH_PASS environment variables must be defined.");
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Felhasználónév", type: "text" },
        password: { label: "Jelszó", type: "password" },
      },
      async authorize(credentials) {
        if (!adminUser || !adminPass) {
          throw new Error("AUTH_USER and AUTH_PASS environment variables are not configured.");
        }

        if (
          credentials?.username === adminUser &&
          credentials?.password === adminPass
        ) {
          return { id: "1", name: "Technician", email: adminUser };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isStatusPage = nextUrl.pathname.startsWith("/status");
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");
      const isWebhook = nextUrl.pathname.startsWith("/api/webhooks");

      if (isApiAuth || isStatusPage || isWebhook) return true;
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
});
