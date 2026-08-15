import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

function stripMarkdownEmphasis(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/_(.*?)_/g, "$1");
}

export function markdownToDocxParagraphs(markdown: string): Paragraph[] {
  const lines = markdown.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("# ")) {
      paragraphs.push(
        new Paragraph({ text: stripMarkdownEmphasis(line.slice(2)), heading: HeadingLevel.TITLE })
      );
    } else if (line.startsWith("## ")) {
      paragraphs.push(
        new Paragraph({ text: stripMarkdownEmphasis(line.slice(3)), heading: HeadingLevel.HEADING_1 })
      );
    } else if (line.startsWith("### ")) {
      paragraphs.push(
        new Paragraph({ text: stripMarkdownEmphasis(line.slice(4)), heading: HeadingLevel.HEADING_2 })
      );
    } else if (line.startsWith("- ")) {
      paragraphs.push(
        new Paragraph({ text: stripMarkdownEmphasis(line.slice(2)), bullet: { level: 0 } })
      );
    } else if (line.startsWith("> ")) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: stripMarkdownEmphasis(line.slice(2)), italics: true })],
        })
      );
    } else {
      paragraphs.push(new Paragraph({ text: stripMarkdownEmphasis(line) }));
    }
  }

  return paragraphs;
}

export async function markdownToDocxBuffer(markdown: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{ children: markdownToDocxParagraphs(markdown) }],
  });
  return Packer.toBuffer(doc);
}
