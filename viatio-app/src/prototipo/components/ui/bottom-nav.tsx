import { Home, Calendar, User } from "lucide-react";

interface BottomNavProps {
  activeTab: "home" | "calendar" | "profile";
  onTabChange: (tab: "home" | "calendar" | "profile") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "home" as const, label: "Inicio", icon: Home },
    { id: "calendar" as const, label: "Calendario", icon: Calendar },
    { id: "profile" as const, label: "Perfil", icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive ? "bg-blue-50" : ""
                }`}
              >
                <Icon 
                  className={`w-6 h-6 ${
                    isActive ? "text-[#0066CC]" : "text-gray-400"
                  }`}
                />
                <span 
                  className={`text-xs ${
                    isActive ? "text-[#0066CC]" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}