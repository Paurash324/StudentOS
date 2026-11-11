import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { useStudent } from "../../context/StudentContext";

const COLOR_OPTIONS = [
  { name: "Indigo", hex: "#4f46e5", bg: "bg-indigo-600" },
  { name: "Blue", hex: "#2563eb", bg: "bg-blue-600" },
  { name: "Emerald", hex: "#059669", bg: "bg-emerald-600" },
  { name: "Rose", hex: "#e11d48", bg: "bg-rose-600" },
  { name: "Amber", hex: "#d97706", bg: "bg-amber-600" },
  { name: "Purple", hex: "#7c3aed", bg: "bg-purple-600" }
];

export function SubjectFormModal({ isOpen, onClose, initialData = null }) {
  const { addSubject, updateSubject } = useStudent();
  const isEditing = Boolean(initialData);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: 3,
    difficulty: 3,
    confidence: 3,
    examDate: "",
    targetGrade: "A",
    targetHours: 25,
    hoursStudied: 0,
    topics: "",
    color: "#4f46e5"
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        credits: initialData.credits || 3,
        difficulty: initialData.difficulty || 3,
        confidence: initialData.confidence || 3,
        examDate: initialData.examDate || "",
        targetGrade: initialData.targetGrade || "A",
        targetHours: initialData.targetHours || 25,
        hoursStudied: initialData.hoursStudied || 0,
        topics: initialData.topics || "",
        color: initialData.color || "#4f46e5"
      });
    } else {
      // Default to next week for new subject
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        name: "",
        code: "",
        credits: 3,
        difficulty: 3,
        confidence: 3,
        examDate: nextWeek,
        targetGrade: "A",
        targetHours: 25,
        hoursStudied: 0,
        topics: "",
        color: "#4f46e5"
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "credits" || name === "difficulty" || name === "confidence" || name === "targetHours" || name === "hoursStudied"
        ? Number(value)
        : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Subject name is required";
    if (!formData.code.trim()) newErrors.code = "Course code is required";
    if (!formData.examDate) newErrors.examDate = "Exam date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (isEditing && initialData.id) {
      updateSubject(initialData.id, formData);
    } else {
      addSubject(formData);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Subject" : "Add New Subject"}
      subtitle="Configure academic parameters for the priority engine and smart planner"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and Code */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Distributed Systems & Cloud"
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. CS402"
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.code ? "border-rose-400 bg-rose-50/30" : "border-slate-200"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase`}
            />
            {errors.code && <p className="text-[11px] text-rose-500 mt-1">{errors.code}</p>}
          </div>
        </div>

        {/* Exam Date & Target Grade & Credits */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exam Date *
            </label>
            <input
              type="date"
              name="examDate"
              value={formData.examDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm rounded-xl border ${
                errors.examDate ? "border-rose-400" : "border-slate-200"
              } focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
            />
            {errors.examDate && <p className="text-[11px] text-rose-500 mt-1">{errors.examDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Credits (1 - 6)
            </label>
            <select
              name="credits"
              value={formData.credits}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {[1, 2, 3, 4, 5, 6].map((c) => (
                <option key={c} value={c}>
                  {c} Credits
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Grade
            </label>
            <select
              name="targetGrade"
              value={formData.targetGrade}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            >
              {["A+", "A", "A-", "B+", "B", "B-", "C+", "Pass"].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sliders: Difficulty & Confidence */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Subject Difficulty: <span className="text-indigo-600 font-bold">{formData.difficulty}/5</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {formData.difficulty === 1 ? "Introductory" : formData.difficulty === 3 ? "Standard" : formData.difficulty === 5 ? "Very Hard" : "Challenging"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>1 - Easy</span>
              <span>3 - Medium</span>
              <span>5 - Hardest</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Current Confidence: <span className="text-indigo-600 font-bold">{formData.confidence}/5</span>
              </label>
              <span className="text-[10px] text-slate-500 font-medium">
                {formData.confidence <= 2 ? "Needs Work" : formData.confidence === 3 ? "Moderate" : "Confident"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              name="confidence"
              value={formData.confidence}
              onChange={handleChange}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>1 - Low</span>
              <span>3 - Moderate</span>
              <span>5 - Mastered</span>
            </div>
          </div>
        </div>

        {/* Study Hours Tracking */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hours Studied So Far
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              name="hoursStudied"
              value={formData.hoursStudied}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Semester Hours
            </label>
            <input
              type="number"
              step="1"
              min="5"
              name="targetHours"
              value={formData.targetHours}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Topics / Syllabus */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            High-Yield Topics & Chapters (comma-separated)
          </label>
          <textarea
            rows="2"
            name="topics"
            value={formData.topics}
            onChange={handleChange}
            placeholder="e.g. Raft consensus, CAP theorem, MapReduce, Vector clocks"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Color Theme Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Subject Color Tag
          </label>
          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                type="button"
                key={c.hex}
                onClick={() => setFormData((prev) => ({ ...prev, color: c.hex }))}
                className={`w-7 h-7 rounded-xl ${c.bg} transition-transform flex items-center justify-center cursor-pointer ${
                  formData.color === c.hex ? "ring-2 ring-offset-2 ring-indigo-600 scale-110" : "hover:scale-105 opacity-80 hover:opacity-100"
                }`}
                title={c.name}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            {isEditing ? "Save Changes" : "Create Subject"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

