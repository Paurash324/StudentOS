import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

export function PriorityChart({ rankedSubjects }) {
  if (!rankedSubjects || rankedSubjects.length === 0) return null;

  const chartData = rankedSubjects.map((sub) => ({
    name: sub.code,
    fullName: sub.name,
    score: sub.priorityScore,
    daysUntil: sub.daysUntil,
    color: sub.color || "#4f46e5",
    tier: sub.tier
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-md text-xs">
          <p className="font-bold text-slate-900">{data.fullName} ({data.name})</p>
          <div className="mt-1.5 space-y-1">
            <p className="text-slate-600">
              Priority Index: <strong className="text-indigo-600">{data.score}/100</strong>
            </p>
            <p className="text-slate-600">
              Exam: <strong className="text-slate-800">{data.daysUntil} days remaining</strong>
            </p>
            <p className="text-slate-600">
              Status: <strong className="text-slate-800">{data.tier}</strong>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Priority Distribution Index</h3>
          <p className="text-xs text-slate-500">Comparative urgency and academic need across all enrolled courses</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &gt;75 Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 60-74 High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> &lt;60 Balanced
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#1e293b", fontWeight: 600 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={22}>
              {chartData.map((entry, index) => {
                const fillColor =
                  entry.score >= 75
                    ? "#e11d48"
                    : entry.score >= 60
                    ? "#d97706"
                    : "#4f46e5";
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

