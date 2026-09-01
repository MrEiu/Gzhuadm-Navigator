import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-[13px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 disabled:pointer-events-none disabled:opacity-50 active:scale-98 cursor-pointer select-none",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-[#b3a4ed] to-[#a494e8] text-white shadow-[0_6px_20px_rgba(179,164,237,0.35)] hover:opacity-95",
                destructive:
                    "bg-rose-500 text-white shadow-sm hover:bg-rose-600",
                outline:
                    "border border-white/80 bg-white/60 hover:bg-white text-[#4a4365] shadow-2xs backdrop-blur-sm",
                secondary:
                    "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100",
                ghost:
                    "hover:bg-purple-50/60 text-[#4a4365]",
                link:
                    "text-[#a494e8] underline-offset-4 hover:underline",
                gradientPink:
                    "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-[0_6px_20px_rgba(244,114,182,0.35)] hover:opacity-95"
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-8 rounded-xl px-3 text-[11.5px]",
                lg: "h-11 rounded-2xl px-6 text-[14px]",
                icon: "h-9 w-9 p-0 rounded-xl"
            }
        },
        defaultVariants: {
            variant: "default",
            size: "default"
        }
    }
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
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
