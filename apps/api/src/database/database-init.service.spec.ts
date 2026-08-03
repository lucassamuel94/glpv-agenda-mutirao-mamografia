import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as pg from 'pg';
import { DatabaseInitService } from './database-init.service';

jest.mock('pg', () => ({
  Client: jest.fn(),
}));

describe('DatabaseInitService', () => {
  const originalCwd = process.cwd();
  const originalEnv = { ...process.env };
  let tempDir: string | undefined;

  afterEach(() => {
    process.chdir(originalCwd);
    process.env = { ...originalEnv };
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
    jest.clearAllMocks();
  });

  it('carrega o .env antes da primeira conexão do bootstrap', async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-bootstrap-env-'));
    fs.writeFileSync(
      path.join(tempDir, '.env'),
      [
        'DB_HOST=database.local',
        'DB_PORT=5544',
        'DB_USERNAME=app_user',
        'DB_PASSWORD=app_password',
        'DB_DATABASE=app_database',
      ].join('\n')
    );
    process.chdir(tempDir);
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;

    const connect = jest.fn().mockResolvedValue(undefined);
    const query = jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] });
    const end = jest.fn().mockResolvedValue(undefined);
    (pg.Client as unknown as jest.Mock).mockImplementation(() => ({ connect, query, end }));

    await DatabaseInitService.ensureDatabaseFromEnv();

    expect(pg.Client).toHaveBeenCalledWith({
      host: 'database.local',
      port: 5544,
      user: 'app_user',
      password: 'app_password',
      database: 'postgres',
    });
  });
});
