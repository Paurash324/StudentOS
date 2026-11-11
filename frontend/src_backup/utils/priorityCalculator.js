import { getDaysUntil } from "./formatters";

/**
 * Calculates subject priority score based on:
 * - Credits (Academic Weight)
 * - Difficulty (1-5)
 * - Confidence (1-5, lower confidence -> higher priority)
 * - Exam Proximity (Days until exam)
 */
export function calculateSubjectPriority(subject) {
  const daysUntil = getDaysUntil(subject.examDate);
  const credits = Number(subject.credits) || 3;
  const difficulty = Number(subject.difficulty) || 3;
  const confidence = Number(subject.confidence) || 3;

  // 1. Urgency Factor [0.1 to 1.0]
  let urgency = 0.15;
  if (daysUntil <= 0) {
    urgency = 1.0;
  } else if (daysUntil <= 3) {
    urgency = 1.0 - (daysUntil * 0.05); // 0.85 - 0.95
  } else if (daysUntil <= 7) {
    urgency = 0.85 - ((daysUntil - 3) * 0.05); // 0.65 - 0.80
  } else if (daysUntil <= 14) {
    urgency = 0.65 - ((daysUntil - 7) * 0.025); // 0.475 - 0.625
  } else if (daysUntil <= 30) {
    urgency = 0.475 - ((daysUntil - 14) * 0.015); // 0.235 - 0.46
  } else {
    urgency = 0.15;
  }

  // 2. Confidence Deficit Factor [0.0 to 1.0]
  // Lower confidence means HIGHER need for study
  const confidenceDeficit = Math.max(0, (5 - confidence) / 4);

  // 3. Difficulty Factor [0.2 to 1.0]
  const difficultyFactor = Math.min(1.0, Math.max(0.2, difficulty / 5));

  // 4. Credit Weight Factor [0.25 to 1.0]
  // 4 credits standard college baseline, capped at 1.0
  const creditFactor = Math.min(1.0, Math.max(0.25, credits / 4));

  // Weighted composite score (0 to 100)
  // Urgency: 35%, Confidence Deficit: 30%, Difficulty: 20%, Credits: 15%
  const compositeScore = (
    (urgency * 0.35) +
    (confidenceDeficit * 0.30) +
    (difficultyFactor * 0.20) +
    (creditFactor * 0.15)
  ) * 100;

  const score = Math.round(compositeScore * 10) / 10;

  // Categorize Tier
  let tier = "On Track";
  let tierColor = "emerald";
  let urgencyLabel = "Low Urgency";

  if (score >= 75) {
    tier = "Critical Focus";
    tierColor = "rose";
    urgencyLabel = "Immediate Action Needed";
  } else if (score >= 60) {
    tier = "High Priority";
    tierColor = "amber";
    urgencyLabel = "High Focus";
  } else if (score >= 40) {
    tier = "Moderate Priority";
    tierColor = "blue";
    urgencyLabel = "Steady Review";
  } else {
    tier = "Maintained";
    tierColor = "emerald";
    urgencyLabel = "Maintenance";
  }

  // Generate actionable recommendation
  let recommendation = "";
  if (daysUntil <= 3 && confidence <= 2) {
    recommendation = `🚨 Exam in ${daysUntil} days with low confidence. Schedule high-yield practice quizzes and intensive review today!`;
  } else if (daysUntil <= 7) {
    recommendation = `📅 Exam in ${daysUntil} days. Target problem sets and past paper questions.`;
  } else if (confidence <= 2) {
    recommendation = `🧠 Low confidence rating (${confidence}/5). Deep-dive into fundamental concepts and seek tutor support.`;
  } else if (difficulty >= 4) {
    recommendation = `⚙️ High difficulty (${difficulty}/5). Allocate steady 45-min blocks to prevent exam week cramming.`;
  } else {
    recommendation = `✅ Progress looks consistent. Keep up spaced repetition and quick flashcard reviews.`;
  }

  return {
    ...subject,
    priorityScore: score,
    daysUntil,
    urgencyFactor: Math.round(urgency * 100),
    confidenceDeficitFactor: Math.round(confidenceDeficit * 100),
    difficultyFactor: Math.round(difficultyFactor * 100),
    creditFactor: Math.round(creditFactor * 100),
    tier,
    tierColor,
    urgencyLabel,
    recommendation
  };
}

export function rankSubjects(subjects) {
  if (!subjects || subjects.length === 0) return [];
  const scored = subjects.map(calculateSubjectPriority);
  // Sort descending by priorityScore
  scored.sort((a, b) => b.priorityScore - a.priorityScore);
  return scored.map((sub, idx) => ({ ...sub, rank: idx + 1 }));
}

