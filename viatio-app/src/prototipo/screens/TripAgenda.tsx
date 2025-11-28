import { MapPin, Clock, Calendar } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";

interface TripAgendaProps {
  onBack: () => void;
}

export default function TripAgenda({ onBack }: TripAgendaProps) {
  const agendaDays = [
    {
      day: "Día 1",
      date: "21 dic",
      activities: [
        { time: "08:00", title: "Vuelo Madrid → Cracovia", location: "Aeropuerto" },
        { time: "15:00", title: "Check-in hotel", location: "Old Town" },
        { time: "18:00", title: "Paseo por la plaza principal", location: "Rynek Główny" },
        { time: "20:00", title: "Cena típica polaca", location: "Restaurante Wierzynek" },
      ],
    },
    {
      day: "Día 2",
      date: "22 dic",
      activities: [
        { time: "09:00", title: "Visita al Castillo de Wawel", location: "Wawel" },
        { time: "13:00", title: "Almuerzo", location: "Kazimierz" },
        { time: "15:30", title: "Tour por el barrio judío", location: "Kazimierz" },
      ],
    },
    {
      day: "Día 3",
      date: "23 dic",
      activities: [
        { time: "10:00", title: "Minas de sal de Wieliczka", location: "Wieliczka" },
        { time: "16:00", title: "Regreso a Cracovia", location: "Centro" },
      ],
    },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Agenda del viaje" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-8 bg-gray-50">
        {agendaDays.map((day) => (
          <div key={day.day} className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl w-12 h-12 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#0066CC]" />
              </div>
              <div>
                <h3 className="text-gray-900">{day.day}</h3>
                <p className="text-sm text-gray-600">{day.date}</p>
              </div>
            </div>

            {day.activities.map((activity, idx) => (
              <DesignCard key={idx} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 rounded-lg px-3 py-2 flex-shrink-0 border border-blue-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                      <span className="text-sm text-[#0066CC]">{activity.time}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 mb-1">{activity.title}</h3>
                    <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  </div>
                </div>
              </DesignCard>
            ))}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}