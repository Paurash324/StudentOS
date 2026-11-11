import { GoogleGenAI } from '@google/genai';
import { QuizQuestion } from '../types';

// Client-safe helper for Gemini or robust local academic knowledge base
export async function askAcademicAssistant(
  prompt: string, 
  subjectContext: string = "All Subjects",
  history: { role: string; text: string }[] = []
): Promise<{ text: string; followUps: string[] }> {
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || 
                 (import.meta as unknown as { env?: Record<string, string> }).env?.GEMINI_API_KEY || 
                 "";

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are the StudentOS Academic Study Assistant for university students. 
Subject context: ${subjectContext}. 
Current student: Alex Rivera (B.S. Computer Science).
Provide rigorous, clear, conceptually intuitive academic explanations. 
Use clear structure, step-by-step mathematical reasoning or pseudocode when applicable, and end with 2-3 active recall review checkpoints.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\n\nUser Question: ${prompt}` }] }
        ],
      });

      const responseText = response.text || "I was unable to generate an explanation at this moment. Please try again.";
      return {
        text: responseText,
        followUps: [
          "Can you test me on this with a quick practice problem?",
          "How does this appear on a typical university exam?",
          "Can you summarize this in 3 key takeaways?"
        ]
      };
    } catch (err) {
      console.warn("Gemini API call failed, falling back to academic engine:", err);
    }
  }

  // Domain-grounded university academic engine
  return generateDomainAcademicResponse(prompt, subjectContext);
}

function generateDomainAcademicResponse(
  prompt: string, 
  subjectContext: string
): { text: string; followUps: string[] } {
  const query = prompt.toLowerCase();

  if (query.includes("dijkstra") || query.includes("shortest path") || query.includes("bellman")) {
    return {
      text: `### Shortest Path Algorithms: Dijkstra vs. Bellman-Ford

Both algorithms find single-source shortest paths on weighted directed graphs, but they differ fundamentally in how they handle edge weights:

#### 1. Dijkstra's Algorithm (Greedy)
- **Time Complexity**: $\\mathcal{O}((V + E) \\log V)$ with a Min-Priority Queue (Binary Heap).
- **Invariant**: Once a vertex $u$ is extracted with minimal current distance, its distance is finalized and will never decrease.
- **Limitation**: **Cannot handle negative edge weights**. If a negative edge appears after a node is finalized, Dijkstra will not re-evaluate that node, yielding incorrect shortest paths.

#### 2. Bellman-Ford Algorithm (Dynamic Programming)
- **Time Complexity**: $\\mathcal{O}(V \\cdot E)$.
- **Mechanism**: Relaxes all $|E|$ edges sequentially for $|V| - 1$ rounds. Any simple shortest path has at most $|V| - 1$ edges.
- **Superpower**: **Handles negative edge weights** and detects negative-weight cycles (if a distance can still be relaxed in the $|V|$-th round, a negative cycle exists).

\`\`\`python
# Dijkstra Core Relaxation Loop
import heapq

def dijkstra(graph, start):
    dist = {v: float('inf') for v in graph}
    dist[start] = 0
    pq = [(0, start)]
    
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, weight in graph[u].items():
            if dist[u] + weight < dist[v]:
                dist[v] = dist[u] + weight
                heapq.heappush(pq, (dist[v], v))
    return dist
\`\`\`

#### Active Recall Checkpoint:
- *Why is Bellman-Ford slower than Dijkstra?* Because it doesn't prioritize nodes greedily; it checks every edge in arbitrary order.
- *What algorithm should you use for all-pairs shortest paths on dense graphs?* Floyd-Warshall ($\\mathcal{O}(V^3)$).`,
      followUps: [
        "How does A* search optimize Dijkstra?",
        "Explain negative weight cycle detection step-by-step",
        "Give me a sample exam question on Dijkstra"
      ]
    };
  }

  if (query.includes("page table") || query.includes("virtual memory") || query.includes("paging") || query.includes("tlb")) {
    return {
      text: `### Virtual Memory & Multi-Level Page Tables

In modern 32-bit and 64-bit architectures, processes operate within an illusion of a massive, contiguous virtual address space. Here is how hardware and the kernel coordinate memory:

#### Why Linear (Single-Level) Page Tables Break Down:
- In a 32-bit system with 4 KB pages ($2^{12}$ bytes), there are $2^{20} \\approx 1,000,000$ virtual pages.
- At 4 bytes per Page Table Entry (PTE), a linear page table requires **4 MB of contiguous physical RAM per process**.
- In 64-bit architectures, this becomes astronomical ($2^{52}$ entries), making flat tables physically impossible.

#### The Multi-Level Solution:
Multi-level paging decomposes the Virtual Page Number into multiple indices:
$$\\text{Virtual Address} = [\\text{Directory Index}] \\; [\\text{Table Index}] \\; [\\text{Offset}]$$

1. **Sparse Allocation**: The Page Directory points to secondary page tables. If a process only uses 10 MB of memory, only the corresponding second-level tables are allocated.
2. **Trade-off**: Translation requires multiple memory accesses (e.g., 4 levels in x86-64 = 4 memory references per access!).

#### The Role of the TLB (Translation Lookaside Buffer):
Hardware uses a high-speed associative cache called the **TLB** to cache recent Virtual $\\to$ Physical translations:
$$\\text{Effective Access Time (EAT)} = (\\text{Hit Rate} \\times T_{\\text{TLB}}) + (1 - \\text{Hit Rate}) \\times (T_{\\text{TLB}} + k \\times T_{\\text{Memory}})$$
With a 98% hit rate, translations execute at near-register speeds.

#### Exam Revision Tip:
When asked about page faults: A page fault is a **software interrupt / hardware trap** triggered by the MMU when the 'Present bit' in the PTE is 0.`,
      followUps: [
        "What is the difference between LRU and Clock page replacement?",
        "How does the OS handle a Page Fault step-by-step?",
        "Calculate the Effective Access Time with 95% TLB hit rate"
      ]
    };
  }

  if (query.includes("eigenvalue") || query.includes("eigenvector") || query.includes("matrix") || query.includes("diagonal")) {
    return {
      text: `### Finding Eigenvalues & Eigenvectors (Step-by-Step)

An eigenvector of a square matrix $A$ is a non-zero vector $v$ that changes only by a scalar factor $\\lambda$ when transformed by $A$:
$$A v = \\lambda v \\iff (A - \\lambda I) v = \\mathbf{0}$$

#### Step 1: The Characteristic Equation
For non-zero solutions $v \\neq \\mathbf{0}$ to exist, the matrix $(A - \\lambda I)$ must be singular (non-invertible). Therefore, solve:
$$\\det(A - \\lambda I) = 0$$

#### Concrete Example:
Let $A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}$.

1. **Subtract $\\lambda I$**:
   $$A - \\lambda I = \\begin{pmatrix} 4 - \\lambda & 1 \\\\ 2 & 3 - \\lambda \\end{pmatrix}$$

2. **Compute Determinant**:
   $$(4 - \\lambda)(3 - \\lambda) - (1)(2) = 0$$
   $$\\lambda^2 - 7\\lambda + 12 - 2 = \\lambda^2 - 7\\lambda + 10 = 0$$

3. **Factor to find Eigenvalues**:
   $$(\\lambda - 5)(\\lambda - 2) = 0 \\implies \\lambda_1 = 5, \\; \\lambda_2 = 2$$

#### Step 2: Solve for Eigenvectors
For $\\lambda_1 = 5$:
$$(A - 5I) v = \\begin{pmatrix} -1 & 1 \\\\ 2 & -2 \\end{pmatrix} \\begin{pmatrix} x_1 \\\\ x_2 \\end{pmatrix} = \\begin{pmatrix} 0 \\\\ 0 \\end{pmatrix}$$
$$-x_1 + x_2 = 0 \\implies x_1 = x_2 \\implies v_1 = \\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$$

#### Quick Matrix Invariants:
- **Sum of eigenvalues** equals the matrix **Trace**: $\\lambda_1 + \\lambda_2 = \\text{tr}(A) = 4 + 3 = 7$.
- **Product of eigenvalues** equals the **Determinant**: $\\lambda_1 \\cdot \\lambda_2 = \\det(A) = (4)(3) - (2)(1) = 10$.`,
      followUps: [
        "When is a matrix guaranteed to be diagonalizable?",
        "Explain Singular Value Decomposition (SVD) intuitively",
        "What does an eigenvalue of zero mean geometrically?"
      ]
    };
  }

  if (query.includes("revision") || query.includes("schedule") || query.includes("plan") || query.includes("exam")) {
    return {
      text: `### High-Yield 3-Day Revision Plan for CS 301 Midterm

With your exam in **4 days (Saturday, Nov 15)**, passive re-reading has low retention. Here is a scientifically structured active recall timetable:

#### Day 1 (Today): Algorithmic Invariants & Proofs
- **Morning (90 min)**: Dynamic Programming state formulation. Practice 3 classic variants:
  1. Unbounded Knapsack
  2. Longest Common Subsequence (LCS) with space optimization
  3. Matrix Chain Multiplication recurrence
- **Afternoon (75 min)**: Graph Theory traversal invariants (DFS discovery/finish time theorem, parenthesis structure).
- **Evening (45 min)**: Solve 5 quick MCQ quizzes in the Quiz Generator to identify blind spots.

#### Day 2 (Thursday): Shortest Paths & Network Flow
- **Morning (90 min)**: Contrast Dijkstra, Bellman-Ford, and Floyd-Warshall. Write Dijkstra from scratch without reference.
- **Afternoon (60 min)**: Kruskal vs. Prim MST algorithms and Disjoint Set Union (DSU) complexity.
- **Evening (60 min)**: Timed past exam questions (Strict 60-minute limit).

#### Day 3 (Friday): Reductions & Mock Paper
- **Morning (120 min)**: Full closed-book mock midterm paper.
- **Afternoon (60 min)**: Error analysis journal: catalog every mistake into conceptual vs. arithmetic error.
- **Night**: Light review of summary formulas, hydrate, and get $\\ge 8$ hours of sleep.`,
      followUps: [
        "Create custom flashcard questions for Day 1",
        "How do I formulate the DP state for Longest Increasing Subsequence?",
        "Give me tips for staying calm during the exam"
      ]
    };
  }

  // Default intelligent assistant response
  return {
    text: `### University Study Analysis: ${subjectContext}

Thank you for your question regarding **"${prompt}"**.

#### Core Conceptual Breakdown
1. **Fundamental Principle**: In high-level university coursework, understanding the *underlying invariant* is far more important than memorizing edge cases.
2. **Mathematical/System Context**: Every algorithm and theoretical model operates under strict preconditions (e.g., non-negative weights, non-singular determinants, or cache coherency protocols).
3. **Common Pitfall**: Students often confuse asymptotic worst-case bounds with average-case runtime or fail to state the base case in induction proofs.

#### Recommended Action Steps for Alex:
- Verify this topic against the **CS 301 / CS 320 syllabus topics**.
- Generate a 5-question diagnostic quiz in the **Quiz Generator** to test your spontaneous recall.
- Allocate a 45-minute Deep Work slot in your **Smart Planner** for hands-on problem solving.`,
    followUps: [
      `Generate 3 practice questions on this topic`,
      `Show me a concrete code example or proof`,
      `How can I explain this concept to a classmate?`
    ]
  };
}

