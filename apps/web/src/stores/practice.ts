import { defineStore } from 'pinia';
import { ref } from 'vue';
import { practiceApi } from '@/api';
import type { Question, PracticeSession, PracticeResult } from '@interview-quiz/shared';

export const usePracticeStore = defineStore('practice', () => {
  const currentQuestion = ref<any | null>(null);
  const session = ref<any | null>(null);
  const sessionStats = ref<any>(null);
  const loading = ref(false);
  const showAnswer = ref(false);

  async function fetchRandomQuestion(params?: Record<string, any>) {
    loading.value = true;
    showAnswer.value = false;
    try {
      currentQuestion.value = await practiceApi.getRandom(params);
    } finally {
      loading.value = false;
    }
  }

  async function fetchNextQuestion() {
    if (!session.value) return null;
    loading.value = true;
    showAnswer.value = false;
    try {
      currentQuestion.value = await practiceApi.getNextQuestion(session.value.id);
      return currentQuestion.value;
    } finally {
      loading.value = false;
    }
  }

  async function submitAnswer(result: PracticeResult, myAnswer?: string) {
    if (!currentQuestion.value) return;
    await practiceApi.submitAnswer({
      questionId: currentQuestion.value.id,
      result,
      myAnswer,
      sessionId: session.value?.id,
    });

    if (session.value) {
      const updated = await practiceApi.getSession(session.value.id);
      sessionStats.value = updated.stats;
    }
  }

  async function startSession(params?: Record<string, any>) {
    const data = await practiceApi.startSession(params);
    session.value = data;
    sessionStats.value = data.stats;
    if (data.questions && data.questions.length > 0) {
      currentQuestion.value = data.questions[0];
    }
  }

  async function endSession() {
    if (!session.value) return;
    session.value = await practiceApi.endSession(session.value.id);
    currentQuestion.value = null;
  }

  async function skipQuestion() {
    if (!session.value || !currentQuestion.value) return;
    await practiceApi.skipQuestion(session.value.id, currentQuestion.value.id);
    await fetchNextQuestion();
  }

  function toggleAnswer() {
    showAnswer.value = !showAnswer.value;
  }

  return {
    currentQuestion,
    session,
    sessionStats,
    loading,
    showAnswer,
    fetchRandomQuestion,
    fetchNextQuestion,
    submitAnswer,
    startSession,
    endSession,
    skipQuestion,
    toggleAnswer,
  };
});
