import bcrypt from "bcryptjs";
import postgres from "postgres";

/**
 * Specs that need state the seed does not create (a reset token, a throwaway
 * account) talk to Postgres directly rather than reaching into app modules,
 * which would pull the Next.js runtime into the Playwright process.
 */
async function withSql<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function upsertPasswordUser(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  await withSql(async (sql) => {
    await sql`
      insert into "user" (id, name, email, "emailVerified", password_hash)
      values (${crypto.randomUUID()}, 'Reset Tester', ${email}, now(), ${passwordHash})
      on conflict (email) do update set password_hash = ${passwordHash}
    `;
  });
}

/**
 * Mirrors `requestPasswordResetAction`: only the bcrypt hash is stored, so the
 * raw token has to be minted here to be usable in a URL.
 */
export async function issuePasswordResetToken(email: string) {
  const token = crypto.randomUUID();
  const tokenHash = await bcrypt.hash(token, 10);
  const expires = new Date(Date.now() + 30 * 60 * 1000);

  await withSql(async (sql) => {
    await sql`delete from password_reset_token where identifier = ${email}`;
    await sql`
      insert into password_reset_token (identifier, token_hash, expires)
      values (${email}, ${tokenHash}, ${expires})
    `;
  });

  return token;
}

/**
 * Mirrors the `verify-email:` identifier prefix used by
 * `sendVerificationEmail` in `features/auth/actions.ts`.
 */
export async function getEmailVerificationToken(
  email: string,
): Promise<string | null> {
  return withSql(async (sql) => {
    const rows = await sql<{ token: string }[]>`
      select token from "verificationToken"
      where identifier = ${`verify-email:${email}`}
      order by expires desc
      limit 1
    `;
    return rows[0]?.token ?? null;
  });
}

export async function deleteReviewsBy(email: string) {
  await withSql(async (sql) => {
    await sql`
      delete from "review"
      where user_id in (select id from "user" where email = ${email})
    `;
  });
}

export async function deleteReviewVotesBy(email: string) {
  await withSql(async (sql) => {
    await sql`
      delete from review_vote
      where user_id in (select id from "user" where email = ${email})
    `;
  });
}

export async function deleteAddressesLabelled(email: string, label: string) {
  await withSql(async (sql) => {
    await sql`
      delete from "address"
      where label = ${label}
        and user_id in (select id from "user" where email = ${email})
    `;
  });
}

/** Empties a shopper's cart so parallel specs cannot leave stray lines behind. */
export async function clearCartForUser(email: string) {
  await withSql(async (sql) => {
    await sql`
      delete from cart_item
      where cart_id in (
        select c.id from cart c
        inner join "user" u on u.id = c.user_id
        where u.email = ${email}
      )
    `;
  });
}

/**
 * Bulk-inserts throwaway orders directly in Postgres so pagination specs
 * don't have to run `count` real checkouts through the UI.
 */
export async function seedOrdersForUser(email: string, count: number) {
  await withSql(async (sql) => {
    const [user] = await sql<{ id: string }[]>`
      select id from "user" where email = ${email}
    `;
    if (!user) {
      throw new Error(`No user found for ${email}`);
    }

    for (let i = 0; i < count; i += 1) {
      await sql`
        insert into "order"
          (user_id, customer_name, phone, address_line, city, total_cents, currency, email)
        values
          (${user.id}, 'Pagination Tester', '0000000000', 'Test Street', 'Test City', 1000, 'AED', ${email})
      `;
    }
  });
}

/** Wishlists every seeded product for a user so pagination has enough rows. */
export async function wishlistAllProductsForUser(email: string) {
  await withSql(async (sql) => {
    const [user] = await sql<{ id: string }[]>`
      select id from "user" where email = ${email}
    `;
    if (!user) {
      throw new Error(`No user found for ${email}`);
    }

    await sql`
      insert into wishlist_item (user_id, product_id)
      select ${user.id}, id from product
      on conflict do nothing
    `;
  });
}

/** Wishlists a single product by slug for add-to-cart specs. */
export async function wishlistProductForUser(email: string, slug: string) {
  await withSql(async (sql) => {
    const [user] = await sql<{ id: string }[]>`
      select id from "user" where email = ${email}
    `;
    if (!user) {
      throw new Error(`No user found for ${email}`);
    }

    await sql`
      insert into wishlist_item (user_id, product_id)
      select ${user.id}, id from product where slug = ${slug}
      on conflict do nothing
    `;
  });
}

export async function deleteUserByEmail(email: string) {
  await withSql(async (sql) => {
    await sql`delete from "user" where email = ${email}`;
  });
}

export async function userExists(email: string): Promise<boolean> {
  return withSql(async (sql) => {
    const rows = await sql<{ id: string }[]>`
      select id from "user" where email = ${email} limit 1
    `;
    return rows.length > 0;
  });
}
