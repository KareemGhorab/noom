import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { priceInCurrency } from "@/lib/domain/pricing";
import type { CurrencyCode } from "@/lib/i18n/currency";
import type { CatalogQuery } from "@/lib/validations/catalog-query";
import { buildSearchTerms } from "@/lib/validations/search";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

const productWithCatalog = {
  category: true,
  variants: {
    with: {
      prices: true,
    },
  },
  options: true,
} as const;

type ProductWithCatalog = NonNullable<
  Awaited<ReturnType<typeof getProductBySlugRaw>>
>;

type VariantWithPrices = ProductWithCatalog["variants"][number];

export type PricedVariant = Omit<VariantWithPrices, "prices" | "priceCents"> & {
  priceCents: number | null;
};

export type PricedProduct = Omit<ProductWithCatalog, "variants"> & {
  variants: PricedVariant[];
};

function applyCurrencyToVariants(
  variants: VariantWithPrices[],
  currency: CurrencyCode,
): PricedVariant[] {
  return variants.map((variant) => {
    const { prices, ...rest } = variant;
    return {
      ...rest,
      priceCents: priceInCurrency(prices, currency),
    };
  });
}

function applyCurrencyToProduct(
  product: ProductWithCatalog,
  currency: CurrencyCode,
): PricedProduct {
  return {
    ...product,
    variants: applyCurrencyToVariants(product.variants, currency),
  };
}

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (category, { asc }) => [asc(category.nameEn)],
  });
}

/** Slugs only — used by `app/sitemap.ts` so crawlers do not pull full catalog rows. */
export async function listProductSlugs() {
  return db
    .select({ slug: products.slug })
    .from(products)
    .orderBy(asc(products.slug));
}

async function getFeaturedProductsRaw(limit = 8) {
  return db.query.products.findMany({
    with: productWithCatalog,
    orderBy: (product, { desc }) => [desc(product.createdAt)],
    limit,
  });
}

export async function getFeaturedProducts(currency: CurrencyCode, limit = 8) {
  const items = await getFeaturedProductsRaw(limit);
  return items.map((product) => applyCurrencyToProduct(product, currency));
}

async function getProductBySlugRaw(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: productWithCatalog,
  });
}

export async function getProductBySlug(slug: string, currency: CurrencyCode) {
  const product = await getProductBySlugRaw(slug);
  return product ? applyCurrencyToProduct(product, currency) : undefined;
}

/**
 * Preserves the caller's slug order (e.g. recently-viewed cookie order) and
 * drops unknown slugs silently.
 */
export async function getProductsBySlugs(
  slugs: string[],
  currency: CurrencyCode,
) {
  if (slugs.length === 0) {
    return [];
  }

  const rows = await db.query.products.findMany({
    where: inArray(products.slug, slugs),
    with: productWithCatalog,
  });

  const bySlug = new Map(
    rows.map((product) => [
      product.slug,
      applyCurrencyToProduct(product, currency),
    ]),
  );

  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is PricedProduct => product != null);
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
}

export type FindProductsResult = Awaited<ReturnType<typeof findProducts>>;

/**
 * Correlated aggregates over `variant_price` for the active currency so listing
 * filters and sorts never read a different currency's cents as if they were
 * comparable.
 */
function minVariantPriceSql(currency: CurrencyCode) {
  return sql<number>`(
    select coalesce(min(vp.price_cents), 0)
    from product_variant pv
    inner join variant_price vp on vp.variant_id = pv.id
    where pv.product_id = ${products.id}
      and vp.currency = ${currency}
  )`;
}

function maxVariantPriceSql(currency: CurrencyCode) {
  return sql<number>`(
    select coalesce(max(vp.price_cents), 0)
    from product_variant pv
    inner join variant_price vp on vp.variant_id = pv.id
    where pv.product_id = ${products.id}
      and vp.currency = ${currency}
  )`;
}

