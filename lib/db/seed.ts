import { db } from "@/lib/db";
import {
    categories,
    orderItems,
    orders,
    products,
    users,
    wishlistItems,
} from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { eq } from "drizzle-orm";

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

async function seed() {
  console.log("Seeding Noom database...");

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
        priceCents: product.priceCents,
        currency: "AED",
        stock: product.stock,
        imageUrl: product.imageUrl,
        categoryId: categoryBySlug[product.categorySlug],
      })
      .onConflictDoNothing({ target: products.slug });
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

  const demoProducts = await db.query.products.findMany({ limit: 2 });

  if (demoProducts.length >= 2) {
    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.userId, demoUser.id))
      .limit(1);

    if (!existingOrder) {
      const totalCents =
        demoProducts[0].priceCents + demoProducts[1].priceCents * 2;

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
          productId: demoProducts[0].id,
          titleEn: demoProducts[0].titleEn,
          titleAr: demoProducts[0].titleAr,
          priceCents: demoProducts[0].priceCents,
          quantity: 1,
          imageUrl: demoProducts[0].imageUrl,
        },
        {
          orderId: order.id,
          productId: demoProducts[1].id,
          titleEn: demoProducts[1].titleEn,
          titleAr: demoProducts[1].titleAr,
          priceCents: demoProducts[1].priceCents,
          quantity: 2,
          imageUrl: demoProducts[1].imageUrl,
        },
      ]);
    }
  }

  const wishlistSeeds = await db.query.products.findMany({ limit: 3 });
  for (const product of wishlistSeeds) {
    await db
      .insert(wishlistItems)
      .values({
        userId: demoUser.id,
        productId: product.id,
      })
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
  console.log("Demo user: demo@noom.app / demo1234");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
