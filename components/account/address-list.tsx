"use client";

import {
    AddressForm,
    type AddressFormValues,
} from "@/components/account/address-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    deleteAddressAction,
    setDefaultAddressAction,
} from "@/features/addresses/actions";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

export function AddressList({
  addresses,
}: {
  addresses: AddressFormValues[];
}) {
  const t = useTranslations("Addresses");
  const tErrors = useTranslations("Errors");
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {addresses.length === 0 ? (
        <div className="doodle-radius-card border bg-card p-8 text-center">
          <h2 className="font-display text-2xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="doodle-radius-card space-y-3 border bg-card p-4"
            >
              {editingId === address.id ? (
                <AddressForm
                  address={address}
                  onDone={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{address.label}</p>
                    {address.isDefault ? (
                      <Badge variant="secondary">{t("defaultBadge")}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {address.fullName} · {address.phone}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.addressLine}, {address.city}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditingId(address.id ?? null)}
                    >
                      {t("edit")}
                    </Button>
                    {address.isDefault ? null : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                          setError(null);
                          startTransition(async () => {
                            const result = await setDefaultAddressAction(
                              address.id!,
                            );
                            if (!result.ok) {
                              setError(tErrors(result.code ?? "unknown"));
                              return;
                            }
                            router.refresh();
                          });
                        }}
                      >
                        {t("makeDefault")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => {
                        setError(null);
                        startTransition(async () => {
                          const result = await deleteAddressAction(address.id!);
                          if (!result.ok) {
                            setError(tErrors(result.code ?? "unknown"));
                            return;
                          }
                          router.refresh();
                        });
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {adding ? (
        <div className="doodle-radius-card border bg-card p-4">
          <AddressForm
            onDone={() => {
              setAdding(false);
              router.refresh();
            }}
          />
        </div>
      ) : (
        <Button type="button" onClick={() => setAdding(true)}>
          {t("add")}
        </Button>
      )}
    </div>
  );
}
