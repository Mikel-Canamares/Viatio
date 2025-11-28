type CategoryType = "transport" | "accommodation" | "food" | "activity" | "other";

interface CategoryBadgeProps {
  category: CategoryType;
  label: string;
}

export function CategoryBadge({ category, label }: CategoryBadgeProps) {
  const styles = {
    transport: "bg-blue-50 text-[#0066CC] border-blue-200",
    accommodation: "bg-green-50 text-green-700 border-green-200",
    food: "bg-orange-50 text-orange-700 border-orange-200",
    activity: "bg-purple-50 text-purple-700 border-purple-200",
    other: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${styles[category]}`}>
      {label}
    </span>
  );
}

export function getCategoryColor(category: CategoryType): string {
  const colors = {
    transport: "#0066CC",
    accommodation: "#16A34A",
    food: "#EA580C",
    activity: "#9333EA",
    other: "#6B7280",
  };
  return colors[category];
}

export function getCategoryIconBg(category: CategoryType): string {
  const styles = {
    transport: "bg-blue-50",
    accommodation: "bg-green-50",
    food: "bg-orange-50",
    activity: "bg-purple-50",
    other: "bg-gray-50",
  };
  return styles[category];
}

export function getCategoryIconColor(category: CategoryType): string {
  const styles = {
    transport: "text-[#0066CC]",
    accommodation: "text-green-600",
    food: "text-orange-600",
    activity: "text-purple-600",
    other: "text-gray-600",
  };
  return styles[category];
}