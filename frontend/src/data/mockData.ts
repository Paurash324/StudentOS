import { 
  Subject, 
  TodayTask, 
  Deadline, 
  DailyActivity, 
  TimetableBlock, 
  ChatMessage, 
  QuizQuestion, 
  StudentProfile 
} from '../types';

export const initialProfile: StudentProfile = {
  name: "Student",
  email: "student@university.edu",
  university: "University",
  major: "Computer Science",
  degree: "B.S. in Computer Science",
  semester: "Semester 4",
  avatarUrl: "",
  targetGpa: 3.90,
  currentGpa: 3.82,
  dailyGoalHours: 5.0,
  pomodoroWorkMinutes: 45,
  pomodoroBreakMinutes: 10,
};

export const initialSubjects: Subject[] = [
  {
    id: "cs301",
    code: "CS 301",
    name: "Algorithms & Data Structures",
    credits: 4,
    professor: "Dr. Ronald Sedgewick",
    difficulty: "Advanced",
    confidence: 82,
    priority: "High",
    color: "#6366F1", // Indigo
    accentBg: "#EEF2FF",
    topics: [
      { id: "cs301-1", title: "Asymptotic Analysis & Master Theorem", completed: true, estimatedHours: 4 },
      { id: "cs301-2", title: "Divide & Conquer: Strassen & Inversion Count", completed: true, estimatedHours: 6 },
      { id: "cs301-3", title: "Dynamic Programming: Knapsack & Edit Distance", completed: true, estimatedHours: 8 },
      { id: "cs301-4", title: "Graph Theory: BFS, DFS & Strongly Connected Components", completed: true, estimatedHours: 7 },
      { id: "cs301-5", title: "Shortest Paths: Dijkstra, Bellman-Ford & Floyd-Warshall", completed: true, estimatedHours: 6 },
      { id: "cs301-6", title: "Greedy Algorithms: Huffman Coding & Prim/Kruskal", completed: false, estimatedHours: 5 },
      { id: "cs301-7", title: "NP-Completeness & Reduction Techniques", completed: false, estimatedHours: 8 },
    ],
    nextExam: {
      title: "Midterm Exam II",
      date: "Nov 15, 2026",
      daysLeft: 4,
      weight: "25% of final grade",
    },
  },
  {
    id: "cs320",
    code: "CS 320",
    name: "Operating Systems & Concurrency",
    credits: 4,
    professor: "Prof. Elena Rostova",
    difficulty: "Advanced",
    confidence: 64,
    priority: "High",
    color: "#8B5CF6", // Violet
    accentBg: "#F5F3FF",
    topics: [
      { id: "cs320-1", title: "Processes, Threads & System Calls", completed: true, estimatedHours: 5 },
      { id: "cs320-2", title: "CPU Scheduling: Round Robin, MLFQ", completed: true, estimatedHours: 5 },
      { id: "cs320-3", title: "Synchronization: Mutex, Semaphores & Monitors", completed: true, estimatedHours: 8 },
      { id: "cs320-4", title: "Deadlocks: Banker's Algorithm & Prevention", completed: true, estimatedHours: 6 },
      { id: "cs320-5", title: "Virtual Memory: Paging, Segmentation & TLB", completed: false, estimatedHours: 7 },
      { id: "cs320-6", title: "Page Replacement Algorithms: LRU, Clock, Optimal", completed: false, estimatedHours: 6 },
      { id: "cs320-7", title: "File Systems, Inodes & Journaling", completed: false, estimatedHours: 6 },
    ],
    nextExam: {
      title: "Midterm Assessment",
      date: "Nov 28, 2026",
      daysLeft: 17,
      weight: "30% of final grade",
    },
  },
  {
    id: "math240",
    code: "MATH 240",
    name: "Linear Algebra & Matrix Theory",
    credits: 3,
    professor: "Dr. Marcus Wei",
    difficulty: "Intermediate",
    confidence: 74,
    priority: "Medium",
    color: "#0EA5E9", // Sky
    accentBg: "#F0F9FF",
    topics: [
      { id: "math240-1", title: "Gaussian Elimination & Matrix Inverses", completed: true, estimatedHours: 4 },
      { id: "math240-2", title: "Vector Spaces, Subspaces & Basis", completed: true, estimatedHours: 6 },
      { id: "math240-3", title: "Linear Transformations & Change of Basis", completed: true, estimatedHours: 6 },
      { id: "math240-4", title: "Inner Products & Gram-Schmidt Orthogonalization", completed: true, estimatedHours: 5 },
      { id: "math240-5", title: "Eigenvalues, Eigenvectors & Diagonalization", completed: false, estimatedHours: 7 },
      { id: "math240-6", title: "Singular Value Decomposition (SVD) Applications", completed: false, estimatedHours: 6 },
    ],
    nextExam: {
      title: "Module 3 Exam",
      date: "Dec 04, 2026",
      daysLeft: 23,
      weight: "20% of final grade",
    },
  },
  {
    id: "cs280",
    code: "CS 280",
    name: "Relational Database Systems",
    credits: 3,
    professor: "Prof. Sarah Jenkins",
    difficulty: "Intermediate",
    confidence: 88,
    priority: "Medium",
    color: "#10B981", // Emerald
    accentBg: "#ECFDF5",
    topics: [
      { id: "cs280-1", title: "Relational Algebra & Entity-Relationship Modeling", completed: true, estimatedHours: 5 },
      { id: "cs280-2", title: "Complex SQL Queries & Window Functions", completed: true, estimatedHours: 6 },
      { id: "cs280-3", title: "Normal Forms (1NF, 2NF, 3NF, BCNF)", completed: true, estimatedHours: 5 },
      { id: "cs280-4", title: "B+ Tree Indexing & Hash Indices", completed: true, estimatedHours: 6 },
      { id: "cs280-5", title: "Transaction Isolation Levels & ACID Guarantees", completed: true, estimatedHours: 5 },
      { id: "cs280-6", title: "Query Optimization & Execution Plans", completed: false, estimatedHours: 6 },
    ],
    nextExam: {
      title: "Final Project Defense",
      date: "Dec 11, 2026",
      daysLeft: 30,
      weight: "35% of final grade",
    },
  },
  {
    id: "phys150",
    code: "PHYS 150",
    name: "University Physics II: Electromagnetism",
    credits: 4,
    professor: "Dr. Arthur Pendelton",
    difficulty: "Advanced",
    confidence: 56,
    priority: "Low",
    color: "#F59E0B", // Amber
    accentBg: "#FFFBEB",
    topics: [
      { id: "phys150-1", title: "Coulomb's Law & Electric Fields", completed: true, estimatedHours: 5 },
      { id: "phys150-2", title: "Gauss's Law & Electric Potential", completed: true, estimatedHours: 6 },
      { id: "phys150-3", title: "Capacitance & Dielectrics", completed: true, estimatedHours: 4 },
      { id: "phys150-4", title: "Magnetic Fields & Biot-Savart Law", completed: false, estimatedHours: 6 },
      { id: "phys150-5", title: "Faraday's Law of Induction & Lenz's Law", completed: false, estimatedHours: 7 },
      { id: "phys150-6", title: "Maxwell's Equations & Electromagnetic Waves", completed: false, estimatedHours: 8 },
    ],
    nextExam: {
      title: "Midterm II: Electromagnetism",
      date: "Nov 22, 2026",
      daysLeft: 11,
      weight: "25% of final grade",
    },
  },
];

