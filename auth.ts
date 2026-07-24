import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations/auth";
import { mergeGuestCartIntoUserCart } from "@/features/cart/merge";

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const user = await db.query.users.findFirst({
        where: eq(users.email, parsed.data.email),
      });

      if (!user?.passwordHash) {
        return null;
      }

      const valid = await bcrypt.compare(
        parsed.data.password,
        user.passwordHash,
      );

      if (!valid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
  Credentials({
    id: "magic-link",
    name: "magic-link",
    credentials: {
      email: { label: "Email", type: "email" },
      token: { label: "Token", type: "text" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const token = credentials?.token;

      if (typeof email !== "string" || typeof token !== "string") {
        return null;
      }

      const record = await db.query.verificationTokens.findFirst({
        where: (vt, { and, eq }) =>
          and(eq(vt.identifier, email), eq(vt.token, token)),
      });

      if (!record || record.expires < new Date()) {
        return null;
      }

      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, email),
            eq(verificationTokens.token, token),
          ),
        );

      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/en/auth/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      } else if (session.user && "id" in token && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        await mergeGuestCartIntoUserCart(user.id);
      }
      return true;
    },
  },
  trustHost: true,
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
