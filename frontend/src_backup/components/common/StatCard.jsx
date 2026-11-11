export function StatCard({ title, value, subtitle, icon: Icon, badge, color = "indigo" }) {
  const colorMap = {
    indigo: {
      iconBg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
      accent: "text-indigo-600"
    },
    blue: {
      iconBg: "bg-blue-50 text-blue-600 border border-blue-100",
      accent: "text-blue-600"
    },
    emerald: {
      iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      accent: "text-emerald-600"
    },
    amber: {
      iconBg: "bg-amber-50 text-amber-600 border border-amber-100",
      accent: "text-amber-600"
    },
    rose: {
      iconBg: "bg-rose-50 text-rose-600 border border-rose-100",
      accent: "text-rose-600"
    }
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}