export const initialTodayTasks: TodayTask[] = [
  {
    id: "task-1",
    subjectCode: "CS 301",
    subjectName: "Algorithms & Data Structures",
    title: "Bellman-Ford & Negative Weight Cycle Practice",
    timeSlot: "08:30 – 09:15 AM",
    durationMinutes: 45,
    completed: true,
    priority: "High",
    category: "Deep Work",
  },
  {
    id: "task-2",
    subjectCode: "CS 320",
    subjectName: "Operating Systems",
    title: "Virtual Memory: Multilevel Paging & TLB Hit Rate",
    timeSlot: "09:25 – 10:10 AM",
    durationMinutes: 45,
    completed: false,
    priority: "High",
    category: "Deep Work",
  },
  {
    id: "task-3",
    subjectCode: "MATH 240",
    subjectName: "Linear Algebra",
    title: "Problem Set 6: Gram-Schmidt Orthogonalization",
    timeSlot: "10:20 – 11:05 AM",
    durationMinutes: 45,
    completed: false,
    priority: "Medium",
    category: "Practice",
  },
  {
    id: "task-4",
    subjectCode: "PHYS 150",
    subjectName: "University Physics II",
    title: "Biot-Savart Law Concept Check & Active Recall",
    timeSlot: "11:20 AM – 12:05 PM",
    durationMinutes: 45,
    completed: false,
    priority: "Low",
    category: "Revision",
  },
];

