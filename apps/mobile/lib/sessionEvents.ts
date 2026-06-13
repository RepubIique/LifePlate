type Handler = () => void;

let onUnauthorized: Handler | null = null;

export function setUnauthorizedHandler(handler: Handler | null) {
  onUnauthorized = handler;
}

export function notifyUnauthorized() {
  onUnauthorized?.();
}
