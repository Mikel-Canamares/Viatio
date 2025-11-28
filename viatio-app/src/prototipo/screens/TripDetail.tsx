import { Calendar, Hotel, Map, FileText, ChevronRight } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

interface TripDetailProps {
  onBack: () => void;
  onNavigateToAgenda: () => void;
  onNavigateToReservations: () => void;
  onNavigateToMap: () => void;
  onNavigateToDocuments: () => void;
}

export default function TripDetail({ 
  onBack, 
  onNavigateToAgenda,
  onNavigateToReservations,
  onNavigateToMap,
  onNavigateToDocuments
}: TripDetailProps) {
  const menuItems = [
    { 
      icon: Calendar, 
      label: "Agenda del viaje", 
      description: "Ver itinerario día a día",
      onClick: onNavigateToAgenda 
    },
    { 
      icon: Hotel, 
      label: "Reservas", 
      description: "Hoteles, vuelos y más",
      onClick: onNavigateToReservations 
    },
    { 
      icon: Map, 
      label: "Mapa del viaje", 
      description: "Lugares guardados",
      onClick: onNavigateToMap 
    },
    { 
      icon: FileText, 
      label: "Documentos", 
      description: "Pasaportes y confirmaciones",
      onClick: onNavigateToDocuments 
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Cracovia" 
        subtitle="21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 bg-gray-50">
        {/* Hero Image */}
        <DesignCard className="p-0 overflow-hidden">
          <div className="relative">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1623784314023-fa78af3bff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmFjb3ZpYSUyMHBvbGFuZHxlbnwxfHx8fDE3NjMxMjA3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Cracovia"
              className="w-full h-48 object-cover"
            />
          </div>
          <div className="p-5">
            <h2 className="text-gray-900 mb-2">Explorando Polonia</h2>
            <p className="text-gray-600 text-sm">
              6 días descubriendo la historia y cultura de Cracovia
            </p>
          </div>
        </DesignCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <DesignCard className="text-center bg-blue-50 border-blue-200">
            <div className="text-2xl text-[#0066CC] mb-1">6</div>
            <div className="text-xs text-gray-600">Días</div>
          </DesignCard>
          <DesignCard className="text-center bg-green-50 border-green-200">
            <div className="text-2xl text-green-600 mb-1">8</div>
            <div className="text-xs text-gray-600">Reservas</div>
          </DesignCard>
          <DesignCard className="text-center bg-purple-50 border-purple-200">
            <div className="text-2xl text-purple-600 mb-1">12</div>
            <div className="text-xs text-gray-600">Lugares</div>
          </DesignCard>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <DesignCard 
                key={item.label}
                onClick={item.onClick}
                className="flex items-center gap-4"
              >
                <div className="bg-blue-50 rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-[#0066CC]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-900 mb-0.5">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </DesignCard>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}