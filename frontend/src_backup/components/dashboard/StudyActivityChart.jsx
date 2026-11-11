import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";
import { Clock, TrendingUp } from "lucide-react";
import { useStudent } from "../../context/StudentContext";

export function StudyActivityChart() {
  const { activityHistory } = useStudent();

  const totalLoggedThisWeek = activityHistory.reduce((a, b) => a + (b.hours || 0), 0).toFixed(1);
  const totalTargetThisWeek = activityHistory.reduce((a, b) => a + (b.target || 0), 0).toFixed(1);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3 shadow-md text-xs">
          <p className="font-bold text-slate-900 mb-1">{label}</p>
          <p className="text-indigo-600 font-semibold">
            Logged: {payload[0]?.value} hrs
          </p>
          <p className="text-slate-400 font-medium">
            Daily Goal: {payload[1]?.value} hrs
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">Weekly Study Velocity</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily study hours recorded vs target focus commitments
          </p>
        </div>

        <div className="text-right">
          <span className="text-base font-bold text-slate-900">
            {totalLoggedThisWeek}h
          </span>
          <span className="text-xs text-slate-400"> / {totalTargetThisWeek}h target</span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
            />
            <Bar name="Hours Studied" dataKey="hours" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={20} />
            <Bar name="Daily Target" dataKey="target" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

