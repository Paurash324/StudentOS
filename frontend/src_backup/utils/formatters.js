export function getDaysUntil(dateString) {
  if (!dateString) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateString);
  exam.setHours(0, 0, 0, 0);
  const diffTime = exam - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatExamCountdown(dateString) {
  const days = getDaysUntil(dateString);
  if (days < 0) return { text: "Exam Completed", urgency: "done", days };
  if (days === 0) return { text: "Today!", urgency: "critical", days };
  if (days === 1) return { text: "Tomorrow!", urgency: "critical", days };
  if (days <= 3) return { text: `${days} days left`, urgency: "critical", days };
  if (days <= 7) return { text: `${days} days left`, urgency: "high", days };
  if (days <= 14) return { text: `${days} days left`, urgency: "medium", days };
  return { text: `${days} days away`, urgency: "normal", days };
}

export function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

