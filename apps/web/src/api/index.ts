import request from './request';
import type {
  Question,
  KnowledgePoint,
  Tag,
  PracticeRecord,
  PracticeSession,
  PaginatedResponse,
  QuestionType,
  PracticeResult,
} from '@interview-quiz/shared';

export const questionsApi = {
  list: (params?: Record<string, any>) =>
    request.get<any, PaginatedResponse<Question>>('/questions', { params }),
  get: (id: number) => request.get<any, Question>(`/questions/${id}`),
  create: (data: any) => request.post<any, Question>('/questions', data),
  update: (id: number, data: any) => request.patch<any, Question>(`/questions/${id}`, data),
  remove: (id: number) => request.delete(`/questions/${id}`),
};

export const knowledgePointsApi = {
  tree: () => request.get<any, KnowledgePoint[]>('/knowledge-points/tree'),
  create: (data: any) => request.post<any, KnowledgePoint>('/knowledge-points', data),
  update: (id: number, data: any) => request.patch<any, KnowledgePoint>(`/knowledge-points/${id}`, data),
  remove: (id: number) => request.delete(`/knowledge-points/${id}`),
};

export const tagsApi = {
  list: (withCount = false) =>
    request.get<any, Tag[]>('/tags', { params: { withCount } }),
  create: (data: any) => request.post<any, Tag>('/tags', data),
  update: (id: number, data: any) => request.patch<any, Tag>(`/tags/${id}`, data),
  remove: (id: number) => request.delete(`/tags/${id}`),
};

export const practiceApi = {
  startSession: () => request.post<any, PracticeSession>('/practice/sessions'),
  endSession: (id: number) => request.post<any, PracticeSession>(`/practice/sessions/${id}/end`),
  getRandom: (params?: Record<string, any>) =>
    request.get<any, Question>('/practice/random', { params }),
  getReviewQueue: (params?: Record<string, any>) =>
    request.get<any, Question[]>('/practice/review-queue', { params }),
  submitAnswer: (data: {
    questionId: number;
    result: PracticeResult;
    myAnswer?: string;
    sessionId?: number;
    durationMs?: number;
  }) => request.post<any, PracticeRecord>('/practice/records', data),
  getQuestionStats: (questionId: number) =>
    request.get<any, any>(`/practice/stats/${questionId}`),
};

export const statsApi = {
  masteryOverview: () => request.get<any, any>('/stats/mastery-overview'),
  knowledgeMastery: () => request.get<any, any>('/stats/knowledge-mastery'),
  trend: (days = 30) => request.get<any, any>('/stats/trend', { params: { days } }),
};

export const importExportApi = {
  exportAll: () => request.get<any, any>('/import-export/export'),
  importQuestions: (data: any[]) => request.post<any, any>('/import-export/import', data),
};
