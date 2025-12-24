import type { ElementInfo } from '../storage/types';

export function buildPrompt(message: string, elements: ElementInfo[], pageUrl?: string): string {
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

  prompt += `## ユーザーからの依頼\n\n${message}`;

  return prompt;
}
