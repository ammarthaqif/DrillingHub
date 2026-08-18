/**
 * Safe JSON and Object Serialization Utilities
 * Provides bulletproof protection against circular references,
 * Firebase / WebChannel internal stream objects (e.g. Y2, Ka),
 * DOM elements, and throwing getters.
 */

// Native JSON methods backup
const nativeJsonStringify = typeof JSON !== 'undefined' ? JSON.stringify : (val: any) => String(val);
const nativeJsonParse = typeof JSON !== 'undefined' ? JSON.parse : (val: any) => val;

/**
 * Automatically install a global circular-reference defense into JSON.stringify
 * to prevent uncaught runtime errors from platform telemetry, console loggers,
 * or third-party libraries.
 */
(() => {
  if (typeof JSON !== 'undefined' && JSON.stringify) {
    const originalStringify = JSON.stringify;
    // Prevent double wrapping
    if ((originalStringify as any).__drillCoreCircularSafe) return;

    const wrappedStringify = function (value: any, replacer?: any, space?: any): string {
      const seen = new WeakSet();

      // If user passed a whitelist array of keys
      if (Array.isArray(replacer)) {
        const allowedKeys = new Set(replacer.map(String));
        try {
          return originalStringify.call(
            JSON,
            value,
            (key: string, val: any) => {
              if (key !== '' && !allowedKeys.has(key)) return undefined;
              if (typeof val === 'object' && val !== null) {
                if (isBlacklistedObject(val) || seen.has(val)) {
                  return undefined;
                }
                seen.add(val);
              }
              return val;
            },
            space
          );
        } catch {
          return safeJsonStringify(value, space);
        }
      }

      const userReplacer = typeof replacer === 'function' ? replacer : null;
      try {
        return originalStringify.call(
          JSON,
          value,
          function (this: any, key: string, val: any) {
            let currentVal = val;
            if (userReplacer) {
              try {
                currentVal = userReplacer.call(this, key, val);
              } catch {
                return undefined;
              }
            }

            if (typeof currentVal === 'object' && currentVal !== null) {
              if (isBlacklistedObject(currentVal) || seen.has(currentVal)) {
                return undefined;
              }
              seen.add(currentVal);
            }
            return currentVal;
          },
          space
        );
      } catch {
        return safeJsonStringify(value, space);
      }
    };

    (wrappedStringify as any).__drillCoreCircularSafe = true;
    try {
      JSON.stringify = wrappedStringify;
    } catch {
      // In strict non-writable environments, continue
    }
  }
})();

/**
 * Checks if a value is an internal non-serializable object like DOM elements,
 * MediaStreams, React Fibers, Firebase WebChannel / Auth / Firestore instances.
 */
function isBlacklistedObject(val: any): boolean {
  if (!val || typeof val !== 'object') return false;
  try {
    const ctor = val.constructor;
    const ctorName = ctor?.name;

    // Known minified Firebase WebChannel / transport constructors
    if (
      ctorName === 'Y2' ||
      ctorName === 'Ka' ||
      ctorName === 'Z2' ||
      ctorName === 'Yc' ||
      ctorName === 'Qa' ||
      ctorName === 'Firestore' ||
      ctorName === 'Auth' ||
      ctorName === 'FirebaseApp' ||
      ctorName === 'WebChannel' ||
      ctorName === 'Stream' ||
      ctorName === 'ClientStream' ||
      ctorName === 'Transport' ||
      ctorName === 'Channel'
    ) {
      return true;
    }

    // DOM & Browser internal objects
    if (typeof window !== 'undefined') {
      if (
        val === window ||
        val === document ||
        val instanceof Node ||
        val instanceof Event ||
        (typeof MediaStream !== 'undefined' && val instanceof MediaStream) ||
        (typeof Image !== 'undefined' && val instanceof Image) ||
        (typeof HTMLCanvasElement !== 'undefined' && val instanceof HTMLCanvasElement) ||
        (typeof HTMLImageElement !== 'undefined' && val instanceof HTMLImageElement) ||
        (typeof HTMLVideoElement !== 'undefined' && val instanceof HTMLVideoElement) ||
        (typeof BroadcastChannel !== 'undefined' && val instanceof BroadcastChannel)
      ) {
        return true;
      }
    }

    // React internals & Fiber
    if (val.nodeType !== undefined || val.$$typeof || val._reactInternals || val._reactFiber) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

/**
 * Deeply sanitizes an object, converting it into pure acyclic plain JSON-compatible data.
 */
function cleanValue(val: any, seen: WeakSet<object>, depth = 0): any {
  if (depth > 20) return undefined;
  if (val === null || val === undefined) return val;

  const type = typeof val;
  if (type === 'function' || type === 'symbol') return undefined;
  if (type === 'bigint') return val.toString();
  if (type !== 'object') return val;

  // Handle Error instances safely
  if (val instanceof Error) {
    return {
      name: val.name || 'Error',
      message: val.message || String(val),
      stack: val.stack ? String(val.stack).slice(0, 500) : undefined,
    };
  }

  // Handle Date instances
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }

  // Handle RegExp
  if (val instanceof RegExp) {
    return val.toString();
  }

  if (isBlacklistedObject(val)) {
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
        const res = cleanValue(val[i], seen, depth + 1);
        arr.push(res === undefined ? null : res);
      } catch {
        arr.push(null);
      }
    }
    return arr;
  }

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
      k.startsWith('__')
    ) {
      continue;
    }

    try {
      const child = val[k];
      // Skip circular references explicitly
      if (child === val) continue;
      
      const cleanedChild = cleanValue(child, seen, depth + 1);
      if (cleanedChild !== undefined) {
        cleanObj[k] = cleanedChild;
      }
    } catch {
      // Ignore properties with throwing getters
    }
  }

  return cleanObj;
}

/**
 * Stringifies any object safely, preventing circular reference crashes.
 */
export function safeJsonStringify(obj: any, space?: number | string): string {
  if (obj === undefined) return '{}';
  try {
    const seen = new WeakSet();
    const cleaned = cleanValue(obj, seen, 0);
    if (cleaned === undefined) return '{}';

    const stringifySeen = new WeakSet();
    return nativeJsonStringify(
      cleaned,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (stringifySeen.has(value)) {
            return undefined;
          }
          stringifySeen.add(value);
        }
        return value;
      },
      space
    );
  } catch (err) {
    try {
      return String(obj);
    } catch {
      return '{}';
    }
  }
}

/**
 * Parses JSON safely with fallback value on syntax failure.
 */
export function safeJsonParse<T = any>(str: string | null | undefined, fallback: T): T {
  if (!str || typeof str !== 'string') return fallback;
  try {
    return nativeJsonParse(str);
  } catch {
    return fallback;
  }
}

/**
 * Creates a clean, deep-cloned copy of any data structure without circular references or functions.
 */
export function safeClone<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  try {
    const seen = new WeakSet();
    const cleaned = cleanValue(obj, seen, 0);
    if (cleaned === undefined) {
      return (Array.isArray(obj) ? [] : {}) as T;
    }
    return cleaned as T;
  } catch {
    if (Array.isArray(obj)) return [] as unknown as T;
    return {} as T;
  }
}
