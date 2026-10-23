import { getDocumentProxy } from 'unpdf';

/**
 * Reads the text out of a PDF, line by line, keeping wide gaps between
 * words as runs of spaces so two-column layouts can be told apart.
 * The uploaded file is only held in memory while it is read; it is never
 * saved anywhere (see the privacy summary in docs/PRIVACY.md, R2.18).
 */
export async function pdfToText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const out: string[] = [];
  const pages = Math.min(pdf.numPages, 5);
  for (let n = 1; n <= pages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    type Item = { str: string; x: number; y: number; w: number };
    const items: Item[] = [];
    for (const raw of content.items as Array<{ str?: string; transform?: number[]; width?: number }>) {
      if (typeof raw.str !== 'string' || !raw.transform || !raw.str.length) continue;
      items.push({ str: raw.str, x: raw.transform[4], y: raw.transform[5], w: raw.width ?? 0 });
    }
    // Group items into lines by their vertical position (2pt tolerance).
    const lines: Item[][] = [];
    for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const line = lines.find((l) => Math.abs(l[0].y - item.y) <= 2);
      if (line) line.push(item);
      else lines.push([item]);
    }
    for (const line of lines) {
      line.sort((a, b) => a.x - b.x);
      let text = '';
      let end = -Infinity;
      for (const item of line) {
        const gap = item.x - end;
        if (!item.str.trim()) {
          // pdf.js reports a run of spaces as one wide blank item; a wide one is a column gap.
          text += item.w > 18 ? '    ' : ' ';
          end = item.x + item.w;
          continue;
        }
        if (text && gap > 18) text += '    ';
        else if (text && gap > 1 && !text.endsWith(' ') && !item.str.startsWith(' ')) text += ' ';
        text += item.str;
        end = item.x + item.w;
      }
      out.push(text);
    }
    out.push('');
  }
  return out.join('\n');
}
