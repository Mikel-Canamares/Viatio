import { ReactNode } from "react";

interface DesignCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DesignCard({ children, onClick, className = "" }: DesignCardProps) {
  const baseClasses = "bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-200/50 p-4 transition-all";
  const interactiveClasses = onClick ? "cursor-pointer hover:shadow-[0_4px_16px_rgba(0,102,204,0.15)] hover:border-[#0066CC]/30 active:scale-[0.99]" : "";
  
  return (
    <div 
      className={`${baseClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}