/**
 * One entry point for the catalog listing. Search terms, category, and price
 * are composed as filters rather than separate code paths, so combining `q`
 * and `category` narrows instead of one silently replacing the other.
 */
export async function findProducts(
  query: CatalogQuery,
  currency: CurrencyCode,
) {
  const filters: SQL[] = [];
  const minVariantPrice = minVariantPriceSql(currency);

  const terms = buildSearchTerms(query.q);
  for (const term of terms) {
    const match = or(
      ilike(products.titleEn, `%${term}%`),
      ilike(products.titleAr, `%${term}%`),
      ilike(products.descriptionEn, `%${term}%`),
      ilike(products.descriptionAr, `%${term}%`),
    );
    if (match) {
      filters.push(match);
    }
  }

  let category: typeof categories.$inferSelect | undefined;

  if (query.category) {
    category = await db.query.categories.findFirst({
      where: eq(categories.slug, query.category),
    });

    if (!category) {
      return {
        items: [] as PricedProduct[],
        total: 0,
        page: 1,
        pageCount: 0,
        category: null,
        categoryMissing: true,
      };
    }

    filters.push(eq(products.categoryId, category.id));
  }

  if (query.minPrice !== undefined) {
    filters.push(gte(minVariantPrice, query.minPrice * 100));
  }

  if (query.maxPrice !== undefined) {
    filters.push(lte(minVariantPrice, query.maxPrice * 100));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(products)
    .where(where);

  const pageCount = Math.ceil(total / query.perPage);
  const page = pageCount === 0 ? 1 : Math.min(query.page, pageCount);

  const items = await db.query.products.findMany({
    where,
    with: productWithCatalog,
    orderBy: orderByFor(query.sort, currency),
    limit: query.perPage,
    offset: (page - 1) * query.perPage,
  });

  return {
    items: items.map((product) => applyCurrencyToProduct(product, currency)),
    total,
    page,
    pageCount,
    category: category ?? null,
    categoryMissing: false,
  };
}

export async function getRelatedProducts({
  productId,
  categoryId,
  currency,
  limit = 4,
}: {
  productId: string;
  categoryId: string;
  currency: CurrencyCode;
  limit?: number;
}) {
  const items = await db.query.products.findMany({
    where: and(
      eq(products.categoryId, categoryId),
      ne(products.id, productId),
    ),
    with: productWithCatalog,
    orderBy: [desc(products.createdAt)],
    limit,
  });

  return items.map((product) => applyCurrencyToProduct(product, currency));
}

/**
 * Correlated aggregate so unreviewed products sort last instead of dropping out
 * of the listing, which a join-based average would do. The review columns are
 * written against an explicit alias because the relational query builder
 * rewrites bare column references to the outer table.
 */
const averageRatingExpression = sql<number>`coalesce((select avg(r.rating) from "review" r where r.product_id = ${products.id}), 0)`;

function orderByFor(
  sort: CatalogQuery["sort"],
  currency: CurrencyCode,
): SQL[] {
  const minVariantPrice = minVariantPriceSql(currency);
  const maxVariantPrice = maxVariantPriceSql(currency);

  switch (sort) {
    case "priceAsc":
      return [asc(minVariantPrice), asc(products.id)];
    case "priceDesc":
      return [desc(maxVariantPrice), asc(products.id)];
    case "rating":
      return [desc(averageRatingExpression), asc(products.id)];
    case "newest":
    default:
      return [desc(products.createdAt), asc(products.id)];
  }
}

export function getLocalizedProductTitle(
  product: { titleEn: string; titleAr: string },
  locale: string,
) {
  return locale === "ar" ? product.titleAr : product.titleEn;
}

export function getLocalizedProductDescription(
  product: { descriptionEn: string; descriptionAr: string },
  locale: string,
) {
  return locale === "ar" ? product.descriptionAr : product.descriptionEn;
}

export function getLocalizedCategoryName(
  category: { nameEn: string; nameAr: string },
  locale: string,
) {
  return locale === "ar" ? category.nameAr : category.nameEn;
}
