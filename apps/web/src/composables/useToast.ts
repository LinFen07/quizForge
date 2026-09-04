import { ref } from 'vue';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
  visible: boolean;
}

const toasts = ref<ToastState[]>([]);

export function useToast() {
  function show(message: string, type: ToastState['type'] = 'success', duration = 3000) {
    const toast: ToastState = { message, type, visible: true };
    toasts.value.push(toast);

    setTimeout(() => {
      toast.visible = false;
      setTimeout(() => {
        const idx = toasts.value.indexOf(toast);
        if (idx > -1) toasts.value.splice(idx, 1);
      }, 300);
    }, duration);
  }

  function success(message: string) {
    show(message, 'success');
  }

  function error(message: string) {
    show(message, 'error', 5000);
  }

  function warning(message: string) {
    show(message, 'warning', 4000);
  }

  return {
    toasts,
    show,
    success,
    error,
    warning,
  };
}
