/** Remove legacy "Fontes (dataset)" blocks from chat answers. */
export function sanitizeChatContent(text: string): string {
  return text
    .replace(/\n*\*?\*?Fontes\s*\(dataset\)\*?\*?:[\s\S]*$/i, '')
    .replace(/\n*Fontes:\s*[\s\S]*$/i, '')
    .trim()
}
