import { Plane, MapPin, Clock, CreditCard, FileText, Image as ImageIcon } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { SectionHeader } from "./components/ui/section-header";
import { CategoryBadge, getCategoryIconBg, getCategoryIconColor } from "./components/ui/category-badge";
import { SecondaryButton } from "./components/ui/secondary-button";

interface ReservationDetailProps {
  onBack: () => void;
}

export default function ReservationDetail({ onBack }: ReservationDetailProps) {
  return (
    <PageContainer>
      <PageHeader 
        title="Detalle de la reserva" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-8">
        {/* Header Card */}
        <DesignCard className="space-y-4">
          <div className="flex items-start gap-3">
            <div className={`${getCategoryIconBg("transport")} rounded-xl w-14 h-14 flex items-center justify-center flex-shrink-0`}>
              <Plane className={`w-7 h-7 ${getCategoryIconColor("transport")}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#111827] mb-2">Vuelo Madrid → Cracovia</h2>
              <CategoryBadge category="transport" label="Transporte" />
            </div>
          </div>
        </DesignCard>

        {/* Details */}
        <div className="space-y-3">
          <SectionHeader title="Información del vuelo" />
          
          <DesignCard className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Plane className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Aerolínea y vuelo</div>
                <div className="text-[#111827]">Iberia IB3452</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Fecha y hora</div>
                <div className="text-[#111827]">21 dic 2024 · 08:00</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Ruta</div>
                <div className="text-[#111827]">Madrid (MAD) → Cracovia (KRK)</div>
              </div>
            </div>
          </DesignCard>
        </div>

        {/* Confirmation */}
        <div className="space-y-3">
          <SectionHeader title="Confirmación" />
          
          <DesignCard>
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Número de confirmación</div>
                <div className="text-[#111827]">ABC123456789</div>
              </div>
            </div>
          </DesignCard>
        </div>

        {/* Payment */}
        <div className="space-y-3">
          <SectionHeader title="Información de pago" />
          
          <DesignCard className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">Precio</div>
                <div className="text-[#111827]">€89.99</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-gray-500">Estado</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-100">
                Pagado
              </span>
            </div>
          </DesignCard>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <SecondaryButton>
            <div className="flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <span>Ver documentos adjuntos</span>
            </div>
          </SecondaryButton>
        </div>
      </div>
    </PageContainer>
  );
}
