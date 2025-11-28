import { TextareaHTMLAttributes } from "react";

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export function FormTextarea({ label, className = "", ...props }: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#111827]">
        {label}
      </label>
      <textarea
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[#111827] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
