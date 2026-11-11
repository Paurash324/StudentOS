import { rankSubjects } from "./priorityCalculator";

/**
 * Generates an optimal daily schedule based on priority ranking and available study hours.
 */
export function generateDailySchedule({
  subjects,
  dailyHours = 4,
  blockMinutes = 45,
  breakMinutes = 15,
  startTime = "09:00"
}) {
  if (!subjects || subjects.length === 0) return [];

  const ranked = rankSubjects(subjects);
  const totalAvailableMinutes = Math.round(dailyHours * 60);

  // Focus tasks library for realistic study block action items
  const taskLibrary = [
    "Review core lecture slides & synthesize summary notes",
    "Solve 3-5 challenging numerical & algorithmic problem sets",
    "Generate and complete an AI diagnostic quiz",
    "Active recall: test yourself on definitions and formula proofs",
    "Review previous exam mistakes and clarify weak concepts",
    "Synthesize chapter cheat-sheet for rapid revision",
    "Practice timed past paper questions"
  ];

  const schedule = [];
  let remainingMinutes = totalAvailableMinutes;

  // Helper to add minutes to "HH:MM"
  function addMinutesToTime(timeStr, minsToAdd) {
    const [h, m] = timeStr.split(":").map(Number);
    const totalMinutes = h * 60 + m + minsToAdd;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    const period = newH >= 12 ? "PM" : "AM";
    const displayH = newH % 12 === 0 ? 12 : newH % 12;
    const displayM = newM < 10 ? `0${newM}` : newM;
    return {
      formatted: `${displayH}:${displayM} ${period}`,
      raw: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`
    };
  }

  let currentTime = startTime;
  let blockCounter = 1;
  let subjectIdx = 0;

  // We assign more blocks to top-ranked subjects
  // e.g. Subject 1 gets 2 blocks, Subject 2 gets 2 blocks, Subject 3 gets 1 block, etc.
  const subjectQueue = [];
  ranked.forEach((sub, idx) => {
    // Top 2 subjects get 2 blocks if time permits
    const weight = idx === 0 ? 3 : idx === 1 ? 2 : 1;
    for (let w = 0; w < weight; w++) {
      subjectQueue.push(sub);
    }
  });

  while (remainingMinutes >= 25 && subjectQueue.length > 0) {
    const currentSubject = subjectQueue[subjectIdx % subjectQueue.length];
    subjectIdx++;

    const actualBlockMinutes = Math.min(blockMinutes, remainingMinutes);
    const timeStart = addMinutesToTime(currentTime, 0).formatted;
    const timeEndObj = addMinutesToTime(currentTime, actualBlockMinutes);
    const timeEnd = timeEndObj.formatted;

    const taskText = taskLibrary[(blockCounter - 1) % taskLibrary.length];

    schedule.push({
      id: `block-${Date.now()}-${blockCounter}`,
      type: "study",
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      subjectCode: currentSubject.code,
      subjectColor: currentSubject.color || "#4f46e5",
      startTime: timeStart,
      endTime: timeEnd,
      duration: actualBlockMinutes,
      task: `${currentSubject.code}: ${taskText}`,
      priorityScore: currentSubject.priorityScore,
      completed: false
    });

    currentTime = timeEndObj.raw;
    remainingMinutes -= actualBlockMinutes;
    blockCounter++;

    // Add rest break if time remains and break is desired
    if (remainingMinutes >= 15 && breakMinutes > 0) {
      const actualBreak = Math.min(breakMinutes, remainingMinutes);
      const breakStart = addMinutesToTime(currentTime, 0).formatted;
      const breakEndObj = addMinutesToTime(currentTime, actualBreak);
      const breakEnd = breakEndObj.formatted;

      schedule.push({
        id: `break-${Date.now()}-${blockCounter}`,
        type: "break",
        subjectName: "Hydration & Rest Break",
        startTime: breakStart,
        endTime: breakEnd,
        duration: actualBreak,
        task: "Step away from screen, hydrate, stretch, or take a quick walk",
        completed: false
      });

      currentTime = breakEndObj.raw;
      remainingMinutes -= actualBreak;
      blockCounter++;
    }
  }

  return schedule;
}

