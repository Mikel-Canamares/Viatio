import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, onBack, action }: PageHeaderProps) {
  return (
    <header className="px-6 py-6 bg-[#003580] text-white">
      <div className="flex items-center gap-3 mb-2">
        {onBack && (
          <button
            onClick={onBack}
            className="text-white/90 hover:text-white transition-colors z-10 hover:bg-white/10 rounded-lg p-1 active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className={`text-white flex-1 ${onBack ? 'text-center -ml-9' : ''}`}>
          {title}
        </h1>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {subtitle && (
        <p className="text-white/80 text-sm text-center">
          {subtitle}
        </p>
      )}
    </header>
  );
}