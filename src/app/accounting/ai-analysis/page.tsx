import PageHeader from "@/components/page-header";
import AiAnalysisClient from "./ai-analysis-client";

export default function AiAnalysisPage() {
  return (
    <>
      <PageHeader title="AI Financial Analysis" />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <AiAnalysisClient />
      </main>
    </>
  );
}
