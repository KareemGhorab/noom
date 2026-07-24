import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import {
  buildSearchTerms,
  normalizeSearchQuery,
} from "@/lib/validations/search";

export async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (category, { asc }) => [asc(category.nameEn)],
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.query.products.findMany({
    with: { category: true },
    orderBy: (product, { desc }) => [desc(product.createdAt)],
    limit,
  });
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: { category: true },
  });
}

export async function searchProducts(query: string) {
  const normalized = normalizeSearchQuery(query);
  const terms = buildSearchTerms(normalized);

  if (terms.length === 0) {
    return [];
  }

  const filters = terms.map((term) =>
    or(
      ilike(products.titleEn, `%${term}%`),
      ilike(products.titleAr, `%${term}%`),
      ilike(products.descriptionEn, `%${term}%`),
      ilike(products.descriptionAr, `%${term}%`),
    ),
  );

  return db.query.products.findMany({
    where: and(...filters),
    with: { category: true },
    orderBy: (product, { desc }) => [desc(product.createdAt)],
  });
}

export async function getProductsByCategorySlug(categorySlug: string) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
  });

  if (!category) {
    return { category: null, products: [] };
  }

  const categoryProducts = await db.query.products.findMany({
    where: eq(products.categoryId, category.id),
    with: { category: true },
    orderBy: (product, { desc }) => [desc(product.createdAt)],
  });

  return { category, products: categoryProducts };
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });
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
