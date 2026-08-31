export const QUESTION_TYPES = [
  { value: 'concept', label: '概念题' },
  { value: 'coding', label: '手写题' },
  { value: 'scene', label: '场景题' },
  { value: 'algorithm', label: '算法题' },
] as const;

export const DIFFICULTY_LEVELS = [
  { value: 1, label: '★' },
  { value: 2, label: '★★' },
  { value: 3, label: '★★★' },
  { value: 4, label: '★★★★' },
  { value: 5, label: '★★★★★' },
] as const;

export const PRACTICE_RESULTS = [
  { value: 'correct', label: '答对了', color: '#22c55e' },
  { value: 'wrong', label: '答错了', color: '#ef4444' },
  { value: 'fuzzy', label: '模糊', color: '#f59e0b' },
] as const;

export const MASTERY_LEVELS = [
  { value: 'unseen', label: '未刷', color: '#94a3b8' },
  { value: 'weak', label: '不会', color: '#ef4444' },
  { value: 'fuzzy', label: '模糊', color: '#f59e0b' },
  { value: 'mastered', label: '熟练', color: '#22c55e' },
] as const;