export const initialDeadlines: Deadline[] = [
  {
    id: "dl-1",
    subjectCode: "CS 301",
    title: "Midterm Exam II: Dynamic Programming & Graphs",
    dueDate: "Saturday, Nov 15",
    daysRemaining: 4,
    type: "Exam",
    urgency: "high",
    weight: "25%",
    completed: false,
  },
  {
    id: "dl-2",
    subjectCode: "CS 320",
    title: "Lab 3: Multithreaded Synchronization Barrier",
    dueDate: "Tuesday, Nov 17",
    daysRemaining: 6,
    type: "Assignment",
    urgency: "high",
    weight: "15%",
    completed: false,
  },
  {
    id: "dl-3",
    subjectCode: "PHYS 150",
    title: "Midterm II: Magnetic Fields & Ampere's Law",
    dueDate: "Sunday, Nov 22",
    daysRemaining: 11,
    type: "Exam",
    urgency: "medium",
    weight: "25%",
    completed: false,
  },
  {
    id: "dl-4",
    subjectCode: "MATH 240",
    title: "Problem Set 7: Eigenvalues & Diagonalization",
    dueDate: "Wednesday, Nov 25",
    daysRemaining: 14,
    type: "Assignment",
    urgency: "normal",
    weight: "10%",
    completed: false,
  },
  {
    id: "dl-5",
    subjectCode: "CS 280",
    title: "SQL Query Optimization Benchmark Report",
    dueDate: "Sunday, Nov 29",
    daysRemaining: 18,
    type: "Project",
    urgency: "normal",
    weight: "20%",
    completed: false,
  },
];

export const weeklyStudyActivity: DailyActivity[] = [
  {
    day: "Monday",
    shortDay: "Mon",
    hours: 5.2,
    target: 5.0,
    subjects: [
      { name: "CS 301", hours: 2.5, color: "#6366F1" },
      { name: "CS 320", hours: 1.7, color: "#8B5CF6" },
      { name: "MATH 240", hours: 1.0, color: "#0EA5E9" },
    ],
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    hours: 6.0,
    target: 5.0,
    subjects: [
      { name: "CS 301", hours: 3.0, color: "#6366F1" },
      { name: "CS 280", hours: 2.0, color: "#10B981" },
      { name: "PHYS 150", hours: 1.0, color: "#F59E0B" },
    ],
  },
  {
    day: "Wednesday (Today)",
    shortDay: "Wed",
    hours: 4.5,
    target: 5.0,
    subjects: [
      { name: "CS 301", hours: 1.5, color: "#6366F1" },
      { name: "CS 320", hours: 1.5, color: "#8B5CF6" },
      { name: "MATH 240", hours: 1.5, color: "#0EA5E9" },
    ],
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    hours: 5.5,
    target: 5.0,
    subjects: [
      { name: "CS 320", hours: 2.5, color: "#8B5CF6" },
      { name: "PHYS 150", hours: 1.8, color: "#F59E0B" },
      { name: "CS 301", hours: 1.2, color: "#6366F1" },
    ],
  },
  {
    day: "Friday",
    shortDay: "Fri",
    hours: 4.8,
    target: 5.0,
    subjects: [
      { name: "CS 301", hours: 2.8, color: "#6366F1" },
      { name: "CS 280", hours: 2.0, color: "#10B981" },
    ],
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    hours: 6.5,
    target: 5.0,
    subjects: [
      { name: "CS 301", hours: 3.5, color: "#6366F1" },
      { name: "CS 320", hours: 2.0, color: "#8B5CF6" },
      { name: "PHYS 150", hours: 1.0, color: "#F59E0B" },
    ],
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    hours: 3.5,
    target: 4.0,
    subjects: [
      { name: "MATH 240", hours: 2.0, color: "#0EA5E9" },
      { name: "CS 280", hours: 1.5, color: "#10B981" },
    ],
  },
];

