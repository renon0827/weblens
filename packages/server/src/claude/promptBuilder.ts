import * as fs from 'fs';
import * as path from 'path';
import type { ElementInfo, FileAttachment } from '../storage/types';

const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.js', '.ts', '.tsx', '.jsx', '.css', '.scss',
  '.html', '.htm', '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
  '.sql', '.graphql', '.vue', '.svelte', '.astro',
  '.env', '.gitignore', '.dockerignore', '.editorconfig',
  '.csv', '.log', '.conf', '.properties',
]);

const LANG_MAP: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  css: 'css',
  scss: 'scss',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sh: 'bash',
  bash: 'bash',
  sql: 'sql',
};

function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function readFileContent(filePath: string): { content: string; isText: boolean; error?: string } {
  try {
    if (!fs.existsSync(filePath)) {
      return { content: '', isText: false, error: `ファイルが見つかりません: ${filePath}` };
    }

    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      return { content: '', isText: false, error: `ディレクトリです: ${filePath}` };
    }

    const isText = isTextFile(filePath);
    if (isText) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { content, isText: true };
    } else {
      const stats = fs.statSync(filePath);
      return { content: `バイナリファイル (${stats.size} bytes)`, isText: false };
    }
  } catch (err) {
    return { content: '', isText: false, error: `ファイル読み込みエラー: ${err}` };
  }
}

export function buildPrompt(
  message: string,
  elements: ElementInfo[],
  attachments?: FileAttachment[],
  pageUrl?: string
): string {
  let prompt = '';

  if (pageUrl) {
    prompt += `## ページURL\n\n${pageUrl}\n\n`;
  }

  if (elements.length > 0) {
    prompt += '## 対象要素\n\n';

    for (const elem of elements) {
      const idPart = elem.id_attr ? `#${elem.id_attr}` : '';
      const classPart = elem.className ? `.${elem.className.split(' ').join('.')}` : '';
      prompt += `### 要素: ${elem.tagName}${idPart}${classPart}\n\n`;
      prompt += `- セレクタ: \`${elem.selector}\`\n`;
      prompt += `- XPath: \`${elem.xpath}\`\n`;

      if (elem.comment) {
        prompt += `- コメント: ${elem.comment}\n`;
      }

      prompt += `\n**HTML構造:**\n\`\`\`html\n${elem.outerHTML}\n\`\`\`\n\n`;
      prompt += `**計算済みスタイル:**\n\`\`\`json\n${JSON.stringify(elem.computedStyles, null, 2)}\n\`\`\`\n\n`;
    }
  }

  if (attachments && attachments.length > 0) {
    prompt += '## 添付ファイル\n\n';

    for (const filePath of attachments) {
      const fileName = path.basename(filePath);
      prompt += `### ファイル: ${fileName}\n\n`;
      prompt += `- パス: \`${filePath}\`\n`;

      const { content, isText, error } = readFileContent(filePath);

      if (error) {
        prompt += `- エラー: ${error}\n\n`;
      } else if (isText) {
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const lang = LANG_MAP[ext] || '';
        prompt += `\n**内容:**\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
      } else {
        prompt += `\n*${content}*\n\n`;
      }
    }
  }

  prompt += `## ユーザーからの依頼\n\n${message}`;

  return prompt;
}
