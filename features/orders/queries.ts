import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { canViewOrder } from "@/lib/domain/orders-access";
import { desc, eq } from "drizzle-orm";

export async function listOrdersForUser(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });
}

export async function getOrderForUser(orderId: string, userId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });

  if (!order || !canViewOrder({ orderUserId: order.userId, viewerUserId: userId })) {
    return null;
  }

  return order;
}

export async function getOrderById(orderId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: { items: true },
  });
}
