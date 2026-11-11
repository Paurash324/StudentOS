// API Service for StudentOS Backend Communication

const API_BASE = "/api";

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Backend health check failed:", error);
    return {
      status: "unreachable",
      groq_configured: false,
      groq_model: "llama-3.3-70b-versatile",
      error: error.message
    };
  }
}

export async function sendChatMessage({ messages, subject, answer_style, system_prompt }) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      subject,
      answer_style: answer_style || "exam_ready",
      system_prompt
    })
  });

  if (!res.ok) {
    let errorDetail = "Failed to communicate with AI Assistant";
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function generateQuiz({ subject, topic, difficulty, num_questions }) {
  const res = await fetch(`${API_BASE}/generate-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subject,
      topic: topic || "Core syllabus and exam concepts",
      difficulty: difficulty || "Intermediate",
      num_questions: Number(num_questions) || 5
    })
  });

  if (!res.ok) {
    let errorDetail = "Failed to generate quiz";
    try {
      const errJson = await res.json();
      if (errJson.detail) errorDetail = errJson.detail;
    } catch {
      // fallback
    }
    throw new Error(errorDetail);
  }

  return await res.json();
}

export async function updateGroqKey(apiKey) {
  const res = await fetch(`${API_BASE}/set-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey })
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.detail || "Failed to update Groq API key");
  }

  return await res.json();
}

