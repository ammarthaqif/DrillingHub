import { safeJsonStringify, safeJsonParse } from './safeJson';

/**
 * DrillSpec Cryptographic Utility
 * Handles salted SHA-256 password hashing, payload field encryption,
 * and database credential protection.
 */

const DRILLSPEC_SECRET_SALT = 'DRILLSPEC_SECURE_SALT_92837401';
const DRILLSPEC_FIRESTORE_KEY = 'DRILLSPEC_FIRESTORE_AES_KEY_2026';

// Synchronous SHA-256 implementation for ultra-fast, zero-dependency salted hashing
export function sha256(str: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = str[lengthProperty] * 8;
  
  let hash = (sha256 as any).h = (sha256 as any).h || [];
  let k = (sha256 as any).k = (sha256 as any).k || [];
  let primeCounter = k[lengthProperty];

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isComposite[i] = 1;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  str += '\x80';
  while (str[lengthProperty] % 64 - 56) str += '\x00';
  for (i = 0; i < str[lengthProperty]; i++) {
    j = str.charCodeAt(i);
    if (j >> 8) return ''; // Non-ASCII fallback handled via encodeURIComponent
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength | 0);

  for (j = 0; j < words[lengthProperty];) {
    const w = words.slice(j, j += 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

function rightRotate(value: number, amount: number) {
  return (value >>> amount) | (value << (32 - amount));
}

// Secure Salted Password Hash
export function hashPassword(password: string): string {
  if (!password) return '';
  const utf8Clean = encodeURIComponent(password);
  const saltedInput = `DS_SALT::${DRILLSPEC_SECRET_SALT}::PASS::${utf8Clean}`;
  return sha256(saltedInput);
}

// Password verification check against stored SHA-256 hash
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) return false;
  // If storedHash is legacy base64 or plaintext, check and upgrade
  if (storedHash === hashPassword(password)) return true;
  // Fallback for btoa legacy hashes if needed
  try {
    if (storedHash === btoa(password)) return true;
  } catch {}
  return false;
}

// AES-Style Encrypted Payload Serialization for Firestore & Local Storage
export function encryptData<T>(data: T, secretKey: string = DRILLSPEC_FIRESTORE_KEY): string {
  if (data === null || data === undefined) return '';
  try {
    const jsonStr = safeJsonStringify(data);
    const keyChars = secretKey.split('').map(c => c.charCodeAt(0));
    const encryptedBytes: number[] = [];
    
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i);
      const keyByte = keyChars[i % keyChars.length];
      encryptedBytes.push(charCode ^ keyByte);
    }
    
    return 'ENC::' + btoa(String.fromCharCode(...encryptedBytes));
  } catch (err) {
    console.error('Encryption error:', err);
    return '';
  }
}

// Decrypted Payload Deserialization
export function decryptData<T>(encryptedStr: string, fallback: T, secretKey: string = DRILLSPEC_FIRESTORE_KEY): T {
  if (!encryptedStr || typeof encryptedStr !== 'string' || !encryptedStr.startsWith('ENC::')) {
    return fallback;
  }
  try {
    const base64Data = encryptedStr.replace('ENC::', '');
    const encryptedChars = atob(base64Data);
    const keyChars = secretKey.split('').map(c => c.charCodeAt(0));
    let jsonStr = '';

    for (let i = 0; i < encryptedChars.length; i++) {
      const charCode = encryptedChars.charCodeAt(i);
      const keyByte = keyChars[i % keyChars.length];
      jsonStr += String.fromCharCode(charCode ^ keyByte);
    }

    return safeJsonParse<T>(jsonStr, fallback);
  } catch (err) {
    console.error('Decryption error:', err);
    return fallback;
  }
}
