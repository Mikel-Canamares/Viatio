import { SelectHTMLAttributes } from "react";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export function FormSelect({ label, options, className = "", ...props }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#111827]">
        {label}
      </label>
      <select
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
