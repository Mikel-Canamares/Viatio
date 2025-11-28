import { ReactNode } from "react";

interface SecondaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export function SecondaryButton({ 
  children, 
  onClick, 
  type = "button",
  disabled = false,
  className = ""
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#003580] py-4 px-6 rounded-xl border border-[#0066CC]/30 transition-all hover:border-[#0066CC] hover:shadow-[0_4px_16px_rgba(0,102,204,0.1)] active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}