import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecurityHashService {
  /**
   * Gera um novo hash de segurança
   */
  generateHash(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gera um hash baseado em dados específicos
   */
  generateHashFromData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verifica se dois hashes são iguais
   */
  compareHashes(hash1: string, hash2: string): boolean {
    return crypto.timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(hash2, 'hex'));
  }

  /**
   * Gera um hash único baseado no ID do usuário e timestamp
   */
  generateUserHash(userId: string): string {
    const timestamp = Date.now().toString();
    const data = `${userId}-${timestamp}-${Math.random()}`;
    return this.generateHashFromData(data);
  }
}
