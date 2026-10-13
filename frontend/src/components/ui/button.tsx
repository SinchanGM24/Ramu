import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "primary" | "secondary" | "ghost" | "danger";
};
export const Button = forwardRef<HTMLButtonElement, Props>(
	({ className, variant = "primary", ...props }, ref) => (
		<button
			ref={ref}
			className={cn(
				"inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-[#f8f5ed] disabled:cursor-not-allowed disabled:opacity-50",
				{
					"bg-brand-700 text-white shadow-[0_8px_18px_rgba(23,75,49,0.18)] hover:-translate-y-0.5 hover:bg-brand-800 hover:shadow-[0_12px_24px_rgba(23,75,49,0.22)]":
						variant === "primary",
					"border border-brand-100 bg-white text-brand-700 hover:border-brand-200 hover:bg-brand-50":
						variant === "secondary",
					"text-slate-600 hover:bg-brand-50 hover:text-brand-800": variant === "ghost",
					"bg-red-700 text-white shadow-[0_8px_18px_rgba(185,28,28,0.16)] hover:-translate-y-0.5 hover:bg-red-800":
						variant === "danger",
				},
				className,
			)}
			{...props}
		/>
	),
);
Button.displayName = "Button";
