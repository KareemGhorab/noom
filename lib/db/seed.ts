// Must precede any import that reads process.env at module scope.
import "dotenv/config";

import { db } from "@/lib/db";
import {
  addresses,
  categories,
  currencies,
  discounts,
  orderItems,
  orders,
  productOptions,
  products,
  productVariants,
  rateLimits,
  reviews,
  reviewVotes,
  users,
  variantPrices,
  wishlistItems,
} from "@/lib/db/schema";
import { aedCentsToUsdCents } from "@/lib/domain/pricing";
import bcrypt from "bcryptjs";
import { and, eq, sql } from "drizzle-orm";

const categorySeed = [
  { slug: "electronics", nameEn: "Electronics", nameAr: "إلكترونيات" },
  { slug: "home", nameEn: "Home", nameAr: "المنزل" },
  { slug: "fashion", nameEn: "Fashion", nameAr: "أزياء" },
  { slug: "books", nameEn: "Books", nameAr: "كتب" },
];

const productSeed = [
  {
    slug: "wireless-earbuds",
    titleEn: "Wireless Earbuds",
    titleAr: "سماعات لاسلكية",
    descriptionEn: "Compact earbuds with a doodle-soft case and all-day battery.",
    descriptionAr: "سماعات مدمجة مع حافظة ناعمة وبطارية طويلة.",
    priceCents: 14900,
    stock: 25,
    imageUrl: "https://picsum.photos/seed/noom-earbuds/800/800",
    categorySlug: "electronics",
  },
  {
    slug: "smart-lamp",
    titleEn: "Smart Desk Lamp",
    titleAr: "مصباح مكتب ذكي",
    descriptionEn: "Warm adjustable light for late-night sketch sessions.",
    descriptionAr: "إضاءة دافئة قابلة للتعديل لجلسات الرسم الليلية.",
    priceCents: 8900,
    stock: 18,
    imageUrl: "https://picsum.photos/seed/noom-lamp/800/800",
    categorySlug: "home",
  },
  {
    slug: "canvas-tote",
    titleEn: "Canvas Tote Bag",
    titleAr: "حقيبة قماش",
    descriptionEn: "Roomy tote with hand-drawn Noom patch.",
    descriptionAr: "حقيبة واسعة مع شعار نوم المرسوم يدوياً.",
    priceCents: 4500,
    stock: 40,
    imageUrl: "https://picsum.photos/seed/noom-tote/800/800",
    categorySlug: "fashion",
  },
  {
    slug: "sketch-journal",
    titleEn: "Sketch Journal",
    titleAr: "دفتر رسم",
    descriptionEn: "Thick paper, blob corners, and plenty of blank pages.",
    descriptionAr: "ورق سميك وحواف فقاعية وصفحات فارغة كثيرة.",
    priceCents: 3200,
    stock: 55,
    imageUrl: "https://picsum.photos/seed/noom-journal/800/800",
    categorySlug: "books",
  },
  {
    slug: "ceramic-mug",
    titleEn: "Ceramic Mug",
    titleAr: "كوب سيراميك",
    descriptionEn: "Morning coffee mug with a wobbly doodle handle.",
    descriptionAr: "كوب قهوة صباحي بمقبض مرسوم بخط يدوي.",
    priceCents: 2800,
    stock: 60,
    imageUrl: "https://picsum.photos/seed/noom-mug/800/800",
    categorySlug: "home",
  },
  {
    slug: "bluetooth-speaker",
    titleEn: "Bluetooth Speaker",
    titleAr: "مكبر صوت بلوتوث",
    descriptionEn: "Pocket speaker with surprisingly big sound.",
    descriptionAr: "مكبر صوت صغير بصوت كبير.",
    priceCents: 9900,
    stock: 22,
    imageUrl: "https://picsum.photos/seed/noom-speaker/800/800",
    categorySlug: "electronics",
  },
  {
    slug: "linen-scarf",
    titleEn: "Linen Scarf",
    titleAr: "وشاح كتان",
    descriptionEn: "Lightweight scarf in a soft neutral palette.",
    descriptionAr: "وشاح خفيف بألوان محايدة ناعمة.",
    priceCents: 5600,
    stock: 30,
    imageUrl: "https://picsum.photos/seed/noom-scarf/800/800",
    categorySlug: "fashion",
  },
  {
    slug: "design-almanac",
    titleEn: "Design Almanac",
    titleAr: "مذكرات التصميم",
    descriptionEn: "A playful annual of shapes, colors, and layouts.",
    descriptionAr: "دليل سنوي مرح للأشكال والألوان والتخطيطات.",
    priceCents: 4100,
    stock: 35,
    imageUrl: "https://picsum.photos/seed/noom-almanac/800/800",
    categorySlug: "books",
  },
  {
    slug: "mini-projector",
    titleEn: "Mini Projector",
    titleAr: "جهاز عرض صغير",
    descriptionEn: "Movie nights anywhere with a palm-sized projector.",
    descriptionAr: "ليالي أفلام في أي مكان بجهاز عرض صغير.",
    priceCents: 25900,
    stock: 12,
    imageUrl: "https://picsum.photos/seed/noom-projector/800/800",
    categorySlug: "electronics",
  },
  {
    slug: "throw-blanket",
    titleEn: "Throw Blanket",
    titleAr: "بطانية صغيرة",
    descriptionEn: "Cozy blanket with sketchy stitched edges.",
    descriptionAr: "بطانية مريحة بحواف ممزقة مرسومة.",
    priceCents: 7200,
    stock: 28,
    imageUrl: "https://picsum.photos/seed/noom-blanket/800/800",
    categorySlug: "home",
  },
  {
    slug: "studio-cap",
    titleEn: "Studio Cap",
    titleAr: "قبعة استوديو",
    descriptionEn: "Adjustable cap for creative field trips.",
    descriptionAr: "قبعة قابلة للتعديل للرحلات الإبداعية.",
    priceCents: 3900,
    stock: 45,
    imageUrl: "https://picsum.photos/seed/noom-cap/800/800",
    categorySlug: "fashion",
  },
  {
    slug: "color-pencil-set",
    titleEn: "Color Pencil Set",
    titleAr: "مجموعة أقلام تلوين",
    descriptionEn: "24 pencils in a reusable doodle tin.",
    descriptionAr: "٢٤ قلمًا في علبة قابلة لإعادة الاستخدام.",
    priceCents: 3600,
    stock: 50,
    imageUrl: "https://picsum.photos/seed/noom-pencils/800/800",
    categorySlug: "books",
  },
];

