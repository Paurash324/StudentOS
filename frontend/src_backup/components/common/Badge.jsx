export function Badge({ children, variant = "default", size = "sm", className = "" }) {
  const sizeClasses = {
    xs: "text-[11px] px-2 py-0.5",
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5"
  };

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-medium",
    blue: "bg-blue-50 text-blue-700 border border-blue-200/80 font-medium",
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
    amber: "bg-amber-50 text-amber-700 border border-amber-200/80 font-medium",
    rose: "bg-rose-50 text-rose-700 border border-rose-200/80 font-medium",
    purple: "bg-purple-50 text-purple-700 border border-purple-200/80 font-medium",
    outline: "bg-transparent text-slate-600 border border-slate-300"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-tight transition-colors ${
        sizeClasses[size] || sizeClasses.sm
      } ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
}

