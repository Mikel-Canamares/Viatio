import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="max-w-md mx-auto min-h-screen bg-white">
        {children}
      </div>
    </div>
  );
}