export const REVIEWABLE_DEMO_SLUG = "bluetooth-speaker";

const reviewSeed = [
  {
    email: "amina@noom.app",
    name: "Amina",
    productSlug: "wireless-earbuds",
    rating: 5,
    title: "Tiny case, huge battery",
    body: "Wore these across two flights and still had charge left. The case fits in a jeans pocket.",
  },
  {
    email: "omar@noom.app",
    name: "Omar",
    productSlug: "wireless-earbuds",
    rating: 4,
    title: "Great, once they fit",
    body: "Took me a while to find the right ear tips, but the sound is warm and the fit is stable now.",
  },
  {
    email: "amina@noom.app",
    name: "Amina",
    productSlug: "smart-lamp",
    rating: 4,
    title: "Perfect for late sketching",
    body: "The warm setting is easy on the eyes at midnight and the arm holds its position.",
  },
  {
    email: "omar@noom.app",
    name: "Omar",
    productSlug: "ceramic-mug",
    rating: 5,
    title: "My default mug now",
    body: "Holds heat well and the wobbly handle is far more comfortable than it looks.",
  },
];

async function ensureVariantPrices(variantId: string, aedCents: number) {
  await db
    .insert(variantPrices)
    .values([
      { variantId, currency: "AED", priceCents: aedCents },
      {
        variantId,
        currency: "USD",
        priceCents: aedCentsToUsdCents(aedCents),
      },
    ])
    .onConflictDoUpdate({
      target: [variantPrices.variantId, variantPrices.currency],
      set: { priceCents: sql`excluded.price_cents` },
    });
}

async function ensureDefaultVariant(
  product: typeof products.$inferSelect,
  priceCents: number,
  stock: number,
) {
  const existing = await db.query.productVariants.findFirst({
    where: eq(productVariants.productId, product.id),
  });

  if (existing) {
    // Re-seed restores catalog stock so repeated `pnpm db:seed` / e2e setup
    // runs do not leave SKUs sold out from prior demo checkouts.
    await db
      .update(productVariants)
      .set({ stock, priceCents })
      .where(eq(productVariants.id, existing.id));
    await ensureVariantPrices(existing.id, priceCents);
    return existing;
  }

  const [variant] = await db
    .insert(productVariants)
    .values({
      productId: product.id,
      sku: product.slug,
      priceCents,
      stock,
      optionValues: {},
    })
    .returning();

  await ensureVariantPrices(variant.id, priceCents);
  return variant;
}

