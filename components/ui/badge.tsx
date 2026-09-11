import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-stone-100 text-stone-700",
        success: "bg-emerald-600 text-white",
        danger: "bg-rose-600 text-white",
        warning: "bg-amber-500 text-stone-950",
        outline: "border border-stone-300 text-stone-600",
        teal: "bg-teal-800 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
