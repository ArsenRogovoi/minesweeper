/**
 * Minimal event emitter with a single kind of listener.
 * @returns {{subscribe: (listener: Function) => () => void, emit: (event: object) => void}}
 */
export function createEmitter() {
  const listeners = new Set();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      for (const listener of [...listeners]) {
        listener(event);
      }
    },
  };
}
