import { Upload, IdCard, Plane, Home, Shield, Ticket, FolderOpen } from "lucide-react";
import { PageContainer } from "./components/ui/page-container";
import { PageHeader } from "./components/ui/page-header";
import { DesignCard } from "./components/ui/design-card";
import { FormInput } from "./components/ui/form-input";
import { PrimaryButton } from "./components/ui/primary-button";
import { SecondaryButton } from "./components/ui/secondary-button";

interface AddDocumentProps {
  onBack: () => void;
}

export default function AddDocument({ onBack }: AddDocumentProps) {
  const categories = [
    { value: "identidad", label: "Identidad", icon: IdCard, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { value: "transporte", label: "Transporte", icon: Plane, color: "text-[#0066CC]", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { value: "alojamiento", label: "Alojamiento", icon: Home, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
    { value: "seguro", label: "Seguro", icon: Shield, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    { value: "actividades", label: "Actividades", icon: Ticket, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    { value: "otros", label: "Otros", icon: FolderOpen, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Añadir documento" 
        subtitle="Cracovia · 21 dic – 27 dic"
        onBack={onBack}
      />

      <div className="px-6 py-6 space-y-6 pb-24 bg-gray-50">
        {/* Upload Area */}
        <DesignCard className="border-2 border-dashed border-blue-300 bg-blue-50">
          <div className="text-center py-6">
            <div className="bg-[#0066CC] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2">Subir documento</h3>
            <p className="text-gray-600 text-sm mb-5">
              PDF, JPG o PNG hasta 10 MB
            </p>
            <SecondaryButton className="max-w-xs mx-auto">
              Seleccionar archivo
            </SecondaryButton>
          </div>
        </DesignCard>

        {/* Form */}
        <DesignCard className="space-y-5">
          <FormInput
            label="Nombre del documento"
            type="text"
            placeholder="Ej: Pasaporte - Juan Pérez"
          />

          <div>
            <label className="block text-sm text-gray-700 mb-3">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`${cat.bgColor} border ${cat.borderColor} hover:shadow-md rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-95`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-lg w-11 h-11 flex items-center justify-center shadow-sm">
                        <CategoryIcon className={`w-5 h-5 ${cat.color}`} />
                      </div>
                      <span className="text-gray-900 text-sm">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DesignCard>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-md mx-auto shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <PrimaryButton className="w-full">
          Guardar documento
        </PrimaryButton>
      </div>
    </PageContainer>
  );
}