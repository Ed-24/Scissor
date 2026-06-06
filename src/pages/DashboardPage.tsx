import { useState } from "react";
import Dashboard from "../components/Dashboard";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ErrorBoundary from "../components/ErrorBoundary";
import type { Id } from "../../convex/_generated/dataModel";

export default function DashboardPage() {
  const [selectedLinkId, setSelectedLinkId] = useState<Id<"links"> | null>(null);

  if (selectedLinkId) {
    return (
      <div className="flex-1 flex flex-col justify-start relative z-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
        <ErrorBoundary>
          <AnalyticsDashboard linkId={selectedLinkId} onBack={() => setSelectedLinkId(null)} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-start relative z-10 w-full animate-in fade-in slide-in-from-left-4 duration-500">
      <ErrorBoundary>
        <Dashboard onSelectLink={setSelectedLinkId} />
      </ErrorBoundary>
    </div>
  );
}
