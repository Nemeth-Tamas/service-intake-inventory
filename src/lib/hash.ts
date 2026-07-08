import { createHash } from 'crypto';
import { createReadStream } from 'fs';

/**
 * Calculates the SHA-256 hash of a file at the given path.
 */
export function calculateSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}
