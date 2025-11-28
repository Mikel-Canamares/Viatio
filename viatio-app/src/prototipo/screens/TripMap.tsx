import { MapPin, Plus, Calendar } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { CategoryBadge } from "./components/ui/category-badge";

interface TripMapProps {
  onBack: () => void;
}

export default function TripMap({ onBack }: TripMapProps) {
  const placesByDay = [
    {
      day: 1,
      date: "21 dic",
      dayLabel: "Día 1",
      places: [
        {
          name: "Hotel Stary",
          category: "accommodation" as const,
          address: "Szczepańska 5, 31-011 Kraków",
          type: "Alojamiento",
        },
        {
          name: "Plaza del Mercado",
          category: "activity" as const,
          address: "Rynek Główny, Kraków",
          type: "Plaza histórica",
        },
        {
          name: "Restaurante Wierzynek",
          category: "food" as const,
          address: "Rynek Główny 15, 31-008 Kraków",
          type: "Restaurante",
        },
      ],
    },
    {
      day: 2,
      date: "22 dic",
      dayLabel: "Día 2",
      places: [
        {
          name: "Castillo de Wawel",
          category: "activity" as const,
          address: "Wawel 5, 31-001 Kraków",
          type: "Atracción turística",
        },
        {
          name: "Barrio judío de Kazimierz",
          category: "activity" as const,
          address: "Kazimierz, Kraków",
          type: "Barrio histórico",
        },
      ],
    },
    {
      day: 3,
      date: "23 dic",
      dayLabel: "Día 3",
      places: [
        {
          name: "Minas de sal de Wieliczka",
          category: "activity" as const,
          address: "Daniłowicza 10, Wieliczka",
          type: "Excursión",
        },
      ],
    },
  ];

  const totalPlaces = placesByDay.reduce((sum, day) => sum + day.places.length, 0);

  return (
    <PageContainer>
      <PageHeader 
        title="Mapa del viaje" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-24 bg-gray-50">
        {/* Map Placeholder */}
        <DesignCard className="p-0 overflow-hidden">
          <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
            <div className="text-center relative z-10">
              <div className="bg-[#0066CC] rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <p className="text-gray-900">Mapa interactivo</p>
              <p className="text-gray-600 text-sm mt-1">Vista previa de Cracovia</p>
            </div>
          </div>
        </DesignCard>

        {/* Places grouped by day */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">Lugares guardados</h2>
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{totalPlaces} ubicaciones</span>
          </div>

          {placesByDay.map((dayData) => (
            <div key={dayData.day} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 rounded-xl w-12 h-12 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#0066CC]" />
                </div>
                <div>
                  <h3 className="text-gray-900">{dayData.dayLabel}</h3>
                  <p className="text-sm text-gray-600">{dayData.date} · {dayData.places.length} {dayData.places.length === 1 ? 'lugar' : 'lugares'}</p>
                </div>
              </div>

              {/* Places for this day */}
              <div className="grid gap-3 pl-0">
                {dayData.places.map((place, idx) => (
                  <DesignCard key={idx} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-[#0066CC]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 mb-1">{place.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{place.address}</p>
                        <div className="flex items-center gap-2">
                          <CategoryBadge 
                            category={place.category}
                            label={place.type}
                          />
                        </div>
                      </div>
                    </div>
                  </DesignCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 max-w-md">
        <button
          className="bg-[#FFC043] hover:bg-[#FFB400] text-[#003580] w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(255,192,67,0.4)] hover:shadow-[0_8px_24px_rgba(255,192,67,0.5)] transition-all flex items-center justify-center active:scale-95"
          aria-label="Añadir lugar"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </PageContainer>
  );
}