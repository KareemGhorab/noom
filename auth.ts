import { mergeGuestCartIntoUserCart } from "@/features/cart/merge";
import { claimGuestOrders } from "@/features/orders/actions";
import { db } from "@/lib/db";
import {
    accounts,
    sessions,
    users,
    verificationTokens,
} from "@/lib/db/schema";
import { env } from "@/lib/env";
import { loginSchema, magicLinkConsumeSchema } from "@/lib/validations/auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

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
      const parsed = magicLinkConsumeSchema.safeParse({
        email: credentials?.email,
        token: credentials?.token,
      });

      if (!parsed.success) {
        return null;
      }

      const { email, token } = parsed.data;

      // Claim the token in one statement. A read followed by a delete lets two
      // concurrent requests both pass the check before either deletes.
      const [claimed] = await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, email),
            eq(verificationTokens.token, token),
          ),
        )
        .returning();

      if (!claimed || claimed.expires < new Date()) {
        return null;
      }

      // The account is created here rather than when the link is requested, so
      // an unverified address cannot be squatted by a stranger.
      const [user] = await db
        .insert(users)
        .values({
          email,
          name: email.split("@")[0],
          emailVerified: new Date(),
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { emailVerified: new Date() },
        })
        .returning();

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

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
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
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  pages: {
    // Unprefixed so the locale proxy can route the shopper to their own locale
    // instead of forcing English.
    signIn: "/auth/login",
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
        // Claim first: the cart merge clears the guest cookie that identifies
        // the orders to claim.
        await claimGuestOrders(user.id);
        await mergeGuestCartIntoUserCart(user.id);
      }
      return true;
    },
  },
  // Assumes the app only ever runs behind a proxy that sets a trustworthy
  // Host/X-Forwarded-Host. Exposing it directly to the internet would let a
  // spoofed Host header rewrite callback URLs.
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
