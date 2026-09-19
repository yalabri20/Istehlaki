import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-teal-800 text-white shadow-[0_8px_20px_-8px_rgba(15,94,87,0.7)] hover:bg-teal-900 hover:shadow-[0_10px_26px_-8px_rgba(15,94,87,0.8)] active:scale-[0.98]",
        secondary:
          "bg-white text-teal-900 border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300",
        outline:
          "border border-teal-800/25 bg-transparent text-teal-900 hover:bg-teal-800/5 hover:border-teal-800/40",
        ghost: "text-stone-700 hover:bg-stone-100",
        danger:
          "bg-rose-700 text-white shadow-[0_8px_20px_-8px_rgba(190,18,60,0.7)] hover:bg-rose-800 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
