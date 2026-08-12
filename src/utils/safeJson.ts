export function safeJsonStringify(obj: any, space?: number | string): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // Filter out Window, DOM Nodes, Event objects, and React Elements
          if (
            (typeof window !== 'undefined' && (value === window || value instanceof Node || value instanceof Event)) ||
            (value as any).$$typeof
          ) {
            return undefined;
          }
          if (seen.has(value)) {
            return undefined;
          }
          seen.add(value);
        }
        if (typeof value === 'function' || typeof value === 'symbol') {
          return undefined;
        }
        return value;
      },
      space
    );
  } catch (err) {
    console.warn('safeJsonStringify error fallback:', err);
    return '{}';
  }
}

export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export function safeClone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  try {
    return JSON.parse(safeJsonStringify(obj));
  } catch {
    return obj;
  }
}
