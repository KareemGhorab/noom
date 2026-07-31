import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

const links = [
  { href: "/account", key: "profile" as const },
  { href: "/account/orders", key: "orders" as const },
  { href: "/account/addresses", key: "addresses" as const },
  { href: "/account/wishlist", key: "wishlist" as const },
];

export async function AccountNav({
  active,
}: {
  active: "profile" | "orders" | "addresses" | "wishlist";
}) {
  const t = await getTranslations("Account");

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "doodle-radius-button border px-3 py-1.5 text-sm transition-colors",
            active === link.key
              ? "border-foreground bg-foreground text-background"
              : "border-border bg-background text-foreground hover:bg-muted",
          )}
        >
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );
}
