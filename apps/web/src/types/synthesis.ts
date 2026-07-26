export interface SessionSynthesis {
  id: string;
  title: string;
  themes: string[];
  explored: string;
  patterns: string[];
  openQuestion: string;
  depth: number;
  durationMinutes: number;
  exchangeCount: number;
  createdAt: string;
}
