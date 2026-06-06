import { useState } from "react";
import Dashboard from "../components/Dashboard";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import type { Id } from "../../convex/_generated/dataModel";

export default function DashboardPage() {
  const [selectedLinkId, setSelectedLinkId] = useState<Id<"links"> | null>(null);

  if (selectedLinkId) {
    return (
      <div className="flex-1 flex flex-col justify-start relative z-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
        <AnalyticsDashboard linkId={selectedLinkId} onBack={() => setSelectedLinkId(null)} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-start relative z-10 w-full animate-in fade-in slide-in-from-left-4 duration-500">
      <Dashboard onSelectLink={setSelectedLinkId} />
    </div>
  );
}