async function seedCanvasToteVariants(productId: string) {
  await db
    .insert(productOptions)
    .values({
      productId,
      key: "size",
      labelEn: "Size",
      labelAr: "المقاس",
      position: 0,
    })
    .onConflictDoNothing({
      target: [productOptions.productId, productOptions.key],
    });

  const sizes = [
    { size: "S", sku: "canvas-tote-s", priceCents: 4200, stock: 12 },
    { size: "M", sku: "canvas-tote-m", priceCents: 4500, stock: 16 },
    { size: "L", sku: "canvas-tote-l", priceCents: 4900, stock: 12 },
  ];

  for (const size of sizes) {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: size.sku,
        priceCents: size.priceCents,
        stock: size.stock,
        optionValues: { size: size.size },
      })
      .onConflictDoUpdate({
        target: productVariants.sku,
        set: {
          priceCents: size.priceCents,
          stock: size.stock,
        },
      })
      .returning();

    await ensureVariantPrices(variant.id, size.priceCents);
  }
}

async function seedLinenScarfVariants(productId: string) {
  await db
    .insert(productOptions)
    .values({
      productId,
      key: "color",
      labelEn: "Color",
      labelAr: "اللون",
      position: 0,
    })
    .onConflictDoNothing({
      target: [productOptions.productId, productOptions.key],
    });

  const colors = [
    { color: "Sand", sku: "linen-scarf-sand", priceCents: 5600, stock: 10 },
    { color: "Indigo", sku: "linen-scarf-indigo", priceCents: 5600, stock: 10 },
    { color: "Olive", sku: "linen-scarf-olive", priceCents: 5900, stock: 10 },
  ];

  for (const color of colors) {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: color.sku,
        priceCents: color.priceCents,
        stock: color.stock,
        optionValues: { color: color.color },
      })
      .onConflictDoUpdate({
        target: productVariants.sku,
        set: {
          priceCents: color.priceCents,
          stock: color.stock,
        },
      })
      .returning();

    await ensureVariantPrices(variant.id, color.priceCents);
  }
}

async function getDefaultVariantForProduct(productId: string) {
  const variants = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, productId),
  });

  return (
    variants.find(
      (variant) => Object.keys(variant.optionValues).length === 0,
    ) ?? variants[0]
  );
}

/**
 * Reviews are gated on a real purchase, so each seeded reviewer also gets the
 * matching order; otherwise the demo data would contradict the review rules
 * (and the verified-purchase badge would never light up).
 */
async function seedReviews() {
  for (const seedRow of reviewSeed) {
    const [reviewer] = await db
      .insert(users)
      .values({
        name: seedRow.name,
        email: seedRow.email,
        emailVerified: new Date(),
      })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: seedRow.name },
      })
      .returning();

    const product = await db.query.products.findFirst({
      where: eq(products.slug, seedRow.productSlug),
    });

    if (!product) continue;

    await ensurePurchase(reviewer.id, seedRow.name, seedRow.email, product);

    await db
      .insert(reviews)
      .values({
        userId: reviewer.id,
        productId: product.id,
        rating: seedRow.rating,
        title: seedRow.title,
        body: seedRow.body,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.productId],
        set: {
          rating: seedRow.rating,
          title: seedRow.title,
          body: seedRow.body,
        },
      });
  }

  await seedReviewVotes();
}

/** A couple of helpful votes so "Most helpful" sort is visibly different. */
async function seedReviewVotes() {
  const earbuds = await db.query.products.findFirst({
    where: eq(products.slug, "wireless-earbuds"),
    columns: { id: true },
  });
  if (!earbuds) return;

  const amina = await db.query.users.findFirst({
    where: eq(users.email, "amina@noom.app"),
    columns: { id: true },
  });
  const omar = await db.query.users.findFirst({
    where: eq(users.email, "omar@noom.app"),
    columns: { id: true },
  });
  if (!amina || !omar) return;

  const aminaReview = await db.query.reviews.findFirst({
    where: and(
      eq(reviews.productId, earbuds.id),
      eq(reviews.userId, amina.id),
    ),
    columns: { id: true },
  });
  if (!aminaReview) return;

  await db
    .insert(reviewVotes)
    .values({ reviewId: aminaReview.id, userId: omar.id })
    .onConflictDoNothing();
}

