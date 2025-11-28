import { useState } from "react";
import { TripCard } from "./components/TripCard";
import { Plus } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { BottomNav } from "./components/ui/bottom-nav";
import Login from "./Login";
import Profile from "./Profile";
import CreateTrip from "./CreateTrip";
import TripDetail from "./TripDetail";
import TripAgenda from "./TripAgenda";
import TripReservations from "./TripReservations";
import TripMap from "./TripMap";
import TripDocuments from "./TripDocuments";
import AddReservation from "./AddReservation";
import ReservationDetail from "./ReservationDetail";
import TripCalendar from "./TripCalendar";
import AddDocument from "./AddDocument";

const trips = [
  {
    id: 1,
    name: "Cracovia",
    dates: "21 dic - 27 dic",
    image: "https://images.unsplash.com/photo-1623784314023-fa78af3bff22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmFjb3ZpYSUyMHBvbGFuZHxlbnwxfHx8fDE3NjMxMjA3MDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 2,
    name: "Berlín",
    dates: "15 ene - 22 ene",
    image: "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZXJsaW4lMjBnZXJtYW55fGVufDF8fHx8MTc2MzA0NTEzM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 3,
    name: "Japón",
    dates: "5 feb - 12 feb",
    image: "https://images.unsplash.com/photo-1610338732118-09d3b6fd030c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXBhbiUyMHRlbXBsZXxlbnwxfHx8fDE3NjMwNTUwODF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
  {
    id: 4,
    name: "Costa Rica",
    dates: "10 mar - 18 mar",
    image: "https://images.unsplash.com/photo-1552727131-5fc6af16796d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3N0YSUyMHJpY2F8ZW58MXx8fHwxNzYzMTIxNDExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  },
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showTripDetail, setShowTripDetail] = useState(false);
  const [showTripAgenda, setShowTripAgenda] = useState(false);
  const [showTripReservations, setShowTripReservations] = useState(false);
  const [showTripMap, setShowTripMap] = useState(false);
  const [showTripDocuments, setShowTripDocuments] = useState(false);
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [showTripCalendar, setShowTripCalendar] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "calendar" | "profile">("home");

  // Si no está logueado, mostrar pantalla de login
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const handleTabChange = (tab: "home" | "calendar" | "profile") => {
    setActiveTab(tab);
    if (tab === "calendar") {
      // Reset all other screens before showing calendar
      setShowCreateTrip(false);
      setShowTripDetail(false);
      setShowTripAgenda(false);
      setShowTripReservations(false);
      setShowTripMap(false);
      setShowTripDocuments(false);
      setShowAddReservation(false);
      setShowReservationDetail(false);
      setShowAddDocument(false);
      setShowTripCalendar(true);
    } else if (tab === "home") {
      // Reset all screens
      setShowCreateTrip(false);
      setShowTripDetail(false);
      setShowTripAgenda(false);
      setShowTripReservations(false);
      setShowTripMap(false);
      setShowTripDocuments(false);
      setShowAddReservation(false);
      setShowReservationDetail(false);
      setShowAddDocument(false);
      setShowTripCalendar(false);
    } else if (tab === "profile") {
      // Reset all screens
      setShowCreateTrip(false);
      setShowTripDetail(false);
      setShowTripAgenda(false);
      setShowTripReservations(false);
      setShowTripMap(false);
      setShowTripDocuments(false);
      setShowAddReservation(false);
      setShowReservationDetail(false);
      setShowAddDocument(false);
      setShowTripCalendar(false);
    }
  };

  if (showCreateTrip) {
    return <CreateTrip onBack={() => setShowCreateTrip(false)} />;
  }

  if (showTripCalendar) {
    return <TripCalendar onBack={() => {
      setShowTripCalendar(false);
      setActiveTab("home");
    }} />;
  }

  if (showAddDocument) {
    return <AddDocument 
      onBack={() => {
        setShowAddDocument(false);
        setShowTripDocuments(true);
      }}
    />;
  }

  if (showReservationDetail) {
    return <ReservationDetail 
      onBack={() => {
        setShowReservationDetail(false);
        setShowTripReservations(true);
      }}
    />;
  }

  if (showAddReservation) {
    return <AddReservation onBack={() => {
      setShowAddReservation(false);
      setShowTripReservations(true);
    }} />;
  }

  if (showTripAgenda) {
    return <TripAgenda onBack={() => {
      setShowTripAgenda(false);
      setShowTripDetail(true);
    }} />;
  }

  if (showTripReservations) {
    return <TripReservations 
      onBack={() => {
        setShowTripReservations(false);
        setShowTripDetail(true);
      }} 
      onNavigateToAddReservation={() => {
        setShowTripReservations(false);
        setShowAddReservation(true);
      }}
      onNavigateToReservationDetail={() => {
        setShowTripReservations(false);
        setShowReservationDetail(true);
      }}
    />;
  }

  if (showTripMap) {
    return <TripMap onBack={() => {
      setShowTripMap(false);
      setShowTripDetail(true);
    }} />;
  }

  if (showTripDocuments) {
    return <TripDocuments 
      onBack={() => {
        setShowTripDocuments(false);
        setShowTripDetail(true);
      }}
      onNavigateToAddDocument={() => {
        setShowTripDocuments(false);
        setShowAddDocument(true);
      }}
    />;
  }

  if (showTripDetail) {
    return (
      <TripDetail 
        onBack={() => setShowTripDetail(false)} 
        onNavigateToAgenda={() => {
          setShowTripDetail(false);
          setShowTripAgenda(true);
        }}
        onNavigateToReservations={() => {
          setShowTripDetail(false);
          setShowTripReservations(true);
        }}
        onNavigateToMap={() => {
          setShowTripDetail(false);
          setShowTripMap(true);
        }}
        onNavigateToDocuments={() => {
          setShowTripDetail(false);
          setShowTripDocuments(true);
        }}
      />
    );
  }

  // Mostrar pantalla de perfil
  if (activeTab === "profile") {
    return (
      <>
        <Profile onLogout={() => setIsLoggedIn(false)} />
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </>
    );
  }

  // Pantalla principal de viajes
  return (
    <PageContainer>
      <PageHeader title="Próximos viajes" />
      
      <div className="px-6 pb-32 pt-6 space-y-3 bg-gray-50">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            image={trip.image}
            name={trip.name}
            dates={trip.dates}
            onClick={() => setShowTripDetail(true)}
          />
        ))}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 max-w-md">
        <button
          onClick={() => setShowCreateTrip(true)}
          className="bg-[#FFC043] hover:bg-[#FFB400] text-[#003580] w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(255,192,67,0.4)] hover:shadow-[0_8px_24px_rgba(255,192,67,0.5)] transition-all flex items-center justify-center active:scale-95"
          aria-label="Crear nuevo viaje"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </PageContainer>
  );
}