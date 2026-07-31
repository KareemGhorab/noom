import { relations, sql } from "drizzle-orm";
import {
    boolean,
    check,
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    primaryKey,
    text,
    timestamp,
    unique,
    uuid,
} from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum("order_status", ["placed", "cancelled"]);

export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);

/**
 * Shopper-facing settlement currencies. Prices are stored per currency on
 * `variant_price` — there is no FX conversion at read time (see ADR 0013).
 */
export const currencies = pgTable("currency", {
  code: text("code").primaryKey(),
  minorUnits: integer("minor_units").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  currency: text("currency").references(() => currencies.code, {
    onDelete: "set null",
  }),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const categories = pgTable("category", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const products = pgTable(
  "product",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en").notNull(),
    descriptionAr: text("description_ar").notNull(),
    // Price and stock live on `product_variant` / `variant_price` — every
    // product has at least one variant (a "default" with empty `optionValues`
    // when it doesn't otherwise vary), so the product row itself owns neither.
    imageUrl: text("image_url").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("product_category_id_idx").on(table.categoryId),
    // Search is unindexed ILIKE across these four columns; pg_trgm GIN
    // indexes let `%term%` matches use an index scan instead of a full
    // table scan. The `pg_trgm` extension itself is created in the
    // migration SQL, since Drizzle's schema builder has no primitive for it.
    index("product_title_en_trgm_idx").using(
      "gin",
      sql`${table.titleEn} gin_trgm_ops`,
    ),
    index("product_title_ar_trgm_idx").using(
      "gin",
      sql`${table.titleAr} gin_trgm_ops`,
    ),
    index("product_description_en_trgm_idx").using(
      "gin",
      sql`${table.descriptionEn} gin_trgm_ops`,
    ),
    index("product_description_ar_trgm_idx").using(
      "gin",
      sql`${table.descriptionAr} gin_trgm_ops`,
    ),
  ],
);

/** e.g. { productId, key: "size", labelEn: "Size", labelAr: "المقاس", position: 0 } */
export const productOptions = pgTable(
  "product_option",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    labelEn: text("label_en").notNull(),
    labelAr: text("label_ar").notNull(),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    unique("product_option_product_id_key_unique").on(
      table.productId,
      table.key,
    ),
    index("product_option_product_id_idx").on(table.productId),
  ],
);

/**
 * The variant owns SKU and stock. Shopper-facing prices live on
 * `variant_price` per currency; `priceCents` here is the seed/default AED
 * amount kept for backfill convenience, not the read path (see ADR 0013).
 * `optionValues` is a flat `{ [optionKey]: value }` map — e.g. `{ size: "M" }`
 * — kept empty for products with no options (see ADR 0012).
 */
export const productVariants = pgTable(
  "product_variant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    optionValues: jsonb("option_values")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("product_variant_product_id_option_values_unique").on(
      table.productId,
      table.optionValues,
    ),
    index("product_variant_product_id_idx").on(table.productId),
    check("product_variant_stock_non_negative", sql`${table.stock} >= 0`),
  ],
);

/** Per-currency price for a variant. Absence means unpurchasable in that currency. */
export const variantPrices = pgTable(
  "variant_price",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code, { onDelete: "restrict" }),
    priceCents: integer("price_cents").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.variantId, table.currency] }),
    index("variant_price_currency_idx").on(table.currency),
  ],
);

export const carts = pgTable(
  "cart",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    guestId: text("guest_id"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("cart_user_id_unique").on(table.userId),
    unique("cart_guest_id_unique").on(table.guestId),
    check(
      "cart_single_owner",
      sql`num_nonnulls(${table.userId}, ${table.guestId}) = 1`,
    ),
  ],
);

export const cartItems = pgTable(
  "cart_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
  },
  (table) => [
    unique("cart_item_cart_id_variant_id_unique").on(
      table.cartId,
      table.variantId,
    ),
    index("cart_item_variant_id_idx").on(table.variantId),
    check("cart_item_quantity_positive", sql`${table.quantity} > 0`),
  ],
);

export const orders = pgTable(
  "order",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    // Set for anonymous checkouts so the order can be claimed when the shopper
    // later signs in.
    guestId: text("guest_id"),
    status: orderStatusEnum("status").notNull().default("placed"),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    addressLine: text("address_line").notNull(),
    city: text("city").notNull(),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("AED"),
    email: text("email"),
    discountCode: text("discount_code"),
    discountCents: integer("discount_cents"),
    cancelledAt: timestamp("cancelled_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("order_user_id_idx").on(table.userId),
    index("order_guest_id_idx").on(table.guestId),
    index("order_created_at_idx").on(table.createdAt),
  ],
);

/**
 * Shopper-entered promo codes. Fixed amounts are currency-specific; percent
 * codes ignore `currency`. Usage is incremented atomically at checkout.
 */
