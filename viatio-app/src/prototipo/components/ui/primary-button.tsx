import { ReactNode } from "react";

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export function PrimaryButton({ 
  children, 
  onClick, 
  type = "button",
  disabled = false,
  className = ""
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-[#0066CC] hover:bg-[#0052A3] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl transition-all hover:shadow-[0_8px_24px_rgba(0,102,204,0.3)] active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}