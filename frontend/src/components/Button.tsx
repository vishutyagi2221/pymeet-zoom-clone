import { ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

const styles = {
  primary: "bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-glow",
  secondary: "bg-white/10 text-white hover:bg-white/15 border border-line",
  danger: "bg-rose-500 text-white hover:bg-rose-400 shadow-soft",
  ghost: "bg-transparent text-slate-200 hover:bg-white/10"
};

export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
