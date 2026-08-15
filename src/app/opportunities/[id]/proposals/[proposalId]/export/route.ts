import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markdownToDocxBuffer } from "@/lib/docx-export";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const { proposalId } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const buffer = await markdownToDocxBuffer(proposal.content);
  const filename = `${proposal.title.replace(/[^a-z0-9]+/gi, "-")}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
