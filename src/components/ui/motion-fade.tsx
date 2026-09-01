import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

export interface MotionFadeProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
}

/**
 * High-performance Framer Motion Fade/Slide in component
 */
export const MotionFade: React.FC<MotionFadeProps> = ({
    children,
    className,
    delay = 0,
    duration = 0.35,
    direction = "up",
    ...props
}) => {
    const getInitial = () => {
        switch (direction) {
            case "up": return { opacity: 0, y: 15 };
            case "down": return { opacity: 0, y: -15 };
            case "left": return { opacity: 0, x: 20 };
            case "right": return { opacity: 0, x: -20 };
            case "none": return { opacity: 0 };
        }
    };

    return (
        <motion.div
            initial={getInitial()}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1.0]
            }}
            className={cn(className)}
            {...props}
        >
            {children}
        </motion.div>
    );
};
