export interface HistorySessionSummary {
  id: string;
  createdAt: string;
  title: string | null;
  themes: string[];
  hasSynthesis: boolean;
  marked: boolean;
}
