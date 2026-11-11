import { StudentProvider, useStudent } from "./context/StudentContext";
import { Header } from "./components/common/Header";
import { Sidebar } from "./components/common/Sidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { SubjectsView } from "./components/subjects/SubjectsView";
import { PriorityEngineView } from "./components/priority/PriorityEngineView";
import { SmartPlannerView } from "./components/planner/SmartPlannerView";
import { AiAssistantView } from "./components/chat/AiAssistantView";
import { QuizGeneratorView } from "./components/quiz/QuizGeneratorView";
import { SettingsModal } from "./components/settings/SettingsModal";

function MainContent() {
  const { activeTab, isSettingsOpen, setIsSettingsOpen } = useStudent();

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col font-sans antialiased text-slate-900">
      {/* Top Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-5xl">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "subjects" && <SubjectsView />}
          {activeTab === "priority" && <PriorityEngineView />}
          {activeTab === "planner" && <SmartPlannerView />}
          {activeTab === "chat" && <AiAssistantView />}
          {activeTab === "quiz" && <QuizGeneratorView />}
        </main>
      </div>

      {/* Global Settings & API Configuration Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StudentProvider>
      <MainContent />
    </StudentProvider>
  );
}
