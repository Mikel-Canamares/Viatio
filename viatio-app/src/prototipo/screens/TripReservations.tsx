import { Plane, Hotel, Utensils, Plus } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { CategoryBadge, getCategoryIconBg, getCategoryIconColor } from "./components/ui/category-badge";

interface TripReservationsProps {
  onBack: () => void;
  onNavigateToAddReservation: () => void;
  onNavigateToReservationDetail: () => void;
}

export default function TripReservations({ 
  onBack, 
  onNavigateToAddReservation,
  onNavigateToReservationDetail 
}: TripReservationsProps) {
  const reservations = [
    {
      type: "transport" as const,
      icon: Plane,
      title: "Vuelo Madrid → Cracovia",
      date: "21 dic",
      time: "08:00",
      details: "Iberia IB3452",
    },
    {
      type: "accommodation" as const,
      icon: Hotel,
      title: "Hotel Stary",
      date: "21 dic - 27 dic",
      time: "Check-in 15:00",
      details: "Habitación doble superior",
    },
    {
      type: "food" as const,
      icon: Utensils,
      title: "Restaurante Wierzynek",
      date: "21 dic",
      time: "20:00",
      details: "Reserva para 2 personas",
    },
    {
      type: "transport" as const,
      icon: Plane,
      title: "Vuelo Cracovia → Madrid",
      date: "27 dic",
      time: "18:30",
      details: "Iberia IB3453",
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Reservas" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-4 pb-24 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-900">Todas las reservas</h3>
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {reservations.length} confirmadas
          </span>
        </div>

        {reservations.map((reservation, idx) => {
          const Icon = reservation.icon;
          return (
            <DesignCard 
              key={idx}
              onClick={onNavigateToReservationDetail}
              className="space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className={`${getCategoryIconBg(reservation.type)} rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${getCategoryIconColor(reservation.type)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 mb-1 truncate">{reservation.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{reservation.details}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge 
                      category={reservation.type}
                      label={`${reservation.date} · ${reservation.time}`}
                    />
                  </div>
                </div>
              </div>
            </DesignCard>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 max-w-md">
        <button
          onClick={onNavigateToAddReservation}
          className="bg-[#FFC043] hover:bg-[#FFB400] text-[#003580] w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(255,192,67,0.4)] hover:shadow-[0_8px_24px_rgba(255,192,67,0.5)] transition-all flex items-center justify-center active:scale-95"
          aria-label="Añadir reserva"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </PageContainer>
  );
}