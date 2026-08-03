const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Generates a six-character protocol without visually ambiguous characters. */
export function generateProtocol(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('');
}

/** Retries protocol generation when a database uniqueness check finds a collision. */
export async function generateUniqueProtocol(
  exists: (protocol: string) => Promise<boolean>,
  random: () => number = Math.random,
  attempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const protocol = generateProtocol(random);
    if (!(await exists(protocol))) return protocol;
  }
  throw new Error('Não foi possível gerar um protocolo único.');
}
