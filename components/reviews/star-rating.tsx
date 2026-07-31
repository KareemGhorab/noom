import { cn } from "@/lib/utils";
import { MAX_RATING } from "@/lib/validations/review";
import { Star } from "lucide-react";

export function StarRating({
  value,
  label,
  className,
  size = "sm",
}: {
  value: number;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const filled = Math.round(value);
  const iconSize = size === "md" ? "size-5" : "size-4";

  return (
    <span
      role="img"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          aria-hidden
          className={cn(
            iconSize,
            index < filled
              ? "fill-primary text-primary"
              : "text-muted-foreground",
          )}
        />
      ))}
    </span>
  );
}
