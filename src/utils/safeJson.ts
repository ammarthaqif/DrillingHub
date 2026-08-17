export function safeJsonStringify(obj: any, space?: number | string): string {
  if (obj === undefined) return '{}';
  const seen = new WeakSet();

  function isNonPlainOrBlacklisted(val: any): boolean {
    if (!val || typeof val !== 'object') return false;
    try {
      const ctorName = val.constructor?.name;
      if (
        ctorName === 'Y2' ||
        ctorName === 'Ka' ||
        ctorName === 'Z2' ||
        ctorName === 'Yc' ||
        ctorName === 'Firestore' ||
        ctorName === 'Auth' ||
        ctorName === 'FirebaseApp' ||
        ctorName === 'WebChannel' ||
        ctorName === 'Stream'
      ) {
        return true;
      }
      if (
        (typeof window !== 'undefined' && (
          val === window || 
          val instanceof Node || 
          val instanceof Event || 
          val instanceof MediaStream ||
          val instanceof Image ||
          (typeof HTMLCanvasElement !== 'undefined' && val instanceof HTMLCanvasElement) ||
          (typeof HTMLImageElement !== 'undefined' && val instanceof HTMLImageElement) ||
          (typeof HTMLVideoElement !== 'undefined' && val instanceof HTMLVideoElement)
        )) ||
        val.nodeType !== undefined ||
        val.$$typeof ||
        val._reactInternals ||
        val._reactFiber
      ) {
        return true;
      }
    } catch {
      return true;
    }
    return false;
  }

  function cleanValue(val: any, depth = 0): any {
    if (depth > 20) return undefined;
    if (val === null || val === undefined) return val;

    const type = typeof val;
    if (type === 'function' || type === 'symbol') return undefined;
    if (type !== 'object') return val;

    if (isNonPlainOrBlacklisted(val)) {
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
          const res = cleanValue(val[i], depth + 1);
          if (res !== undefined) {
            arr.push(res);
          }
        } catch {
          // ignore error items
        }
      }
      return arr;
    }

    // Plain or custom data records
    const cleanObj: Record<string, any> = {};
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch {
      return undefined;
    }

    for (const k of keys) {
      if (
        k === '_reactInternals' || 
        k === '_reactFiber' || 
        k === '$$typeof' || 
        k === 'src' || 
        k === 'i' || 
        k === 'g' || 
        k === 'l' || 
        k === 'h' ||
        k.startsWith('__')
      ) {
        // If it's a known non-data circular linkage or internal react property, verify safe serialization
        if (k === 'src' && typeof val[k] === 'object' && val[k] !== null) continue;
        if (k === 'i' && typeof val[k] === 'object' && val[k] !== null) continue;
        if (k === '_reactInternals' || k === '_reactFiber' || k === '$$typeof') continue;
      }

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
    if (cleaned === undefined) return '{}';
    
    // Double circular-safe replacer
    const stringifySeen = new WeakSet();
    return JSON.stringify(cleaned, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (stringifySeen.has(value)) {
          return undefined;
        }
        stringifySeen.add(value);
      }
      return value;
    }, space);
  } catch (err) {
    console.warn('safeJsonStringify fallback error:', err);
    return '{}';
  }
}

export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str || typeof str !== 'string') return fallback;
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
    const serialized = safeJsonStringify(obj);
    return JSON.parse(serialized) as T;
  } catch {
    if (Array.isArray(obj)) return [] as unknown as T;
    return {} as T;
  }
}