/**
 * The seed runs before every E2E pass, so a purchase is created at most once
 * per shopper and product.
 */
async function ensurePurchase(
  userId: string,
  customerName: string,
  email: string,
  product: typeof products.$inferSelect,
) {
  const variant = await getDefaultVariantForProduct(product.id);
  if (!variant) return;

  const [purchased] = await db
    .select({ id: orderItems.id })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(eq(orders.userId, userId), eq(orderItems.variantId, variant.id)),
    )
    .limit(1);

  if (purchased) return;

  const [order] = await db
    .insert(orders)
    .values({
      userId,
      status: "placed",
      customerName,
      phone: "+971500000000",
      addressLine: "Demo Review Street",
      city: "Dubai",
      totalCents: variant.priceCents,
      currency: "AED",
      email,
    })
    .returning();

  await db.insert(orderItems).values({
    orderId: order.id,
    variantId: variant.id,
    titleEn: product.titleEn,
    titleAr: product.titleAr,
    priceCents: variant.priceCents,
    currency: "AED",
    quantity: 1,
    imageUrl: variant.imageUrl ?? product.imageUrl,
  });
}

/**
 * The seed rewrites the demo user's password on every run, so pointing it at a
 * shared database would silently reset credentials.
 */
function assertSeedable() {
  const allowed =
    process.env.NODE_ENV !== "production" ||
    process.argv.includes("--force") ||
    process.env.SEED_FORCE === "1";

  if (!allowed) {
    throw new Error(
      "Refusing to seed with NODE_ENV=production. Pass --force or set SEED_FORCE=1 if this is intentional.",
    );
  }
}

