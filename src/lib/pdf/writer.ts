// Shared branded PDF writer built on pdf-lib. Runs client-side only (no
// Markdown/HTML export path exists — doc 15.1/8.4). Keeps each specific
// document generator (deal-twin, answer-graph, proposal, oracle brief,
// handover) short by handling pagination, headings, wrapped paragraphs and
// simple tables in one place.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, PageSizes } from "pdf-lib";

const BRAND = {
  primary: rgb(0, 0.125, 0.25), // Intelloger dark blue (#001f40)
  accent: rgb(1, 0.55, 0), // Intelloger orange (#ff8c00)
  ink: rgb(0.17, 0.17, 0.17),
  muted: rgb(0.35, 0.35, 0.35),
  line: rgb(0.93, 0.93, 0.93),
  paper: rgb(1, 1, 1),
  lightBg: rgb(0.97, 0.97, 0.97),
};

const A4_PORTRAIT: [number, number] = PageSizes.A4;
const LANDSCAPE_16_9: [number, number] = [842, 473.6]; // A4 width, 16:9 height

const MARGIN = 48;

export type Orientation = "portrait" | "landscape";

export class PdfWriter {
  doc: PDFDocument;
  private font!: PDFFont;
  private bold!: PDFFont;
  private pageSize: [number, number];
  private page!: PDFPage;
  private y = 0;
  private title: string;
  private pages: PDFPage[] = [];

  private constructor(doc: PDFDocument, title: string, orientation: Orientation) {
    this.doc = doc;
    this.title = title;
    this.pageSize = orientation === "landscape" ? LANDSCAPE_16_9 : A4_PORTRAIT;
  }

  static async create(title: string, orientation: Orientation = "portrait"): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    doc.setTitle(title);
    doc.setProducer("Intelloger");
    doc.setCreator("Intelloger");
    const writer = new PdfWriter(doc, title, orientation);
    writer.font = await doc.embedFont(StandardFonts.Helvetica);
    writer.bold = await doc.embedFont(StandardFonts.HelveticaBold);
    writer.addPage();
    return writer;
  }

  addPage(): void {
    const page = this.doc.addPage(this.pageSize);
    this.pages.push(page);
    this.page = page;
    this.y = this.pageSize[1] - MARGIN;
    this.drawBrandBar();
  }

  private get width(): number {
    return this.pageSize[0];
  }
  private get contentWidth(): number {
    return this.width - MARGIN * 2;
  }

  private drawBrandBar(): void {
    this.page.drawRectangle({ x: 0, y: this.pageSize[1] - 6, width: this.width, height: 6, color: BRAND.primary });
    this.page.drawText("Intelloger", {
      x: MARGIN,
      y: this.pageSize[1] - 24,
      size: 10,
      font: this.bold,
      color: BRAND.primary,
    });
    this.y = this.pageSize[1] - 50;
  }

  private ensureSpace(height: number): void {
    if (this.y - height < MARGIN + 20) this.addPage();
  }

  coverTitle(title: string, subtitle: string): void {
    this.y = this.pageSize[1] / 2 + 60;
    this.page.drawText(title, { x: MARGIN, y: this.y, size: 26, font: this.bold, color: BRAND.ink, maxWidth: this.contentWidth });
    this.y -= 34;
    this.page.drawText(subtitle, { x: MARGIN, y: this.y, size: 12, font: this.font, color: BRAND.muted, maxWidth: this.contentWidth });
    this.y -= 40;
  }

  heading(text: string): void {
    this.ensureSpace(30);
    this.y -= 6;
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 15, font: this.bold, color: BRAND.primary });
    this.y -= 8;
    this.page.drawLine({ start: { x: MARGIN, y: this.y }, end: { x: this.width - MARGIN, y: this.y }, thickness: 0.75, color: BRAND.line });
    this.y -= 16;
  }

  subheading(text: string): void {
    this.ensureSpace(20);
    this.page.drawText(text, { x: MARGIN, y: this.y, size: 11, font: this.bold, color: BRAND.ink });
    this.y -= 16;
  }

  private wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const trial = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = trial;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [""];
  }

  paragraph(text: string, opts?: { size?: number; color?: ReturnType<typeof rgb>; italic?: boolean }): void {
    const size = opts?.size ?? 10;
    const color = opts?.color ?? BRAND.ink;
    const lines = this.wrapText(text, this.font, size, this.contentWidth);
    for (const line of lines) {
      this.ensureSpace(size + 6);
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.font, color });
      this.y -= size + 6;
    }
    this.y -= 4;
  }

  bullet(text: string, opts?: { size?: number }): void {
    const size = opts?.size ?? 10;
    const lines = this.wrapText(text, this.font, size, this.contentWidth - 14);
    lines.forEach((line, i) => {
      this.ensureSpace(size + 5);
      if (i === 0) this.page.drawText("•", { x: MARGIN, y: this.y, size, font: this.bold, color: BRAND.accent });
      this.page.drawText(line, { x: MARGIN + 14, y: this.y, size, font: this.font, color: BRAND.ink });
      this.y -= size + 5;
    });
  }

  keyValueRow(label: string, value: string): void {
    const size = 10;
    this.ensureSpace(size + 8);
    this.page.drawText(label, { x: MARGIN, y: this.y, size, font: this.bold, color: BRAND.muted });
    const labelWidth = 170;
    const valueLines = this.wrapText(value || "—", this.font, size, this.contentWidth - labelWidth);
    valueLines.forEach((line, i) => {
      if (i > 0) this.ensureSpace(size + 4);
      this.page.drawText(line, { x: MARGIN + labelWidth, y: this.y, size, font: this.font, color: BRAND.ink });
      if (i < valueLines.length - 1) this.y -= size + 4;
    });
    this.y -= size + 8;
  }

  spacer(height = 10): void {
    this.y -= height;
  }

  badge(text: string, color: ReturnType<typeof rgb> = BRAND.primary): void {
    const size = 8;
    const padding = 5;
    const w = this.font.widthOfTextAtSize(text, size) + padding * 2;
    this.ensureSpace(16);
    this.page.drawRectangle({ x: MARGIN, y: this.y - 2, width: w, height: 14, color, opacity: 0.12 });
    this.page.drawText(text, { x: MARGIN + padding, y: this.y + 2, size, font: this.bold, color });
    this.y -= 20;
  }

  async finish(): Promise<Uint8Array> {
    const total = this.pages.length;
    this.pages.forEach((page, i) => {
      page.drawText(`${this.title} — ${i + 1} / ${total}`, {
        x: MARGIN,
        y: 24,
        size: 8,
        font: this.font,
        color: BRAND.muted,
      });
      page.drawText(new Date().toISOString().slice(0, 10), {
        x: this.pageSize[0] - MARGIN - 60,
        y: 24,
        size: 8,
        font: this.font,
        color: BRAND.muted,
      });
    });
    return this.doc.save();
  }
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
