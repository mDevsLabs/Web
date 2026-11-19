export type Priority = "P0" | "P1" | "P2";
export type Severity = "error" | "warning" | "info";
export type Category = "code" | "cache" | "cpu";

export interface DiagnosticIssue {
  category: Category;
  file?: string;
  id: string;
  line?: number;
  message: string;
  priority: Priority;
  recommendation: string;
  severity: Severity;
  title: string;
}

export interface AnalyzerResult {
  category: Category;
  issues: DiagnosticIssue[];
  metrics: Record<string, number | string>;
}

export interface OptimizerReport {
  results: {
    code: AnalyzerResult;
    cache: AnalyzerResult;
    cpu: AnalyzerResult;
  };
  score: number;
  summary: {
    totalIssues: number;
    p0Count: number;
    p1Count: number;
    p2Count: number;
  };
  timestamp: string;
}