async function seed() {
  assertSeedable();
  console.log("Seeding Noom database...");

  // Fixed-window counters survive across runs; wipe them so e2e / re-seed does
  // not inherit a half-spent bucket from an earlier suite (all local traffic
  // shares the unknown-client IP fallback).
  await db.delete(rateLimits);

  // Addresses were stored verbatim before lowercasing was enforced, so the
  // same person could hold two rows.
  await db.execute(
    sql`update "user" set email = lower(email) where email <> lower(email)`,
  );

  await db
    .insert(currencies)
    .values([
      { code: "AED", minorUnits: 2, isDefault: true },
      { code: "USD", minorUnits: 2, isDefault: false },
    ])
    .onConflictDoUpdate({
      target: currencies.code,
      set: {
        minorUnits: sql`excluded.minor_units`,
        isDefault: sql`excluded.is_default`,
      },
    });

  for (const category of categorySeed) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
  }

  const allCategories = await db.query.categories.findMany();
  const categoryBySlug = Object.fromEntries(
    allCategories.map((category) => [category.slug, category.id]),
  );

  for (const product of productSeed) {
    await db
      .insert(products)
      .values({
        slug: product.slug,
        titleEn: product.titleEn,
        titleAr: product.titleAr,
        descriptionEn: product.descriptionEn,
        descriptionAr: product.descriptionAr,
        imageUrl: product.imageUrl,
        categoryId: categoryBySlug[product.categorySlug],
      })
      .onConflictDoNothing({ target: products.slug });
  }

  const allProducts = await db.query.products.findMany();
  const productBySlug = Object.fromEntries(
    allProducts.map((product) => [product.slug, product]),
  );

  for (const seedProduct of productSeed) {
    const product = productBySlug[seedProduct.slug];
    if (!product) continue;

    if (seedProduct.slug === "canvas-tote") {
      await seedCanvasToteVariants(product.id);
      continue;
    }

    if (seedProduct.slug === "linen-scarf") {
      await seedLinenScarfVariants(product.id);
      continue;
    }

    await ensureDefaultVariant(
      product,
      seedProduct.priceCents,
      seedProduct.stock,
    );
  }

  // Guarantee every variant has AED + USD rows even if an earlier run
  // created SKUs before multi-currency existed.
  const allVariants = await db.query.productVariants.findMany();
  for (const variant of allVariants) {
    await ensureVariantPrices(variant.id, variant.priceCents);
  }

  const passwordHash = await bcrypt.hash("demo1234", 12);
  const [demoUser] = await db
    .insert(users)
    .values({
      name: "Demo Shopper",
      email: "demo@noom.app",
      passwordHash,
      emailVerified: new Date(),
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "Demo Shopper",
        passwordHash,
        emailVerified: new Date(),
      },
    })
    .returning();

  // Ordered so the demo order, and the E2E specs that read it, stay stable
  // across runs.
  const demoProducts = await db.query.products.findMany({
    orderBy: (product, { asc }) => [asc(product.slug)],
    limit: 2,
  });

  if (demoProducts.length >= 2) {
    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, demoUser.id))
      .limit(1);

    if (!existingOrder) {
      const variant0 = await getDefaultVariantForProduct(demoProducts[0].id);
      const variant1 = await getDefaultVariantForProduct(demoProducts[1].id);

      if (variant0 && variant1) {
        const totalCents = variant0.priceCents + variant1.priceCents * 2;

        const [order] = await db
          .insert(orders)
          .values({
            userId: demoUser.id,
            status: "placed",
            customerName: "Demo Shopper",
            phone: "+971501234567",
            addressLine: "Demo Marina Walk",
            city: "Dubai",
            totalCents,
            currency: "AED",
          })
          .returning();

        await db.insert(orderItems).values([
          {
            orderId: order.id,
            variantId: variant0.id,
            titleEn: demoProducts[0].titleEn,
            titleAr: demoProducts[0].titleAr,
            priceCents: variant0.priceCents,
            currency: "AED",
            quantity: 1,
            imageUrl: variant0.imageUrl ?? demoProducts[0].imageUrl,
          },
          {
            orderId: order.id,
            variantId: variant1.id,
            titleEn: demoProducts[1].titleEn,
            titleAr: demoProducts[1].titleAr,
            priceCents: variant1.priceCents,
            currency: "AED",
            quantity: 2,
            imageUrl: variant1.imageUrl ?? demoProducts[1].imageUrl,
          },
        ]);
      }
    }
  }

  const [existingAddress] = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, demoUser.id))
    .limit(1);

  if (!existingAddress) {
    await db.insert(addresses).values({
      userId: demoUser.id,
      label: "Home",
      fullName: "Demo Shopper",
      phone: "+971501234567",
      addressLine: "Demo Marina Walk",
      city: "Dubai",
      isDefault: true,
    });
  }

  // The demo shopper needs a purchase the review tests can rely on, separate
  // from the sample order above, which is only created on a fresh database.
  const reviewableProduct = await db.query.products.findFirst({
    where: eq(products.slug, REVIEWABLE_DEMO_SLUG),
  });

  if (reviewableProduct) {
    await ensurePurchase(
      demoUser.id,
      "Demo Shopper",
      "demo@noom.app",
      reviewableProduct,
    );
  }

  await seedReviews();

  const wishlistSeeds = await db.query.products.findMany({
    orderBy: (product, { asc }) => [asc(product.slug)],
    limit: 3,
  });
  for (const product of wishlistSeeds) {
    await db
      .insert(wishlistItems)
      .values({
        userId: demoUser.id,
        productId: product.id,
      })
      .onConflictDoNothing();
  }

  await seedDiscounts();

  console.log("Seed complete.");
  console.log("Demo user: demo@noom.app / demo1234");
  console.log("Demo codes: NOOM10 (10% off), FLAT20 (AED 20 off)");
}

async function seedDiscounts() {
  await db
    .insert(discounts)
    .values([
      {
        code: "NOOM10",
        type: "percent",
        percentInt: 10,
        valueCents: null,
        currency: null,
        active: true,
        usageCount: 0,
      },
      {
        code: "FLAT20",
        type: "fixed",
        percentInt: null,
        valueCents: 2000,
        currency: "AED",
        active: true,
        usageCount: 0,
      },
    ])
    .onConflictDoUpdate({
      target: discounts.code,
      set: {
        type: sql`excluded.type`,
        percentInt: sql`excluded.percent_int`,
        valueCents: sql`excluded.value_cents`,
        currency: sql`excluded.currency`,
        active: sql`excluded.active`,
      },
    });
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
