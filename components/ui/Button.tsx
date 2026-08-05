import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ember text-flatbread-2 hover:bg-ember-dark focus-visible:outline-ember disabled:bg-char/30",
  secondary:
    "bg-transparent text-char border border-char/20 hover:border-char/40 hover:bg-char/5 focus-visible:outline-char",
  ghost: "bg-transparent text-char hover:bg-char/5 focus-visible:outline-char",
  danger:
    "bg-transparent text-red-700 border border-red-200 hover:bg-red-50 focus-visible:outline-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-full",
  md: "text-[15px] px-5 py-2.5 rounded-full",
  lg: "text-base px-7 py-3.5 rounded-full",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
