import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { FormInput } from "./components/ui/form-input";
import { FormTextarea } from "./components/ui/form-textarea";
import { PrimaryButton } from "./components/ui/primary-button";
import { DesignCard } from "./components/ui/design-card";
import { MapPin, Wallet } from "lucide-react";

interface CreateTripProps {
  onBack: () => void;
}

export default function CreateTrip({ onBack }: CreateTripProps) {
  return (
    <PageContainer>
      <PageHeader 
        title="Nuevo viaje" 
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-8 bg-gray-50">
        <DesignCard className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 rounded-xl w-10 h-10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#0066CC]" />
            </div>
            <h3 className="text-gray-900">Información básica</h3>
          </div>
          
          <FormInput
            label="Destino"
            type="text"
            placeholder="Ej: París, Francia"
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Fecha de inicio"
              type="date"
            />
            <FormInput
              label="Fecha de fin"
              type="date"
            />
          </div>

          <FormTextarea
            label="Descripción (opcional)"
            placeholder="Añade notas sobre tu viaje..."
            rows={4}
          />
        </DesignCard>

        <DesignCard className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-50 rounded-xl w-10 h-10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-gray-900">Detalles adicionales</h3>
          </div>
          
          <FormInput
            label="Presupuesto estimado (opcional)"
            type="number"
            placeholder="€"
          />

          <FormInput
            label="Número de viajeros"
            type="number"
            placeholder="1"
            defaultValue="1"
          />
        </DesignCard>

        <div className="pt-4">
          <PrimaryButton>
            Crear viaje
          </PrimaryButton>
        </div>
      </div>
    </PageContainer>
  );
}