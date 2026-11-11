import { BookOpen, Flame, Clock, Award, CheckCircle2 } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { StatCard } from "../common/StatCard";

export function StatsOverview() {
  const { subjects, rankedSubjects, dailySchedule } = useStudent();

  // Calculate metrics
  const totalSubjects = subjects.length;
  const urgentCount = rankedSubjects.filter((s) => s.priorityScore >= 60).length;

  const totalHoursStudied = subjects.reduce((acc, s) => acc + (s.hoursStudied || 0), 0);
  const totalTargetHours = subjects.reduce((acc, s) => acc + (s.targetHours || 25), 0);
  const hoursProgress = totalTargetHours > 0 ? Math.round((totalHoursStudied / totalTargetHours) * 100) : 0;

  const avgConfidence = totalSubjects > 0
    ? (subjects.reduce((acc, s) => acc + (s.confidence || 3), 0) / totalSubjects).toFixed(1)
    : "0.0";

  const completedTasks = dailySchedule.filter((t) => t.completed).length;
  const totalTasks = dailySchedule.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Enrolled Subjects */}
      <StatCard
        title="Enrolled Courses"
        value={totalSubjects}
        subtitle={`${subjects.reduce((a, b) => a + (b.credits || 0), 0)} Total Credits`}
        icon={BookOpen}
        color="indigo"
      />

      {/* 2. Priority Focus Needed */}
      <StatCard
        title="Urgent Course Focus"
        value={urgentCount}
        subtitle={urgentCount > 0 ? "Requires study attention this week" : "All subjects on track"}
        icon={Flame}
        color={urgentCount > 0 ? "rose" : "emerald"}
        badge={urgentCount > 0 ? "Action Needed" : "Optimal"}
      />

      {/* 3. Study Hours Completed */}
      <StatCard
        title="Hours Logged"
        value={`${totalHoursStudied}h`}
        subtitle={`${hoursProgress}% of semester target (${totalTargetHours}h)`}
        icon={Clock}
        color="blue"
      />

      {/* 4. Average Readiness */}
      <StatCard
        title="Average Confidence"
        value={`${avgConfidence} / 5`}
        subtitle={`${completedTasks} of ${totalTasks} daily planner blocks done`}
        icon={Award}
        color="amber"
      />
    </div>
  );
}

