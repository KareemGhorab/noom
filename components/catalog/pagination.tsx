import { buttonVariants } from "@/components/ui/button-variants";
import { Link } from "@/i18n/navigation";
import { buildPageList } from "@/lib/domain/catalog";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export async function Pagination({
  page,
  pageCount,
  searchParams,
  basePath = "/search",
}: {
  page: number;
  pageCount: number;
  searchParams: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  const t = await getTranslations("Catalog");

  function hrefFor(target: number) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "" && key !== "page") {
        params.set(key, value);
      }
    }

    params.set("page", String(target));
    return `${basePath}?${params.toString()}`;
  }

  const pages = buildPageList(page, pageCount);

  return (
    <nav aria-label={t("pagination")} className="flex flex-wrap gap-2">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("previous")}
        </Link>
      ) : null}

      {pages.map((target) => (
        <Link
          key={target}
          href={hrefFor(target)}
          aria-current={target === page ? "page" : undefined}
          className={cn(
            buttonVariants({
              variant: target === page ? "default" : "outline",
              size: "sm",
            }),
          )}
        >
          {target}
        </Link>
      ))}

      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("next")}
        </Link>
      ) : null}
    </nav>
  );
}
