import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("doodle-radius-card animate-pulse bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
