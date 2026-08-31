import { defineStore } from 'pinia';
import { ref } from 'vue';
import { practiceApi } from '@/api';
import type { Question, PracticeSession, PracticeResult } from '@interview-quiz/shared';

export const usePracticeStore = defineStore('practice', () => {
  const currentQuestion = ref<Question | null>(null);
  const session = ref<PracticeSession | null>(null);
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

  async function submitAnswer(result: PracticeResult, myAnswer?: string) {
    if (!currentQuestion.value) return;
    await practiceApi.submitAnswer({
      questionId: currentQuestion.value.id,
      result,
      myAnswer,
      sessionId: session.value?.id,
    });
  }

  async function startSession() {
    session.value = await practiceApi.startSession();
  }

  async function endSession() {
    if (!session.value) return;
    session.value = await practiceApi.endSession(session.value.id);
  }

  function toggleAnswer() {
    showAnswer.value = !showAnswer.value;
  }

  return {
    currentQuestion,
    session,
    loading,
    showAnswer,
    fetchRandomQuestion,
    submitAnswer,
    startSession,
    endSession,
    toggleAnswer,
  };
});
