import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import {
    canViewOrder,
    canViewOrderConfirmation,
} from "@/lib/domain/orders-access";
import { getRememberedOrderId } from "@/lib/orders/confirmation-cookie";
import { parseUuid } from "@/lib/validations/id";
import { ORDERS_PER_PAGE } from "@/lib/validations/pagination";
import { count, desc, eq } from "drizzle-orm";

export async function listOrdersForUser(
  userId: string,
  page = 1,
  perPage = ORDERS_PER_PAGE,
) {
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  const pageCount = Math.ceil(total / perPage);
  const safePage = pageCount === 0 ? 1 : Math.min(page, pageCount);

  const items = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: perPage,
    offset: (safePage - 1) * perPage,
  });

  return { items, total, page: safePage, pageCount };
}

export async function getLatestOrderForUser(userId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.userId, userId),
    orderBy: [desc(orders.createdAt)],
    columns: {
      customerName: true,
      phone: true,
      addressLine: true,
      city: true,
    },
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const id = parseUuid(orderId);
  if (!id) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order || !canViewOrder({ orderUserId: order.userId, viewerUserId: userId })) {
    return null;
  }

  return order;
}

/**
 * The only read path for the confirmation page. It deliberately replaces an
 * unguarded `getOrderById`, because an order id alone must never be enough to
 * expose a customer's name, phone, and address.
 */
export async function getOrderForConfirmation(
  orderId: string,
  viewerUserId: string | null,
) {
  const id = parseUuid(orderId);
  if (!id) {
    return null;
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  });

  if (!order) {
    return null;
  }

  const cookieOrderId = await getRememberedOrderId();

  const allowed = canViewOrderConfirmation({
    orderId: order.id,
    orderUserId: order.userId,
    viewerUserId,
    cookieOrderId,
  });

  return allowed ? order : null;
}
