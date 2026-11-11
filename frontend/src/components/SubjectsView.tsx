import React, { useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  Sparkles, 
  X, 
  GraduationCap, 
  BarChart2, 
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { Subject, SubjectDifficulty, SubjectPriority, SyllabusTopic, PageTab } from '../types';

interface SubjectsViewProps {
  subjects: Subject[];
  onAddSubject: (newSubject: Subject) => void;
  onEditSubject?: (updatedSubject: Subject) => void;
  onDeleteSubject?: (subjectId: string) => void;
  onToggleTopic: (subjectId: string, topicId: string) => void;
  onLaunchQuizForSubject: (subjectId: string) => void;
  onNavigateTab: (tab: PageTab) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onToggleTopic,
  onLaunchQuizForSubject,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | SubjectDifficulty>('All');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // New Subject Form State
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [newProfessor, setNewProfessor] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<SubjectDifficulty>('Intermediate');
  const [newPriority, setNewPriority] = useState<SubjectPriority>('Medium');
  const [newConfidence, setNewConfidence] = useState<number>(70);
  const [newTopicsText, setNewTopicsText] = useState('Introduction & Overview\nCore Principles & Proofs\nMidterm Review\nAdvanced Applications\nFinal Synthesis');

  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sub.professor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || sub.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const topicLines = newTopicsText.split('\n').filter(line => line.trim().length > 0);
    const parsedTopics: SyllabusTopic[] = topicLines.map((line, idx) => ({
      id: `topic-${Date.now()}-${idx}`,
      title: line.trim(),
      completed: false,
      estimatedHours: 5,
    }));

    const subject: Subject = {
      id: `sub-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      credits: Number(newCredits) || 3,
      professor: newProfessor.trim() || "Faculty Instructor",
      difficulty: newDifficulty,
      confidence: newConfidence,
      priority: newPriority,
      color: "#6366F1",
      accentBg: "#EEF2FF",
      topics: parsedTopics.length > 0 ? parsedTopics : [
        { id: `t1-${Date.now()}`, title: "Course Fundamentals", completed: false, estimatedHours: 4 },
        { id: `t2-${Date.now()}`, title: "Midterm Preparation", completed: false, estimatedHours: 6 },
        { id: `t3-${Date.now()}`, title: "Comprehensive Capstone", completed: false, estimatedHours: 8 }
      ],
      nextExam: {
        title: "Module Examination",
        date: "Dec 15, 2026",
        daysLeft: 34,
        weight: "30% of grade"
      }
    };

    onAddSubject(subject);
    setIsAddModalOpen(false);
    // Reset form
    setNewCode('');
    setNewName('');
    setNewProfessor('');
  };

  const handleOpenEdit = (sub: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubject({ ...sub });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject || !onEditSubject) return;
    onEditSubject(editingSubject);
    setEditingSubject(null);
  };

  const handleDelete = (subId: string, subName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${subName}?`)) {
      onDeleteSubject?.(subId);
      if (selectedSubject?.id === subId) {
        setSelectedSubject(null);
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Subjects
          </h1>
          <p className="font-sans text-slate-500 text-sm mt-1 leading-relaxed">
            Track syllabus milestones, monitor mastery confidence, and launch active recall diagnostics.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="font-sans flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-600/30 whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.2]" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search subjects by code, title, or professor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs text-slate-800 bg-white border border-[#E5E9F2] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl self-start sm:self-auto">
          {(['All', 'Foundational', 'Intermediate', 'Advanced'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all cursor-pointer ${
                difficultyFilter === diff
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
        {filteredSubjects.map((sub) => {
          const completedTopicsCount = sub.topics.filter(t => t.completed).length;
          const progressPercent = Math.round((completedTopicsCount / Math.max(1, sub.topics.length)) * 100);

          const diffColor = 
            sub.difficulty === 'Advanced' ? 'text-purple-700 bg-purple-50 border-purple-200' :
            sub.difficulty === 'Intermediate' ? 'text-indigo-700 bg-indigo-50 border-indigo-200' :
            'text-emerald-700 bg-emerald-50 border-emerald-200';

          return (
            <div
              key={sub.id}
              className="bg-white border border-[#E5E9F2] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header row: Code, credits, difficulty, edit/delete */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-display text-xs font-bold text-indigo-600">
                      {sub.code}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-900 mt-0.5 leading-snug group-hover:text-indigo-900 transition-colors">
                      {sub.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border font-sans ${diffColor}`}>
                      {sub.difficulty}
                    </span>
                    {onEditSubject && (
                      <button
                        onClick={(e) => handleOpenEdit(sub, e)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit Subject"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteSubject && (
                      <button
                        onClick={(e) => handleDelete(sub.id, sub.name, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata: Professor & Credits */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-5 font-sans">
                  <span>{sub.professor}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-display font-semibold text-slate-600">{sub.credits} Credits</span>
                </div>

                {/* Metrics: Syllabus Progress */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="font-medium text-slate-700">Syllabus Completed</span>
                    <span className="font-display font-bold text-slate-900 tabular-nums">
                      {progressPercent}% <span className="text-slate-400 font-sans font-normal">({completedTopicsCount}/{sub.topics.length})</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Confidence Metric */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs font-sans">
                    <span className="text-slate-500">Student Confidence</span>
                    <span className="font-display font-bold text-slate-800 tabular-nums">
                      {sub.confidence}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${sub.confidence}%`,
                        backgroundColor: sub.confidence > 75 ? '#10B981' : sub.confidence > 60 ? '#6366F1' : '#F59E0B'
                      }}
                    />
                  </div>
                </div>

                {/* Next Milestone */}
                {sub.nextExam && (
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-100 text-xs mb-5 flex items-center justify-between font-sans">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Upcoming Assessment</span>
                      <span className="font-semibold text-slate-800">{sub.nextExam.title}</span>
                    </div>
                    <span className="font-display font-bold text-indigo-700 text-xs tabular-nums">
                      {sub.nextExam.daysLeft}d left
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 font-sans">
                <button
                  onClick={() => setSelectedSubject(sub)}
                  className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 py-1 cursor-pointer transition-colors"
                >
                  <span>Syllabus Topics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onLaunchQuizForSubject(sub.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50/90 hover:bg-indigo-100 active:scale-[0.99] rounded-lg transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Practice Quiz</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Syllabus Topics Drawer Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-xl p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-display text-xs font-bold text-indigo-600">
                  {selectedSubject.code} · {selectedSubject.credits} Credits
                </span>
                <h3 className="font-display text-lg font-bold text-slate-900 mt-0.5">
                  {selectedSubject.name}
                </h3>
                <p className="font-sans text-xs text-slate-500 mt-1">
                  Taught by {selectedSubject.professor} · {selectedSubject.difficulty} Difficulty
                </p>
              </div>
              <button
                onClick={() => setSelectedSubject(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Topics List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1 font-sans">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-sans">
                Course Syllabus Breakdown
              </div>
              {selectedSubject.topics.map((topic, idx) => (
                <div
                  key={topic.id}
                  onClick={() => onToggleTopic(selectedSubject.id, topic.id)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all flex items-start gap-3 cursor-pointer group"
                >
                  <button
                    className="mt-0.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 cursor-pointer"
                    aria-label={topic.completed ? "Mark incomplete" : "Mark complete"}
                  >
                    {topic.completed ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600 fill-indigo-50" />
                    ) : (
                      <Circle className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs ${
                        topic.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'
                      }`}>
                        Topic {idx + 1}: {topic.title}
                      </span>
                      <span className="font-display text-[11px] font-semibold text-slate-400 shrink-0 tabular-nums">
                        ~{topic.estimatedHours}h
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 font-sans">
              <span className="text-xs text-slate-500">
                <strong className="font-display text-slate-800">{selectedSubject.topics.filter(t => t.completed).length}</strong> of {selectedSubject.topics.length} topics finished
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedSubject(null);
                    onLaunchQuizForSubject(selectedSubject.id);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-2xs cursor-pointer"
                >
                  Generate Quiz for this Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">Add New Subject</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="font-semibold text-slate-700">Course Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS 301"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs uppercase"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Algorithms & Data Structures"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Professor / Instructor</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Ronald Sedgewick"
                    value={newProfessor}
                    onChange={(e) => setNewProfessor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={newCredits}
                    onChange={(e) => setNewCredits(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as SubjectDifficulty)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Foundational">Foundational</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as SubjectPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Confidence ({newConfidence}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Syllabus Topics (One per line)</span>
                  <span className="text-slate-400 font-normal">Optional</span>
                </label>
                <textarea
                  rows={4}
                  value={newTopicsText}
                  onChange={(e) => setNewTopicsText(e.target.value)}
                  placeholder="Topic 1: Foundations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs font-sans"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Create Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#E5E9F2] rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Pencil className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900">Edit Subject</h3>
              </div>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="font-semibold text-slate-700">Course Code</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.code}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs uppercase"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-slate-700">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Professor / Instructor</label>
                  <input
                    type="text"
                    value={editingSubject.professor}
                    onChange={(e) => setEditingSubject({ ...editingSubject, professor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={editingSubject.credits}
                    onChange={(e) => setEditingSubject({ ...editingSubject, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Difficulty</label>
                  <select
                    value={editingSubject.difficulty}
                    onChange={(e) => setEditingSubject({ ...editingSubject, difficulty: e.target.value as SubjectDifficulty })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="Foundational">Foundational</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Priority</label>
                  <select
                    value={editingSubject.priority}
                    onChange={(e) => setEditingSubject({ ...editingSubject, priority: e.target.value as SubjectPriority })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Confidence ({editingSubject.confidence}%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={editingSubject.confidence}
                    onChange={(e) => setEditingSubject({ ...editingSubject, confidence: Number(e.target.value) })}
                    className="w-full accent-indigo-600 mt-2"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl transition-all shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

