import { User, Settings, Bell, HelpCircle, Shield, Globe, LogOut, ChevronRight, Mail, Phone, Camera } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";

interface ProfileProps {
  onLogout: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const menuSections = [
    {
      title: "Cuenta",
      items: [
        { icon: User, label: "Información personal", badge: null },
        { icon: Mail, label: "Email", value: "usuario@email.com" },
        { icon: Phone, label: "Teléfono", value: "+34 600 123 456" },
      ]
    },
    {
      title: "Preferencias",
      items: [
        { icon: Bell, label: "Notificaciones", badge: null },
        { icon: Globe, label: "Idioma", value: "Español" },
        { icon: Settings, label: "Configuración", badge: null },
      ]
    },
    {
      title: "Soporte",
      items: [
        { icon: HelpCircle, label: "Ayuda y soporte", badge: null },
        { icon: Shield, label: "Privacidad", badge: null },
      ]
    }
  ];

  return (
    <PageContainer>
      <PageHeader title="Perfil" />
      
      <div className="px-6 py-6 space-y-6 pb-32 bg-gray-50">
        {/* User Info Card */}
        <DesignCard className="text-center">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#0066CC] to-[#003580] flex items-center justify-center text-white mx-auto">
              <User className="w-12 h-12" />
            </div>
            <button className="absolute bottom-0 right-0 bg-[#FFC043] hover:bg-[#FFB400] text-[#003580] w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-gray-900 mb-1">Juan Pérez</h2>
          <p className="text-gray-600 text-sm mb-4">Viajero frecuente</p>
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-[#0066CC] mb-1">12</p>
              <p className="text-gray-600 text-xs">Viajes</p>
            </div>
            <div className="text-center">
              <p className="text-[#0066CC] mb-1">24</p>
              <p className="text-gray-600 text-xs">Países</p>
            </div>
            <div className="text-center">
              <p className="text-[#0066CC] mb-1">4</p>
              <p className="text-gray-600 text-xs">Próximos</p>
            </div>
          </div>
        </DesignCard>

        {/* Menu Sections */}
        {menuSections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-3">
            <h3 className="text-gray-700 text-sm px-1">{section.title}</h3>
            <DesignCard className="divide-y divide-gray-100">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    className="w-full flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:opacity-70 transition-opacity text-left"
                  >
                    <div className="bg-blue-50 rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#0066CC]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">{item.label}</p>
                      {item.value && (
                        <p className="text-gray-500 text-sm truncate">{item.value}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })}
            </DesignCard>
          </div>
        ))}

        {/* Logout Button */}
        <DesignCard>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 py-1 hover:opacity-70 transition-opacity text-left"
          >
            <div className="bg-red-50 rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-red-600">Cerrar sesión</p>
            </div>
          </button>
        </DesignCard>

        {/* App Version */}
        <div className="text-center pt-4">
          <p className="text-gray-400 text-xs">Triptia v1.0.0</p>
        </div>
      </div>
    </PageContainer>
  );
}