export const initialTimetableBlocks: TimetableBlock[] = [
  {
    id: "tt-1",
    day: "Wednesday",
    timeRange: "08:30 – 09:15 AM",
    subjectCode: "CS 301",
    subjectName: "Algorithms & Data Structures",
    topic: "Bellman-Ford & Negative Weight Cycle Practice",
    blockType: "Deep Work",
    durationMinutes: 45,
    completed: true,
  },
  {
    id: "tt-break-1",
    day: "Wednesday",
    timeRange: "09:15 – 09:25 AM",
    subjectCode: "REST",
    subjectName: "Hydration & Walk",
    topic: "Cognitive reset before systems session",
    blockType: "Break",
    durationMinutes: 10,
    completed: true,
  },
  {
    id: "tt-2",
    day: "Wednesday",
    timeRange: "09:25 – 10:10 AM",
    subjectCode: "CS 320",
    subjectName: "Operating Systems",
    topic: "Virtual Memory: Multilevel Paging & TLB Hit Rate",
    blockType: "Deep Work",
    durationMinutes: 45,
    completed: false,
  },
  {
    id: "tt-break-2",
    day: "Wednesday",
    timeRange: "10:10 – 10:20 AM",
    subjectCode: "REST",
    subjectName: "Quick Coffee & Stretch",
    topic: "Short restorative break",
    blockType: "Break",
    durationMinutes: 10,
    completed: false,
  },
  {
    id: "tt-3",
    day: "Wednesday",
    timeRange: "10:20 – 11:05 AM",
    subjectCode: "MATH 240",
    subjectName: "Linear Algebra",
    topic: "Problem Set 6: Gram-Schmidt Orthogonalization",
    blockType: "Problem Solving",
    durationMinutes: 45,
    completed: false,
  },
  {
    id: "tt-break-3",
    day: "Wednesday",
    timeRange: "11:05 – 11:20 AM",
    subjectCode: "REST",
    subjectName: "Hydration & Fresh Air",
    topic: "Recovery interval before physics recall",
    blockType: "Break",
    durationMinutes: 15,
    completed: false,
  },
  {
    id: "tt-4",
    day: "Wednesday",
    timeRange: "11:20 AM – 12:05 PM",
    subjectCode: "PHYS 150",
    subjectName: "University Physics II",
    topic: "Biot-Savart Law Concept Check & Active Recall",
    blockType: "Active Recall",
    durationMinutes: 45,
    completed: false,
  },
];

export const initialAssistantMessages: ChatMessage[] = [
  {
    id: "msg-1",
    sender: "assistant",
    content: `Hello! I'm your **StudentOS Academic Assistant**. 

I have access to your syllabus across **CS 301, CS 320, MATH 240, CS 280, and PHYS 150**, and I'm aware that your **CS 301 Midterm II is in 4 days**.

What would you like to master today? I can explain challenging proofs, derive runtime bounds, break down systems architecture, or generate active recall flashcards.`,
    timestamp: "08:15 AM",
    subjectContext: "All Subjects",
    suggestedFollowUps: [
      "Explain Dijkstra's vs Bellman-Ford algorithms simply",
      "Why does a 2-level page table save physical memory?",
      "How to find the eigenvalues of a 2x2 matrix step-by-step",
      "Give me a 3-day revision strategy for CS 301 Midterm"
    ]
  }
];

