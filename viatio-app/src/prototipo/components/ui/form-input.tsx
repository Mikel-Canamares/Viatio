import { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function FormInput({ label, className = "", ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-gray-700">
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-[#0066CC] transition-all ${className}`}
        {...props}
      />
    </div>
  );
}