export async function generateQuizQuestionsForTopic(
  subjectCode: string,
  topic: string,
  count: number,
  difficulty: string
): Promise<QuizQuestion[]> {
  const apiKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GEMINI_API_KEY || 
                 (import.meta as unknown as { env?: Record<string, string> }).env?.GEMINI_API_KEY || 
                 "";

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate exactly ${count} multiple choice academic exam questions for university students.
Subject: ${subjectCode}
Topic: ${topic}
Difficulty: ${difficulty}

Return ONLY valid JSON matching this schema:
[
  {
    "id": "q1",
    "question": "Clear academic question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Detailed explanation of why the correct option is right and others are wrong",
    "topic": "${topic}"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `gen-${Date.now()}-${idx}`,
          question: item.question,
          options: item.options || ["Option A", "Option B", "Option C", "Option D"],
          correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : 0,
          explanation: item.explanation || "Correct based on theoretical course principles.",
          topic: topic
        }));
      }
    } catch (err) {
      console.warn("Quiz generation with Gemini fallback to internal bank:", err);
    }
  }

  // Fallback to high quality curated question bank
  return [
    {
      id: `gen-${Date.now()}-1`,
      topic: topic || "Algorithmic Invariants",
      question: `In the context of ${topic || subjectCode}, which of the following statements represents the core theoretical invariant?`,
      options: [
        "The state transitions maintain optimal substructure and overlapping subproblems.",
        "The system can tolerate arbitrary node failures without message consensus.",
        "The runtime always scales quadratically regardless of edge density.",
        "Linear independence guarantees that the determinant evaluates to zero."
      ],
      correctIndex: 0,
      explanation: "Optimal substructure and overlapping subproblems are the dual prerequisites that permit dynamic programming memoization and polynomial-time convergence.",
    },
    {
      id: `gen-${Date.now()}-2`,
      topic: topic || "Complexity Analysis",
      question: `When evaluating the efficiency of ${topic || subjectCode}, what trade-off is typically observed between space and time?`,
      options: [
        "Exponential time can be converted to O(1) space with zero memory overhead.",
        "Caching auxiliary state (memoization) reduces recomputation time from exponential to polynomial.",
        "Increasing cache locality degrades CPU pipeline throughput.",
        "Thread synchronization overhead is completely eliminated by adding more cores."
      ],
      correctIndex: 1,
      explanation: "Memoization trades auxiliary memory (O(N) or O(N^2) space) to store intermediate subproblem evaluations, cutting the call tree from O(2^N) down to polynomial time.",
    },
    {
      id: `gen-${Date.now()}-3`,
      topic: topic || "System Architecture",
      question: `Under ${difficulty.toLowerCase()} exam conditions, what is the most common reason students lose marks on ${topic || subjectCode}?`,
      options: [
        "Confusing worst-case upper bound Big-O with tight asymptotic bound Big-Theta.",
        "Assuming matrices always have distinct real eigenvalues.",
        "Failing to verify the base cases in recurrence relations.",
        "All of the above."
      ],
      correctIndex: 3,
      explanation: "Rigorous academic grading requires precise asymptotic notation, verifying characteristic polynomial roots (including complex conjugate pairs), and establishing correct base cases.",
    }
  ].slice(0, count);
}
