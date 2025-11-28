import { X, ChevronRight, Plane, Hotel, Utensils, MapPin, FileText } from "lucide-react";
import { DesignCard } from "./design-card";
import { CategoryBadge, getCategoryIconBg, getCategoryIconColor } from "./category-badge";

interface Activity {
  time: string;
  title: string;
  type: "transport" | "accommodation" | "food" | "activity" | "other";
  category?: string;
  hasDocument?: boolean;
  hasReservation?: boolean;
}

interface DayActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  month: string;
  activities: Activity[];
  onNavigateToReservation?: (activity: Activity) => void;
  onNavigateToDocument?: (activity: Activity) => void;
}

export function DayActivitiesModal({
  isOpen,
  onClose,
  day,
  month,
  activities,
  onNavigateToReservation,
  onNavigateToDocument,
}: DayActivitiesModalProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "transport":
        return Plane;
      case "accommodation":
        return Hotel;
      case "food":
        return Utensils;
      case "activity":
        return MapPin;
      default:
        return FileText;
    }
  };

  const getCategoryLabel = (type: string) => {
    switch (type) {
      case "transport":
        return "Transporte";
      case "accommodation":
        return "Alojamiento";
      case "food":
        return "Comida";
      case "activity":
        return "Actividad";
      default:
        return "Otro";
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="bg-white rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-[#0066CC] to-[#003580]">
            <div>
              <h2 className="text-white mb-1">Actividades del día</h2>
              <p className="text-blue-100 text-sm">{day} {month}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Activities List */}
          <div className="flex-1 overflow-y-auto p-6">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No hay actividades para este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => {
                  const Icon = getIcon(activity.type);
                  const hasActions = activity.hasReservation || activity.hasDocument;

                  return (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${getCategoryIconBg(activity.type)} rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${getCategoryIconColor(activity.type)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-sm text-gray-500">{activity.time}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-900">{activity.title}</span>
                          </div>
                          <CategoryBadge
                            category={activity.type}
                            label={getCategoryLabel(activity.type)}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {hasActions && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                          {activity.hasReservation && (
                            <button
                              onClick={() => onNavigateToReservation?.(activity)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-[#0066CC] hover:text-[#0066CC] transition-all"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Ver reserva</span>
                            </button>
                          )}
                          {activity.hasDocument && (
                            <button
                              onClick={() => onNavigateToDocument?.(activity)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:border-[#0066CC] hover:text-[#0066CC] transition-all"
                            >
                              <FileText className="w-4 h-4" />
                              <span>Ver documento</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-[#FFC043] to-[#FFB400] hover:from-[#FFB400] hover:to-[#FFA500] text-[#003580] py-3 rounded-2xl transition-all shadow-md"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
