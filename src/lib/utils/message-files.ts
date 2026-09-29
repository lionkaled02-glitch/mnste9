export interface ChatFile {
  name: string;
  key: string;
}

export function extractFilesFromMessage(content: string): ChatFile[] {
  const files: ChatFile[] = [];
  const regex = /- (.+?) \(key: (b2:[^)]+)\)/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    files.push({
      name: match[1].trim(),
      key: match[2].trim(),
    });
  }

  return files;
}

export function stripFileLines(content: string): string {
  return content.replace(/\n?- .+? \(key: b2:[^)]+\)/g, '').trim();
}
