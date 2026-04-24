import { Injectable } from '@nestjs/common';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';

const HASH_ALGORITHM = 'sha512';
const HASH_ITERATIONS = 100_000;
const HASH_KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  hash(value: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(
      value,
      salt,
      HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      HASH_ALGORITHM,
    ).toString('hex');

    return [
      'pbkdf2',
      HASH_ALGORITHM,
      HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      salt,
      hash,
    ].join('$');
  }

  compare(value: string, hashedValue: string | null | undefined): boolean {
    if (!hashedValue) {
      return false;
    }

    const [scheme, algorithm, iterations, keyLength, salt, originalHash] =
      hashedValue.split('$');

    if (
      scheme !== 'pbkdf2' ||
      !algorithm ||
      !iterations ||
      !keyLength ||
      !salt ||
      !originalHash
    ) {
      return false;
    }

    const derivedHash = pbkdf2Sync(
      value,
      salt,
      Number(iterations),
      Number(keyLength),
      algorithm,
    );
    const storedHash = Buffer.from(originalHash, 'hex');

    if (derivedHash.length !== storedHash.length) {
      return false;
    }

    return timingSafeEqual(derivedHash, storedHash);
  }
}
