import { db } from "@/lib/db";
import { productVariants, stockSubscriptions } from "@/lib/db/schema";
import { sendMail } from "@/lib/email/send";
import { and, inArray, isNull } from "drizzle-orm";

/**
 * Emails pending subscribers once a variant is back above zero stock, then
 * stamps `notifiedAt` so the same restock does not spam.
 */
export async function notifyStockSubscribers(
  variantIds: string[],
): Promise<void> {
  if (variantIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(variantIds)];
  const inStock = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, uniqueIds),
    columns: { id: true, stock: true, sku: true },
    with: {
      product: { columns: { titleEn: true, slug: true } },
    },
  });

  const restocked = inStock.filter((variant) => variant.stock > 0);
  if (restocked.length === 0) {
    return;
  }

  const restockedIds = restocked.map((variant) => variant.id);
  const pending = await db.query.stockSubscriptions.findMany({
    where: and(
      inArray(stockSubscriptions.variantId, restockedIds),
      isNull(stockSubscriptions.notifiedAt),
    ),
  });

  if (pending.length === 0) {
    return;
  }

  const byVariant = new Map(restocked.map((variant) => [variant.id, variant]));
  const notifiedIds: string[] = [];

  for (const subscription of pending) {
    const variant = byVariant.get(subscription.variantId);
    if (!variant) {
      continue;
    }

    await sendMail({
      to: subscription.email,
      subject: "Back in stock on Noom",
      text: `${variant.product.titleEn} (${variant.sku}) is back in stock. Visit /product/${variant.product.slug} to grab it while it lasts.`,
    });

    notifiedIds.push(subscription.id);
  }

  if (notifiedIds.length > 0) {
    await db
      .update(stockSubscriptions)
      .set({ notifiedAt: new Date() })
      .where(inArray(stockSubscriptions.id, notifiedIds));
  }
}
