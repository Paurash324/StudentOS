// Initial sample data for StudentOS demo

export const INITIAL_SUBJECTS = [
  {
    id: "sub-1",
    name: "Distributed Systems & Cloud",
    code: "CS402",
    credits: 4,
    difficulty: 5, // 1 to 5
    confidence: 2, // 1 to 5 (needs urgent focus)
    examDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days away
    color: "#4f46e5", // Indigo
    topics: "Raft consensus, CAP theorem, MapReduce, Vector clocks, Fault tolerance",
    targetGrade: "A",
    hoursStudied: 14,
    targetHours: 32,
    notes: "Review Raft leader election paper and RPC failure modes."
  },
  {
    id: "sub-2",
    name: "Database Management Systems",
    code: "CS305",
    credits: 4,
    difficulty: 3,
    confidence: 4,
    examDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 11 days away
    color: "#2563eb", // Blue
    topics: "B+ Trees, ACID transactions, 2PL concurrency, Normalization, Query optimization",
    targetGrade: "A+",
    hoursStudied: 24,
    targetHours: 28,
    notes: "Solid on SQL, need to revise multi-granularity locking."
  },
  {
    id: "sub-3",
    name: "Compiler Design",
    code: "CS401",
    credits: 3,
    difficulty: 4,
    confidence: 2,
    examDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days away
    color: "#e11d48", // Rose
    topics: "Lexical analysis, LR(1) parsing, Intermediate code gen, Register allocation",
    targetGrade: "A",
    hoursStudied: 11,
    targetHours: 26,
    notes: "Practice bottom-up parsing tables and syntax directed translation."
  },
  {
    id: "sub-4",
    name: "Computer Networks",
    code: "CS308",
    credits: 3,
    difficulty: 3,
    confidence: 3,
    examDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 days away
    color: "#059669", // Emerald
    topics: "TCP congestion control, BGP routing, Subnetting, TLS handshake, DNS protocol",
    targetGrade: "A",
    hoursStudied: 16,
    targetHours: 24,
    notes: "Need to review TCP Reno vs Cubic congestion window formulas."
  },
  {
    id: "sub-5",
    name: "Linear Algebra & Optimization",
    code: "MA201",
    credits: 4,
    difficulty: 4,
    confidence: 3,
    examDate: new Date(Date.now() + 24 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 days away
    color: "#d97706", // Amber
    topics: "Eigenvalues, SVD decomposition, Gradient descent, Convex optimization",
    targetGrade: "A",
    hoursStudied: 12,
    targetHours: 30,
    notes: "Work through SVD matrix factorization problems."
  }
];

export const INITIAL_PREFERENCES = {
  dailyTargetHours: 4.5,
  preferredBlockMinutes: 45,
  breakMinutes: 15,
  startTime: "09:00",
  studentName: "Alex Rivera",
  university: "Institute of Technology",
  semester: "Fall 2026 • Semester 7"
};

export const INITIAL_ACTIVITY_HISTORY = [
  { day: "Mon", hours: 3.5, target: 4.0 },
  { day: "Tue", hours: 4.5, target: 4.0 },
  { day: "Wed", hours: 5.0, target: 4.0 },
  { day: "Thu", hours: 2.5, target: 4.0 },
  { day: "Fri", hours: 4.0, target: 4.0 },
  { day: "Sat", hours: 6.0, target: 4.5 },
  { day: "Sun", hours: 4.5, target: 4.5 }
];

