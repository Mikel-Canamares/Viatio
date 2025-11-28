import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { FormInput } from "./components/ui/form-input";
import { FormTextarea } from "./components/ui/form-textarea";
import { FormSelect } from "./components/ui/form-select";
import { PrimaryButton } from "./components/ui/primary-button";
import { SectionHeader } from "./components/ui/section-header";
import { DesignCard } from "./components/ui/design-card";
import { Edit3, Camera } from "lucide-react";
import { useState } from "react";

interface AddReservationProps {
  onBack: () => void;
}

export default function AddReservation({ onBack }: AddReservationProps) {
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "scan" | null>(null);

  const categoryOptions = [
    { value: "transport", label: "Transporte" },
    { value: "accommodation", label: "Alojamiento" },
    { value: "food", label: "Comida" },
    { value: "activity", label: "Actividad" },
    { value: "other", label: "Otro" },
  ];

  // Si no ha seleccionado método, mostrar las opciones
  if (!selectedMethod) {
    return (
      <PageContainer>
        <PageHeader 
          title="Añadir reserva" 
          subtitle="Cracovia · 21 dic – 27 dic"
          onBack={onBack}
        />

        <div className="px-6 py-6 space-y-4">
          <button 
            onClick={() => setSelectedMethod("manual")}
            className="w-full text-left"
          >
            <DesignCard>
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Edit3 className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#111827] mb-1">Añadir manualmente</h3>
                  <p className="text-sm text-gray-500">
                    Introduce los datos de tu reserva
                  </p>
                </div>
              </div>
            </DesignCard>
          </button>

          <button 
            onClick={() => setSelectedMethod("scan")}
            className="w-full text-left"
          >
            <DesignCard>
              <div className="flex items-start gap-4 p-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[#111827] mb-1">Escanear documento</h3>
                  <p className="text-sm text-gray-500">
                    Sube una foto o captura y rellenará los datos automáticamente
                  </p>
                </div>
              </div>
            </DesignCard>
          </button>
        </div>
      </PageContainer>
    );
  }

  // Si seleccionó escanear, mostrar la pantalla de escaneo
  if (selectedMethod === "scan") {
    return (
      <PageContainer>
        <PageHeader 
          title="Escanear documento" 
          subtitle="Cracovia · 21 dic – 27 dic"
          onBack={() => setSelectedMethod(null)}
        />

        <div className="px-6 py-6 space-y-6">
          <DesignCard>
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Camera className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-[#111827] mb-2">Escanear o subir documento</h3>
              <p className="text-sm text-gray-500 mb-6">
                Toma una foto del documento de tu reserva o sube una imagen desde tu galería
              </p>
              
              <div className="space-y-3 w-full">
                <PrimaryButton>
                  Tomar foto
                </PrimaryButton>
                <button className="w-full px-6 py-3 text-[#2563EB] hover:bg-blue-50 rounded-xl transition-colors">
                  Subir desde galería
                </button>
              </div>
            </div>
          </DesignCard>

          <button 
            onClick={() => setSelectedMethod("manual")}
            className="w-full text-center text-sm text-gray-500 hover:text-[#111827] transition-colors"
          >
            Añadir manualmente en su lugar
          </button>
        </div>
      </PageContainer>
    );
  }

  // Si seleccionó manual, mostrar el formulario
  return (
    <PageContainer>
      <PageHeader 
        title="Añadir reserva" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={() => setSelectedMethod(null)}
      />

      <div className="px-6 py-6 space-y-6 pb-8">
        <div className="space-y-4">
          <SectionHeader title="Información básica" />
          
          <FormInput
            label="Nombre de la reserva"
            type="text"
            placeholder="Ej: Vuelo a Cracovia"
          />

          <FormSelect
            label="Categoría"
            options={categoryOptions}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="Fecha"
              type="date"
            />
            <FormInput
              label="Hora"
              type="time"
            />
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Detalles de la reserva" />
          
          <FormInput
            label="Número de confirmación (opcional)"
            type="text"
            placeholder="ABC123456"
          />

          <FormInput
            label="Ubicación (opcional)"
            type="text"
            placeholder="Dirección o lugar"
          />

          <FormTextarea
            label="Notas adicionales (opcional)"
            placeholder="Información adicional sobre la reserva..."
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <SectionHeader title="Información de pago" />
          
          <FormInput
            label="Precio (opcional)"
            type="number"
            placeholder="€"
          />

          <FormSelect
            label="Estado del pago"
            options={[
              { value: "paid", label: "Pagado" },
              { value: "pending", label: "Pendiente" },
              { value: "unpaid", label: "No pagado" },
            ]}
          />
        </div>

        <div className="pt-4">
          <PrimaryButton>
            Guardar reserva
          </PrimaryButton>
        </div>
      </div>
    </PageContainer>
  );
}