type ErrorCallback = (error: import('./errors').FirestorePermissionError) => void;
type EventType = 'permission-error';

class SimpleEmitter {
  private listeners: Record<EventType, ErrorCallback[]> = { 'permission-error': [] };

  on(event: EventType, cb: ErrorCallback) {
    this.listeners[event].push(cb);
  }

  off(event: EventType, cb: ErrorCallback) {
    this.listeners[event] = this.listeners[event].filter(l => l !== cb);
  }

  emit(event: EventType, error: any) {
    this.listeners[event].forEach(cb => cb(error));
  }
}

export const errorEmitter = new SimpleEmitter();
