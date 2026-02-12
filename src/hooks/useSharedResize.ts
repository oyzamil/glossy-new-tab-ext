import { useEffect } from 'react';

type Callback = (width: number) => void;

const listeners = new Set<Callback>();

let resizeTimeout: number | undefined;

const notifyListeners = () => {
  listeners.forEach((callback) => {
    const container = document.getElementById('loader-container');
    if (container) callback(container.offsetWidth);
  });
};

// Debounced resize notification for performance
const onResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(notifyListeners, 50);
};

// Initialize global listener once
if (typeof window !== 'undefined') {
  window.addEventListener('resize', onResize);
}

export const useSharedResize = (callback: Callback) => {
  useEffect(() => {
    listeners.add(callback);
    callback(document.getElementById('loader-container')?.offsetWidth || 0);
    return () => {
      listeners.delete(callback);
    };
  }, [callback]);
};
