import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 select-none",
    {
        variants: {
            variant: {
                default:
                    "border-transparent bg-purple-100 text-purple-700 hover:bg-purple-200/80",
                secondary:
                    "border-transparent bg-[#f3edf8] text-[#4a4365] hover:bg-[#eadef5]",
                destructive:
                    "border-transparent bg-rose-100 text-rose-700",
                outline:
                    "text-[#4a4365] border-purple-200 bg-white/60",
                success:
                    "border-transparent bg-emerald-100 text-emerald-700",
                pink:
                    "border-transparent bg-pink-100 text-pink-700",
                amber:
                    "border-transparent bg-amber-100 text-amber-800"
            }
        },
        defaultVariants: {
            variant: "default"
        }
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
