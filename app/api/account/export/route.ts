import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  addresses,
  orders,
  reviews,
  users,
  wishlistItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      currency: true,
      image: true,
    },
  });

  if (!profile) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [userAddresses, userOrders, wishlist, userReviews] = await Promise.all([
    db.query.addresses.findMany({
      where: eq(addresses.userId, userId),
    }),
    db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: { items: true },
      orderBy: (order, { desc }) => [desc(order.createdAt)],
    }),
    db.query.wishlistItems.findMany({
      where: eq(wishlistItems.userId, userId),
      with: {
        product: {
          columns: { id: true, slug: true, titleEn: true, titleAr: true },
        },
      },
    }),
    db.query.reviews.findMany({
      where: eq(reviews.userId, userId),
      with: {
        product: {
          columns: { id: true, slug: true, titleEn: true },
        },
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    addresses: userAddresses,
    orders: userOrders,
    wishlist: wishlist.map((item) => ({
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product,
    })),
    reviews: userReviews,
  };

  const body = JSON.stringify(payload, null, 2);
  const filename = `noom-account-export-${profile.id.slice(0, 8)}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
