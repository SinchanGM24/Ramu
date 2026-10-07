import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" };
export const Button = forwardRef<HTMLButtonElement, Props>(({ className, variant = "primary", ...props }, ref) => (
  <button ref={ref} className={cn("inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", { "bg-brand-600 text-white hover:bg-brand-700": variant === "primary", "bg-brand-50 text-brand-700 hover:bg-brand-100": variant === "secondary", "text-slate-600 hover:bg-slate-100": variant === "ghost", "bg-red-600 text-white hover:bg-red-700": variant === "danger" }, className)} {...props} />
));
Button.displayName = "Button";
