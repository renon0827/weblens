import type { FastifyInstance } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
}

interface ListDirResponse {
  path: string;
  parent: string | null;
  entries: FileEntry[];
}

export function registerFilesystemRoutes(app: FastifyInstance): void {
  // Get home directory
  app.get('/api/fs/home', async () => {
    return { path: os.homedir() };
  });

  // Get current working directory
  app.get('/api/fs/cwd', async () => {
    return { path: process.cwd() };
  });

  // List directory contents
  app.get<{ Querystring: { path?: string } }>('/api/fs/list', async (request, reply) => {
    const dirPath = request.query.path || process.cwd();

    try {
      // Resolve to absolute path
      const absolutePath = path.resolve(dirPath);

      // Check if path exists and is a directory
      const stats = fs.statSync(absolutePath);
      if (!stats.isDirectory()) {
        return reply.status(400).send({ error: 'パスがディレクトリではありません' });
      }

      // Read directory contents
      const items = fs.readdirSync(absolutePath, { withFileTypes: true });

      const entries: FileEntry[] = [];

      for (const item of items) {
        // Skip hidden files (starting with .)
        if (item.name.startsWith('.')) continue;

        const itemPath = path.join(absolutePath, item.name);
        const entry: FileEntry = {
          name: item.name,
          path: itemPath,
          isDirectory: item.isDirectory(),
        };

        if (!item.isDirectory()) {
          try {
            const fileStats = fs.statSync(itemPath);
            entry.size = fileStats.size;
          } catch {
            // Ignore stat errors
          }
        }

        entries.push(entry);
      }

      // Sort: directories first, then files, both alphabetically
      entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

      // Get parent directory
      const parent = path.dirname(absolutePath);
      const hasParent = parent !== absolutePath;

      const response: ListDirResponse = {
        path: absolutePath,
        parent: hasParent ? parent : null,
        entries,
      };

      return response;
    } catch (err) {
      return reply.status(400).send({ error: `ディレクトリを読み込めません: ${err}` });
    }
  });
}