export const discounts = pgTable(
  "discount",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    type: discountTypeEnum("type").notNull(),
    valueCents: integer("value_cents"),
    percentInt: integer("percent_int"),
    minSubtotalCents: integer("min_subtotal_cents"),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    usageCap: integer("usage_cap"),
    usageCount: integer("usage_count").notNull().default(0),
    currency: text("currency").references(() => currencies.code, {
      onDelete: "restrict",
    }),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "discount_percent_or_fixed",
      sql`(${table.type} = 'percent' and ${table.percentInt} is not null and ${table.percentInt} > 0 and ${table.percentInt} <= 100)
          or (${table.type} = 'fixed' and ${table.valueCents} is not null and ${table.valueCents} > 0)`,
    ),
    check(
      "discount_usage_non_negative",
      sql`${table.usageCount} >= 0`,
    ),
  ],
);

/** Guest or signed-in email alert when a sold-out variant is restocked. */
export const stockSubscriptions = pgTable(
  "stock_subscription",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    notifiedAt: timestamp("notified_at", { mode: "date" }),
  },
  (table) => [
    unique("stock_subscription_email_variant_id_unique").on(
      table.email,
      table.variantId,
    ),
    index("stock_subscription_variant_id_idx").on(table.variantId),
  ],
);

export const orderItems = pgTable(
  "order_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    // A snapshot, not a live lookup, so a line still reads correctly in order
    // history after its variant (or the option labels behind it) changes.
    optionSummaryEn: text("option_summary_en"),
    optionSummaryAr: text("option_summary_ar"),
    priceCents: integer("price_cents").notNull(),
    // Settled currency at checkout — kept on the line so history stays
    // self-describing even if the parent order row is ever reshaped.
    currency: text("currency").notNull().default("AED"),
    quantity: integer("quantity").notNull(),
    imageUrl: text("image_url").notNull(),
  },
  (table) => [
    index("order_item_order_id_idx").on(table.orderId),
    index("order_item_variant_id_idx").on(table.variantId),
  ],
);

export const reviews = pgTable(
  "review",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    title: text("title"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("review_user_id_product_id_unique").on(table.userId, table.productId),
    index("review_product_id_idx").on(table.productId),
    check(
      "review_rating_range",
      sql`${table.rating} >= 1 and ${table.rating} <= 5`,
    ),
  ],
);

/** One helpfulness upvote per shopper per review; delete to toggle off. */
export const reviewVotes = pgTable(
  "review_vote",
  {
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.reviewId, table.userId] }),
    index("review_vote_review_id_idx").on(table.reviewId),
  ],
);

/**
 * Soft report only — no moderation queue in the demo. Unique pair so a
 * shopper cannot spam the same review.
 */
export const reviewReports = pgTable(
  "review_report",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    unique("review_report_review_id_user_id_unique").on(
      table.reviewId,
      table.userId,
    ),
    index("review_report_review_id_idx").on(table.reviewId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_token",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identifier: text("identifier").notNull(),
    // Only a bcrypt hash is stored, so a database leak does not hand over
    // working reset links.
    tokenHash: text("token_hash").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("password_reset_token_identifier_idx").on(table.identifier)],
);

export const addresses = pgTable(
  "address",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    addressLine: text("address_line").notNull(),
    city: text("city").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("address_user_id_idx").on(table.userId)],
);

export const rateLimits = pgTable(
  "rate_limit",
  {
    key: text("key").notNull(),
    windowStart: timestamp("window_start", { mode: "date" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.key, table.windowStart] })],
);

export const wishlistItems = pgTable(
  "wishlist_item",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.productId] }),
    index("wishlist_item_product_id_idx").on(table.productId),
  ],
);

export const currenciesRelations = relations(currencies, ({ many }) => ({
  variantPrices: many(variantPrices),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  preferredCurrency: one(currencies, {
    fields: [users.currency],
    references: [currencies.code],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  carts: many(carts),
  orders: many(orders),
  wishlistItems: many(wishlistItems),
  addresses: many(addresses),
  reviews: many(reviews),
  reviewVotes: many(reviewVotes),
  reviewReports: many(reviewReports),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  votes: many(reviewVotes),
  reports: many(reviewReports),
}));

export const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewVotes.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewVotes.userId],
    references: [users.id],
  }),
}));

export const reviewReportsRelations = relations(reviewReports, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewReports.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewReports.userId],
    references: [users.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  options: many(productOptions),
  variants: many(productVariants),
  wishlistItems: many(wishlistItems),
  reviews: many(reviews),
}));

export const productOptionsRelations = relations(productOptions, ({ one }) => ({
  product: one(products, {
    fields: [productOptions.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    prices: many(variantPrices),
    cartItems: many(cartItems),
    orderItems: many(orderItems),
    stockSubscriptions: many(stockSubscriptions),
  }),
);

export const stockSubscriptionsRelations = relations(
  stockSubscriptions,
  ({ one }) => ({
    variant: one(productVariants, {
      fields: [stockSubscriptions.variantId],
      references: [productVariants.id],
    }),
  }),
);

export const variantPricesRelations = relations(variantPrices, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantPrices.variantId],
    references: [productVariants.id],
  }),
  currencyRow: one(currencies, {
    fields: [variantPrices.currency],
    references: [currencies.code],
  }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, { fields: [carts.userId], references: [users.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));
