export type QuestionType = 'concept' | 'coding' | 'scene' | 'algorithm';
export type PracticeResult = 'correct' | 'wrong' | 'fuzzy';
export type MasteryLevel = 'unseen' | 'weak' | 'fuzzy' | 'mastered';

export interface KnowledgePoint {
  id: number;
  name: string;
  parentId: number | null;
  sortOrder: number;
  children?: KnowledgePoint[];
  questionCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
  createdAt: string;
}

export interface Company {
  id: number;
  name: string;
  alias: string | null;
  createdAt: string;
}

export interface Question {
  id: number;
  title: string;
  type: QuestionType;
  difficulty: number;
  knowledgePointId: number | null;
  referenceAnswer: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  knowledgePoint?: KnowledgePoint | null;
  tags?: Tag[];
  companies?: Company[];
  practiceRecords?: PracticeRecord[];
  practiceCount?: number;
}

export interface PracticeRecord {
  id: number;
  questionId: number;
  sessionId: number | null;
  result: PracticeResult;
  myAnswer: string | null;
  durationMs: number | null;
  practicedAt: string;
}

export interface PracticeSession {
  id: number;
  startedAt: string;
  endedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  fuzzyCount: number;
  stats?: {
    total: number;
    answered: number;
    pending: number;
    correct: number;
    wrong: number;
    fuzzy: number;
    accuracy: number;
  };
  questions?: any[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
