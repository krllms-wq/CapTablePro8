interface DerivedPillProps {
  label?: string;
  variant?: "default" | "warning";
  title?: string;
  className?: string;
  "aria-label"?: string;
}

export default function DerivedPill({
  label = "Derived",
  variant = "default",
  title,
  className = "",
  "aria-label": ariaLabel,
}: DerivedPillProps) {
  const baseClasses = "inline-flex items-center gap-1 rounded-full text-xs px-2 py-[2px] select-none";
  
  const variantClasses = {
    default: "bg-gray-100 text-gray-700 border border-gray-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={title}
      aria-label={ariaLabel || label}
      role="note"
    >
      {variant === "warning" && <span aria-hidden="true">!</span>}
      {label}
    </span>
  );
}