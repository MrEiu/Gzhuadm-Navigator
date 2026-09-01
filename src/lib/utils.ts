import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes conditionally without conflicts (shadcn standard utility)
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
