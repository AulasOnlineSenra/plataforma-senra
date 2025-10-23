import { FeedbackAnalysisClient } from '@/components/feedback-analysis-client';

export default function FeedbackAnalysisPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-headline text-2xl md:text-3xl font-bold">
          Análise de Feedback
        </h1>
      </div>
      <FeedbackAnalysisClient />
    </div>
  );
}
