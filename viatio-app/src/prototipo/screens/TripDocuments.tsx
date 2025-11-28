import { FileText, Download, Plus, IdCard, Plane, Home, Shield, Ticket, FolderOpen } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";

interface TripDocumentsProps {
  onBack: () => void;
  onNavigateToAddDocument: () => void;
}

export default function TripDocuments({ onBack, onNavigateToAddDocument }: TripDocumentsProps) {
  const documents = [
    {
      name: "Pasaporte - Juan Pérez",
      type: "PDF",
      size: "2.4 MB",
      uploadedDate: "15 dic 2024",
      category: "identidad",
    },
    {
      name: "DNI - María García",
      type: "PDF",
      size: "1.8 MB",
      uploadedDate: "15 dic 2024",
      category: "identidad",
    },
    {
      name: "Confirmación Vuelo IB3452",
      type: "PDF",
      size: "856 KB",
      uploadedDate: "10 dic 2024",
      category: "transporte",
    },
    {
      name: "Billetes tren Varsovia-Cracovia",
      type: "PDF",
      size: "654 KB",
      uploadedDate: "10 dic 2024",
      category: "transporte",
    },
    {
      name: "Reserva Hotel Stary",
      type: "PDF",
      size: "1.2 MB",
      uploadedDate: "8 dic 2024",
      category: "alojamiento",
    },
    {
      name: "Seguro de viaje",
      type: "PDF",
      size: "3.1 MB",
      uploadedDate: "5 dic 2024",
      category: "seguro",
    },
  ];

  const categoryConfig: Record<string, { label: string; icon: any; bgColor: string; iconColor: string }> = {
    identidad: {
      label: "Identidad",
      icon: IdCard,
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    transporte: {
      label: "Transporte",
      icon: Plane,
      bgColor: "bg-blue-50",
      iconColor: "text-[#0066CC]",
    },
    alojamiento: {
      label: "Alojamiento",
      icon: Home,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    seguro: {
      label: "Seguro",
      icon: Shield,
      bgColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    actividades: {
      label: "Actividades",
      icon: Ticket,
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    otros: {
      label: "Otros",
      icon: FolderOpen,
      bgColor: "bg-gray-50",
      iconColor: "text-gray-600",
    },
  };

  // Agrupar documentos por categoría
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  return (
    <PageContainer>
      <PageHeader 
        title="Documentos" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-8 pb-24 bg-gray-50">
        {/* Documents grouped by category */}
        {Object.entries(groupedDocuments).map(([category, docs]) => {
          const config = categoryConfig[category];
          const CategoryIcon = config.icon;
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3 mb-4">
                <div className={`${config.bgColor} rounded-xl w-12 h-12 flex items-center justify-center`}>
                  <CategoryIcon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-gray-900">{config.label}</h3>
                  <p className="text-sm text-gray-600">
                    {docs.length} {docs.length === 1 ? 'archivo' : 'archivos'}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                {docs.map((doc, idx) => (
                  <DesignCard key={idx}>
                    <div className="flex items-start gap-3">
                      <div className={`${config.bgColor} rounded-xl w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                        <FileText className={`w-6 h-6 ${config.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 mb-1 truncate">{doc.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{doc.type}</span>
                          <span className="text-gray-300">·</span>
                          <span>{doc.size}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {doc.uploadedDate}
                        </p>
                      </div>
                      <button className={`${config.iconColor} hover:opacity-70 transition-opacity flex-shrink-0`}>
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </DesignCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 max-w-md">
        <button
          onClick={onNavigateToAddDocument}
          className="bg-[#FFC043] hover:bg-[#FFB400] text-[#003580] w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(255,192,67,0.4)] hover:shadow-[0_8px_24px_rgba(255,192,67,0.5)] transition-all flex items-center justify-center active:scale-95"
          aria-label="Añadir documento"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </PageContainer>
  );
}