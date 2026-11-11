import { useState, useMemo } from "react";
import { Plus, Search, BookOpen, Filter, ArrowUpDown } from "lucide-react";
import { useStudent } from "../../context/StudentContext";
import { SubjectCard } from "./SubjectCard";
import { SubjectFormModal } from "./SubjectFormModal";
import { EmptyState } from "../common/EmptyState";
import { calculateSubjectPriority } from "../../utils/priorityCalculator";

export function SubjectsView() {
  const { subjects } = useStudent();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("priority"); // priority, examDate, difficulty, name
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const filteredAndSortedSubjects = useMemo(() => {
    return subjects
      .filter((sub) => {
        const matchesSearch =
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (sub.topics && sub.topics.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesDiff =
          selectedDifficulty === "all" || sub.difficulty === Number(selectedDifficulty);

        return matchesSearch && matchesDiff;
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return (
            calculateSubjectPriority(b).priorityScore -
            calculateSubjectPriority(a).priorityScore
          );
        }
        if (sortBy === "examDate") {
          return new Date(a.examDate) - new Date(b.examDate);
        }
        if (sortBy === "difficulty") {
          return b.difficulty - a.difficulty;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [subjects, searchTerm, sortBy, selectedDifficulty]);

  const handleEdit = (sub) => {
    setEditingSubject(sub);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subject Hub</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your courses, credits, syllabus topics, and exam countdowns.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subjects, codes, topics..."
            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Difficulty Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Difficulties</option>
              <option value="1">Level 1 (Easy)</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3 (Medium)</option>
              <option value="4">Level 4 (Hard)</option>
              <option value="5">Level 5 (Very Hard)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="priority">Sort by Priority (Highest)</option>
              <option value="examDate">Sort by Exam Date (Soonest)</option>
              <option value="difficulty">Sort by Difficulty</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      {filteredAndSortedSubjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title={searchTerm ? "No matching subjects found" : "No subjects enrolled yet"}
          description={
            searchTerm
              ? `No subjects match the search query "${searchTerm}". Try adjusting your filters.`
              : "Add your first subject or load college demo data to begin tracking your academic progress."
          }
          actionText="Add New Subject"
          onAction={handleAddNew}
        />
      )}

      {/* Form Modal for Add/Edit */}
      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubject(null);
        }}
        initialData={editingSubject}
      />
    </div>
  );
}

