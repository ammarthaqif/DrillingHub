export function safeJsonStringify(obj: any, space?: number | string): string {
  if (obj === undefined) return '{}';
  const seen = new WeakSet();

  function cleanValue(val: any, depth = 0): any {
    if (depth > 25) return undefined;
    if (val === null || val === undefined) return val;

    const type = typeof val;
    if (type === 'function' || type === 'symbol') return undefined;
    if (type !== 'object') return val;

    // Safely filter DOM Nodes, Window, Event objects, React elements/fibers, and Media Streams
    try {
      if (
        (typeof window !== 'undefined' && (val === window || val instanceof Node || val instanceof Event)) ||
        val.$$typeof ||
        val._reactInternals ||
        val._reactFiber
      ) {
        return undefined;
      }
    } catch {
      return undefined;
    }

    if (seen.has(val)) {
      return undefined;
    }
    seen.add(val);

    if (Array.isArray(val)) {
      const arr: any[] = [];
      for (let i = 0; i < val.length; i++) {
        try {
          arr.push(cleanValue(val[i], depth + 1));
        } catch {
          arr.push(null);
        }
      }
      return arr;
    }

    // Plain or custom objects
    const cleanObj: Record<string, any> = {};
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch {
      return undefined;
    }

    for (const k of keys) {
      if (k === '_reactInternals' || k === '_reactFiber' || k === '$$typeof') continue;
      try {
        const child = val[k];
        const cleanedChild = cleanValue(child, depth + 1);
        if (cleanedChild !== undefined) {
          cleanObj[k] = cleanedChild;
        }
      } catch {
        // Skip properties whose getters throw
      }
    }
    return cleanObj;
  }

  try {
    const cleaned = cleanValue(obj);
    return JSON.stringify(cleaned, null, space);
  } catch (err) {
    console.warn('safeJsonStringify fallback error:', err);
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
  if (typeof obj !== 'object') return obj;
  try {
    return JSON.parse(safeJsonStringify(obj));
  } catch {
    return obj;
  }
}

