"use server";

import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { actionError, type ActionErrorCode } from "@/lib/errors";
import {
    addressCreateSchema,
    addressIdSchema,
    addressUpdateSchema,
} from "@/lib/validations/address";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AddressActionState = {
  ok: boolean;
  code?: ActionErrorCode;
  saved?: boolean;
};

function readAddressForm(formData: FormData) {
  return {
    label: formData.get("label"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    addressLine: formData.get("addressLine"),
    city: formData.get("city"),
    isDefault: formData.get("isDefault") === "on",
  };
}

export async function createAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const parsed = addressCreateSchema.safeParse(readAddressForm(formData));
  if (!parsed.success) {
    return actionError("invalidAddress");
  }

  await db.transaction(async (tx) => {
    const existing = await tx.query.addresses.findMany({
      where: eq(addresses.userId, user.id),
      columns: { id: true },
    });

    // The first address is always the default, otherwise checkout has nothing
    // to prefill from.
    const isDefault = parsed.data.isDefault || existing.length === 0;

    const [created] = await tx
      .insert(addresses)
      .values({ ...parsed.data, isDefault, userId: user.id })
      .returning({ id: addresses.id });

    if (isDefault) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(eq(addresses.userId, user.id), ne(addresses.id, created.id)),
        );
    }
  });

  revalidatePath("/", "layout");
  return { ok: true, saved: true };
}

export async function updateAddressAction(
  _prev: AddressActionState,
  formData: FormData,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const parsed = addressUpdateSchema.safeParse({
    ...readAddressForm(formData),
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return actionError("invalidAddress");
  }

  const { id, ...fields } = parsed.data;

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(addresses)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)))
      .returning({ id: addresses.id });

    if (rows.length > 0 && fields.isDefault) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, user.id), ne(addresses.id, id)));
    }

    return rows.length;
  });

  if (updated === 0) {
    return actionError("addressNotFound");
  }

  revalidatePath("/", "layout");
  return { ok: true, saved: true };
}

export async function setDefaultAddressAction(
  addressId: string,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const parsed = addressIdSchema.safeParse({ id: addressId });
  if (!parsed.success) {
    return actionError("addressNotFound");
  }

  const updated = await db.transaction(async (tx) => {
    const rows = await tx
      .update(addresses)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(eq(addresses.id, parsed.data.id), eq(addresses.userId, user.id)),
      )
      .returning({ id: addresses.id });

    if (rows.length > 0) {
      await tx
        .update(addresses)
        .set({ isDefault: false })
        .where(
          and(
            eq(addresses.userId, user.id),
            ne(addresses.id, parsed.data.id),
          ),
        );
    }

    return rows.length;
  });

  if (updated === 0) {
    return actionError("addressNotFound");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAddressAction(
  addressId: string,
): Promise<AddressActionState> {
  const user = await getSessionUser();
  if (!user) {
    return actionError("unauthorized");
  }

  const parsed = addressIdSchema.safeParse({ id: addressId });
  if (!parsed.success) {
    return actionError("addressNotFound");
  }

  const deleted = await db.transaction(async (tx) => {
    const rows = await tx
      .delete(addresses)
      .where(
        and(eq(addresses.id, parsed.data.id), eq(addresses.userId, user.id)),
      )
      .returning({ id: addresses.id, isDefault: addresses.isDefault });

    // Promote another address so the account never loses its default.
    if (rows.length > 0 && rows[0].isDefault) {
      const next = await tx.query.addresses.findFirst({
        where: eq(addresses.userId, user.id),
        columns: { id: true },
      });

      if (next) {
        await tx
          .update(addresses)
          .set({ isDefault: true })
          .where(eq(addresses.id, next.id));
      }
    }

    return rows.length;
  });

  if (deleted === 0) {
    return actionError("addressNotFound");
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
