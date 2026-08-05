import { InputHTMLAttributes, forwardRef, ChangeEvent } from "react";
import { Input } from "@/components/ui/Input";
import { maskPhoneInput } from "@/lib/phone";

interface PhoneInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, onValueChange, placeholder = "+7 (993) 259-01-43", ...props }, ref) => {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
      const masked = maskPhoneInput(e.target.value);
      e.target.value = masked;
      onValueChange?.(masked);
      onChange?.(e);
    }

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        placeholder={placeholder}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";
