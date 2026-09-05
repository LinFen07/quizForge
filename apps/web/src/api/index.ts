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
  restore: (id: number) => request.post<any, any>(`/questions/${id}/restore`),
  permanentDelete: (id: number) => request.delete(`/questions/${id}/permanent`),
  batchDelete: (ids: number[]) => request.post<any, any>('/questions/batch/delete', { ids }),
  batchUpdate: (data: {
    ids: number[];
    difficulty?: number;
    knowledgePointId?: number;
    tagIds?: number[];
    companyIds?: number[];
  }) => request.post<any, any>('/questions/batch/update', data),
  getAuditLogs: (id: number) => request.get<any, any[]>(`/questions/${id}/audit-logs`),
};

export const knowledgePointsApi = {
  tree: () => request.get<any, KnowledgePoint[]>('/knowledge-points/tree'),
  create: (data: any) => request.post<any, KnowledgePoint>('/knowledge-points', data),
  update: (id: number, data: any) =>
    request.patch<any, KnowledgePoint>(`/knowledge-points/${id}`, data),
  remove: (id: number) => request.delete(`/knowledge-points/${id}`),
};

export const tagsApi = {
  list: (withCount = false) => request.get<any, Tag[]>('/tags', { params: { withCount } }),
  create: (data: any) => request.post<any, Tag>('/tags', data),
  update: (id: number, data: any) => request.patch<any, Tag>(`/tags/${id}`, data),
  remove: (id: number) => request.delete(`/tags/${id}`),
};

export const companiesApi = {
  list: (withCount = false) => request.get<any, any[]>('/companies', { params: { withCount } }),
  get: (id: number) => request.get<any, any>(`/companies/${id}`),
  create: (data: any) => request.post<any, any>('/companies', data),
  update: (id: number, data: any) => request.patch<any, any>(`/companies/${id}`, data),
  remove: (id: number) => request.delete(`/companies/${id}`),
};

export const practiceApi = {
  startSession: (data?: Record<string, any>) =>
    request.post<any, PracticeSession>('/practice/sessions', data),
  getSession: (id: number) => request.get<any, any>(`/practice/sessions/${id}`),
  getNextQuestion: (id: number) => request.get<any, Question>(`/practice/sessions/${id}/next`),
  endSession: (id: number) => request.post<any, PracticeSession>(`/practice/sessions/${id}/end`),
  skipQuestion: (sessionId: number, questionId: number) =>
    request.post<any, any>(`/practice/sessions/${sessionId}/skip/${questionId}`),
  getRandom: (params?: Record<string, any>) =>
    request.get<any, Question>('/practice/random', { params }),
  getReviewQueue: (params?: Record<string, any>) =>
    request.get<any, Question[]>('/practice/review-queue', { params }),
  getSm2ReviewQueue: (params?: Record<string, any>) =>
    request.get<any, any[]>('/practice/review', { params }),
  submitAnswer: (data: {
    questionId: number;
    result: PracticeResult;
    myAnswer?: string;
    sessionId?: number;
    durationMs?: number;
  }) => request.post<any, PracticeRecord>('/practice/records', data),
  getQuestionStats: (questionId: number) => request.get<any, any>(`/practice/stats/${questionId}`),
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

export const aiApi = {
  getSettings: () =>
    request.get<any, { provider: string; apiKey?: string; baseUrl?: string; model?: string }>(
      '/ai/settings',
    ),
  updateSettings: (data: { provider: string; apiKey?: string; baseUrl?: string; model?: string }) =>
    request.post<any, { success: boolean }>('/ai/settings', data),
  generateQuestions: (data: {
    knowledgePointId?: number;
    type?: string;
    difficulty?: number;
    count?: number;
  }) => request.post<any, any[]>('/ai/generate', data),
  analyzeAnswer: (data: { questionId: number; userAnswer: string }) =>
    request.post<any, { score: number; feedback: string; suggestions: string[] }>(
      '/ai/analyze',
      data,
    ),
};

export const auditApi = {
  getRecent: (limit?: number) =>
    request.get<any, any[]>('/audit-logs/recent', { params: { limit } }),
  getByEntity: (entity: string, entityId: number) =>
    request.get<any, any[]>(`/audit-logs/${entity}/${entityId}`),
};