export const sampleQuizQuestions: Record<string, QuizQuestion[]> = {
  "cs301": [
    {
      id: "q-cs301-1",
      topic: "Shortest Path & Graph Traversal",
      question: "Why does Dijkstra's Algorithm fail or produce incorrect results on graphs containing negative-weight edges?",
      options: [
        "It uses a FIFO queue which cannot process negative weights correctly.",
        "It greedily assumes that once a vertex is marked finalized (visited), its shortest path distance cannot be reduced further.",
        "It requires all edge weights to sum to a prime number.",
        "It cannot compute directed edge traversals."
      ],
      correctIndex: 1,
      explanation: "Dijkstra's greedy invariant dictates that when a node with minimum current distance is extracted from the priority queue, its distance is permanent. If a negative edge appears later in an alternative path, it could decrease an already finalized distance, violating this core greedy invariant."
    },
    {
      id: "q-cs301-2",
      topic: "Dynamic Programming",
      question: "What is the optimal time complexity to solve the 0/1 Knapsack problem with n items and maximum capacity W using Dynamic Programming?",
      options: [
        "O(n · log W)",
        "O(2^n)",
        "O(n · W) pseudo-polynomial time",
        "O(W^2)"
      ],
      correctIndex: 2,
      explanation: "The standard 2D dynamic programming table has dimensions (n + 1) × (W + 1), where each state transition takes O(1) time. Because the input size of W is represented in log2(W) bits, this algorithm runs in O(n · W) pseudo-polynomial time."
    },
    {
      id: "q-cs301-3",
      topic: "Divide and Conquer",
      question: "According to the Master Theorem, what is the asymptotic runtime of T(n) = 4T(n/2) + O(n)?",
      options: [
        "O(n log n)",
        "O(n^2)",
        "O(n^3)",
        "O(log n)"
      ],
      correctIndex: 1,
      explanation: "Here a = 4, b = 2, and f(n) = O(n^1). Since log_b(a) = log_2(4) = 2, we have f(n) = O(n^(log_b(a) - ε)) with ε = 1. By Case 1 of the Master Theorem, T(n) = Θ(n^(log_b(a))) = Θ(n^2)."
    },
    {
      id: "q-cs301-4",
      topic: "Minimum Spanning Trees",
      question: "Which data structure enables Kruskal's Algorithm to achieve an O(E log V) or O(E α(V)) runtime when sorting and edge validation are combined?",
      options: [
        "Disjoint Set Union (Union-Find) with path compression",
        "Fibonacci Heap only",
        "Red-Black Balanced Search Tree",
        "Trie prefix tree"
      ],
      correctIndex: 0,
      explanation: "Kruskal's algorithm sorts all edges in O(E log E) = O(E log V) time, and then uses a Disjoint Set Union (DSU) structure with path compression and rank heuristics to detect cycles in near-constant O(α(V)) amortized time per edge."
    },
    {
      id: "q-cs301-5",
      topic: "NP-Completeness",
      question: "To prove that a new decision problem X is NP-Complete, which step is fundamentally required?",
      options: [
        "Show X is in P, and reduce X to 3-SAT.",
        "Show X is in NP, and reduce a known NP-Complete problem Y to X in polynomial time (Y ≤p X).",
        "Prove that X cannot be solved by any deterministic Turing machine in finite steps.",
        "Reduce X to an arbitrary linear programming problem."
      ],
      correctIndex: 1,
      explanation: "NP-completeness requires: 1) Showing X is in NP (a certificate can be verified in polynomial time), and 2) Showing X is NP-hard by reducing an established NP-complete problem Y to X (Y ≤p X), proving that an efficient solver for X would solve all problems in NP."
    }
  ],
  "cs320": [
    {
      id: "q-cs320-1",
      topic: "Virtual Memory",
      question: "What is the primary architectural benefit of a Multi-Level Paging scheme over a Single-Level Linear Page Table?",
      options: [
        "It speeds up individual memory access times by bypassing the Translation Lookaside Buffer (TLB).",
        "It eliminates the need to allocate contiguous physical memory for unused virtual address regions.",
        "It increases the default page size from 4 KB to 2 MB without hardware support.",
        "It prevents page faults from ever occurring."
      ],
      correctIndex: 1,
      explanation: "In a single-level page table for a 32-bit or 64-bit space, the table itself must be large and contiguous in physical memory even if sparse. Multi-level paging allows unused sub-tables to remain unallocated, dramatically reducing kernel physical memory consumption."
    },
    {
      id: "q-cs320-2",
      topic: "Concurrency & Synchronization",
      question: "Which of the following conditions is NOT one of the four Coffman conditions necessary for a Deadlock to occur?",
      options: [
        "Mutual Exclusion",
        "Hold and Wait",
        "Preemptive Resource Revocation",
        "Circular Wait"
      ],
      correctIndex: 2,
      explanation: "The four Coffman conditions are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. If preemption IS allowed (i.e. resources can be forcefully revoked), deadlocks cannot persist."
    },
    {
      id: "q-cs320-3",
      topic: "Page Replacement",
      question: "What phenomenon occurs in FIFO page replacement where increasing the number of physical page frames can surprisingly lead to MORE page faults?",
      options: [
        "Thrashing Deficit",
        "Bélády's Anomaly",
        "Priority Inversion Paradox",
        "False Sharing Trap"
      ],
      correctIndex: 1,
      explanation: "Bélády's Anomaly describes the counter-intuitive behavior in certain non-stack page replacement algorithms (such as FIFO) where allocating more frames increases page faults for specific reference strings."
    }
  ],
  "math240": [
    {
      id: "q-math-1",
      topic: "Eigenvalues & Vectors",
      question: "For a square matrix A, what scalar equation must be solved to compute its eigenvalues λ?",
      options: [
        "det(A - λI) = 0",
        "trace(A) · λ = 1",
        "A^T · A = λ · I",
        "norm(A - λ) = 0"
      ],
      correctIndex: 0,
      explanation: "Since A v = λ v implies (A - λI) v = 0, a non-zero eigenvector v exists if and only if the matrix (A - λI) is singular, which requires its determinant to equal zero: det(A - λI) = 0 (the characteristic polynomial)."
    },
    {
      id: "q-math-2",
      topic: "Orthogonality",
      question: "If two non-zero vectors u and v in R^n have an inner product ⟨u, v⟩ = 0, what does this guarantee?",
      options: [
        "They are linearly dependent.",
        "They are orthogonal (perpendicular) to each other.",
        "Their vector sum is equal to zero.",
        "One vector must be the inverse of the other."
      ],
      correctIndex: 1,
      explanation: "By definition of the Euclidean inner product (dot product), ⟨u, v⟩ = ||u|| ||v|| cos(θ). When the inner product is 0 for non-zero vectors, cos(θ) = 0, meaning the angle θ = 90° and the vectors are orthogonal."
    }
  ],
  "cs280": [
    {
      id: "q-cs280-1",
      topic: "Indexing & Storage",
      question: "Why do relational databases predominantly use B+ Trees instead of Binary Search Trees for disk-based table indexing?",
      options: [
        "B+ Trees have a much higher branching factor (fan-out), which drastically minimizes the number of disk I/O operations required per search.",
        "Binary Search Trees cannot support duplicate values.",
        "B+ Trees consume zero memory in the buffer pool.",
        "Binary Search Trees cannot store string data."
      ],
      correctIndex: 0,
      explanation: "Disks and SSDs read and write data in blocks (e.g., 4KB or 8KB). A B+ tree node holds hundreds of keys, keeping tree height very low (usually 3–4 levels), requiring only 3–4 disk reads per lookup compared to dozens for an unbalanced or tall binary tree."
    }
  ],
  "phys150": [
    {
      id: "q-phys-1",
      topic: "Electromagnetism",
      question: "What physical law relates the line integral of magnetic field B around a closed loop to the electric current passing through the enclosed area?",
      options: [
        "Gauss's Law for Magnetism",
        "Ampère's Circuital Law",
        "Faraday's Law of Induction",
        "Coulomb's Law"
      ],
      correctIndex: 1,
      explanation: "Ampère's Circuital Law states that ∮ B · dl = μ₀ · I_enc (in magnetostatics). Maxwell later added the displacement current term (μ₀ε₀ ∂Φ_E/∂t) to generalize it to dynamic electromagnetic fields."
    }
  ]
};
