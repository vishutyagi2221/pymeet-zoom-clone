import { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`rounded-lg border border-line bg-white/[0.07] shadow-soft backdrop-blur-xl ${className}`} {...props}>
      {children}
    </div>
  );
}
