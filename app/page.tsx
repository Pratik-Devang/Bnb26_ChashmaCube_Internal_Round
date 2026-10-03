"use client";

import { useMemo, useState } from "react";
import { TopNavigation } from "@/components/dashboard/TopNavigation";
import { SideRail } from "@/components/dashboard/SideRail";
import { LearningHeader } from "@/components/dashboard/LearningHeader";
import { LearningPath } from "@/components/dashboard/LearningPath";
import { ActiveGameCard } from "@/components/dashboard/ActiveGameCard";
import { QuestPanel } from "@/components/dashboard/QuestPanel";
import { ProgressOverview } from "@/components/dashboard/ProgressOverview";
import { ExerciseLibrary } from "@/components/dashboard/ExerciseLibrary";
import { conceptStates, diagnosis, learner, learningModules, quests as initialQuests, statistics } from "@/lib/mock-data";
import type { Quest } from "@/types/learning";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState("Learning Path");
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [quests, setQuests] = useState(initialQuests);
  const [xp, setXp] = useState(learner.xp);

  const filteredModules = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return learningModules;
    return learningModules.filter((module) =>
      `${module.title} ${module.description}`.toLowerCase().includes(query),
    );
  }, [search]);

  const navigate = (item: string) => {
    setActiveSection(item);
    const target = item === "Progress" ? "progress" : item === "Quests" || item === "Active Quest" ? "quests" : "learning";
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleDetails = (id: string) => {
    setExpandedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  };

  const completeQuest = (quest: Quest) => {
    if (quest.status === "completed") return;
    setQuests((items) => items.map((item) => item.id === quest.id ? { ...item, status: "completed" } : item));
    setXp((value) => value + quest.xpReward);
  };

  return (
    <main className="app-shell">
      <TopNavigation learner={learner} xp={xp} active={activeSection} onNavigate={navigate} />
      <div className="dashboard-layout">
        <SideRail active={activeSection} onNavigate={navigate} />
        <div className="main-column" id="learning">
          <LearningHeader search={search} onSearch={setSearch} statistics={statistics} />
          <LearningPath modules={filteredModules} expandedIds={expandedIds} gameRunning={gameRunning} onToggleDetails={toggleDetails} onToggleGame={() => setGameRunning((value) => !value)} />
          <ActiveGameCard diagnosis={diagnosis} running={gameRunning} onToggle={() => setGameRunning((value) => !value)} />
          <ProgressOverview concepts={conceptStates} />
          <ExerciseLibrary />
        </div>
        <QuestPanel quests={quests} streak={learner.streak} onComplete={completeQuest} />
      </div>
    </main>
  );
}
