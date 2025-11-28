import { Plane, Hotel, Utensils, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { SectionHeader } from "./components/ui/section-header";
import { PrimaryButton } from "./components/ui/primary-button";
import { CategoryBadge, getCategoryIconBg, getCategoryIconColor } from "./components/ui/category-badge";
import { DayActivitiesModal } from "./components/ui/day-activities-modal";

interface TripCalendarProps {
  onBack: () => void;
}

export default function TripCalendar({ onBack }: TripCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(21);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<number | null>(null);

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  const generateCalendarDays = () => {
    const days = [];
    const firstDay = 0;
    const totalDays = 31;

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  const dayEvents: { [key: number]: string[] } = {
    21: ["transport", "accommodation", "food"],
    22: ["activity", "food"],
    23: ["activity"],
    24: ["food", "activity"],
    25: ["food"],
    26: ["activity", "food"],
    27: ["transport", "food"],
  };

  // Actividades detalladas por día
  const dayActivities: { [key: number]: any[] } = {
    21: [
      { time: "08:00", title: "Vuelo Madrid → Cracovia", type: "transport", hasReservation: true, hasDocument: false },
      { time: "15:00", title: "Check-in Hotel Grand", type: "accommodation", hasReservation: true, hasDocument: true },
      { time: "20:00", title: "Cena típica polaca", type: "food", hasReservation: true, hasDocument: false },
    ],
    22: [
      { time: "10:00", title: "Tour por el casco antiguo", type: "activity", hasReservation: true, hasDocument: true },
      { time: "14:00", title: "Almuerzo en restaurante local", type: "food", hasReservation: false, hasDocument: false },
    ],
    23: [
      { time: "09:00", title: "Visita a Auschwitz", type: "activity", hasReservation: true, hasDocument: true },
    ],
    24: [
      { time: "13:00", title: "Comida en mercado navideño", type: "food", hasReservation: false, hasDocument: false },
      { time: "16:00", title: "Minas de sal de Wieliczka", type: "activity", hasReservation: true, hasDocument: true },
    ],
    25: [
      { time: "19:00", title: "Cena de Navidad", type: "food", hasReservation: true, hasDocument: false },
    ],
    26: [
      { time: "11:00", title: "Castillo de Wawel", type: "activity", hasReservation: false, hasDocument: true },
      { time: "15:00", title: "Café en Kazimierz", type: "food", hasReservation: false, hasDocument: false },
    ],
    27: [
      { time: "10:00", title: "Check-out del hotel", type: "accommodation", hasReservation: true, hasDocument: true },
      { time: "16:00", title: "Vuelo Cracovia → Madrid", type: "transport", hasReservation: true, hasDocument: false },
    ],
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    if (dayActivities[day]) {
      setModalDay(day);
      setModalOpen(true);
    }
  };

  const getEventDots = (day: number | null) => {
    if (!day || !dayEvents[day]) return null;
    
    const colors: { [key: string]: string } = {
      transport: "bg-blue-500",
      accommodation: "bg-green-500",
      activity: "bg-orange-500",
      food: "bg-pink-500",
      other: "bg-gray-400",
    };

    return (
      <div className="flex gap-0.5 justify-center mt-1">
        {dayEvents[day].slice(0, 3).map((event, idx) => (
          <div
            key={idx}
            className={`w-1 h-1 rounded-full ${colors[event]}`}
          />
        ))}
      </div>
    );
  };

  const selectedDayEvents = [
    { time: "08:00", title: "Vuelo Madrid → Cracovia", type: "transport" as const, icon: Plane },
    { time: "15:00", title: "Check-in hotel", type: "accommodation" as const, icon: Hotel },
    { time: "20:00", title: "Cena típica polaca", type: "food" as const, icon: Utensils },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Calendario del viaje" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-8">
        {/* Calendar Card */}
        <DesignCard>
          {/* Month Header */}
          <div className="flex items-center justify-between mb-6">
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-[#111827]">Diciembre 2024</h2>
            <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-gray-500 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                onClick={() => day && handleDayClick(day)}
                disabled={!day}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-xl text-sm
                  transition-all
                  ${!day ? "invisible" : ""}
                  ${day === selectedDay 
                    ? "bg-[#2563EB] text-white shadow-md scale-105" 
                    : day && dayEvents[day]
                    ? "bg-gray-50 text-[#111827] hover:bg-gray-100"
                    : "text-gray-400 hover:bg-gray-50"
                  }
                `}
              >
                {day && (
                  <>
                    <span>{day}</span>
                    {day !== selectedDay && getEventDots(day)}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-gray-600">Transporte</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-600">Alojamiento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-pink-500" />
                <span className="text-gray-600">Comida</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-gray-600">Actividades</span>
              </div>
            </div>
          </div>
        </DesignCard>

        {/* Events of the Day */}
        <div className="space-y-4">
          <SectionHeader 
            title="Eventos del día"
            subtitle={`${selectedDay} dic`}
          />

          <div className="space-y-3">
            {selectedDayEvents.map((event, index) => {
              const Icon = event.icon;

              return (
                <DesignCard key={index} className="flex items-start gap-3">
                  <div className={`${getCategoryIconBg(event.type)} rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${getCategoryIconColor(event.type)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">{event.time}</span>
                      <span className="text-gray-300">·</span>
                      <span className="text-[#111827]">{event.title}</span>
                    </div>
                    <CategoryBadge 
                      category={event.type}
                      label={
                        event.type === "transport" ? "Transporte" :
                        event.type === "accommodation" ? "Alojamiento" :
                        event.type === "food" ? "Comida" :
                        "Actividad"
                      }
                    />
                  </div>
                </DesignCard>
              );
            })}
          </div>
        </div>

        {/* View All Button */}
        <PrimaryButton>
          Ver todas las reservas
        </PrimaryButton>
      </div>

      {/* Day Activities Modal */}
      <DayActivitiesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        day={modalDay || 21}
        month="diciembre"
        activities={modalDay ? (dayActivities[modalDay] || []) : []}
        onNavigateToReservation={(activity) => {
          console.log("Navegar a reserva:", activity);
          // Aquí puedes añadir la lógica para navegar a la reserva
        }}
        onNavigateToDocument={(activity) => {
          console.log("Navegar a documento:", activity);
          // Aquí puedes añadir la lógica para navegar al documento
        }}
      />
    </PageContainer>
  );
}