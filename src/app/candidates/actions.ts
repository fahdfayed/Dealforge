"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCandidate,
  updateCandidate,
  logCandidateSearch,
  type CandidateFilters,
  type CandidateInput,
} from "@/lib/candidate-repo";
import { getCurrentUser } from "@/lib/identity";
import {
  makeStorageKey,
  putObject,
  extractTextExcerpt,
  isTextLike,
  SOURCE_FILE_MAX_BYTES,
} from "@/lib/storage";
import { newId } from "@/lib/id";
import { knownSkills } from "@/lib/oracle-skills";

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function readForm(formData: FormData, createdBy: string): CandidateInput {
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim(),
    primarySkill: String(formData.get("primarySkill") ?? "").trim(),
    // Multi-select posts one entry per selection.
    oracleSkills: knownSkills(formData.getAll("oracleSkills").map(String)),
    yearsExperience: numberOrNull(formData.get("yearsExperience")),
    currentEmployer: String(formData.get("currentEmployer") ?? "").trim(),
    noticePeriodDays: numberOrNull(formData.get("noticePeriodDays")),
    availableFrom: String(formData.get("availableFrom") ?? "").trim() || null,
    expectedRate: numberOrNull(formData.get("expectedRate")),
    rateCurrency: String(formData.get("rateCurrency") ?? "AED").trim(),
    rateUnit: String(formData.get("rateUnit") ?? "Per day").trim(),
    workAuthorisation: String(formData.get("workAuthorisation") ?? "").trim(),
    source: String(formData.get("source") ?? "Inbound application").trim(),
    vendorName: String(formData.get("vendorName") ?? "").trim(),
    status: String(formData.get("status") ?? "Active").trim(),
    ownerId: String(formData.get("ownerId") ?? "").trim() || null,
    communicationRating: String(formData.get("communicationRating") ?? "Not assessed").trim(),
    softSkillNotes: String(formData.get("softSkillNotes") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    createdBy,
  };
}

// Stores the resume and returns what the row needs. The extracted text feeds
// full-text search only; the original file is what anyone actually reads, so
// both are kept.
async function readResume(
  formData: FormData,
  candidateId: string
): Promise<{ resumeStorageKey?: string; resumeFilename?: string; resumeText?: string }> {
  const file = formData.get("resume");
  if (!(file instanceof File) || file.size === 0) return {};
  if (file.size > SOURCE_FILE_MAX_BYTES) {
    throw new Error(`Resume is larger than ${Math.floor(SOURCE_FILE_MAX_BYTES / (1024 * 1024))} MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const key = makeStorageKey("resumes", candidateId, file.name);
  await putObject(key, bytes);

  return {
    resumeStorageKey: key,
    resumeFilename: file.name,
    // Only plain-text formats are extracted here. A PDF or DOCX is stored and
    // downloadable, but its text is not indexed — pretending otherwise would
    // make search quietly miss the majority of resumes, so the UI says so.
    resumeText: isTextLike(file.name) ? extractTextExcerpt(bytes) : "",
  };
}

export async function createCandidateAction(formData: FormData) {
  const user = await getCurrentUser();
  const input = readForm(formData, user.name);
  if (!input.fullName) throw new Error("A candidate needs a name.");

  const candidateId = newId();
  const resume = await readResume(formData, candidateId);
  const created = await createCandidate({ ...input, ...resume }, candidateId);

  revalidatePath("/candidates");
  redirect(`/candidates/${created.id}`);
}

export async function updateCandidateAction(id: string, formData: FormData) {
  const user = await getCurrentUser();
  const input = readForm(formData, user.name);
  if (!input.fullName) throw new Error("A candidate needs a name.");

  const resume = await readResume(formData, id);
  await updateCandidate(id, { ...input, ...resume });

  revalidatePath("/candidates");
  revalidatePath(`/candidates/${id}`);
}

// Recording the search is the point, not a side effect: the process requires
// the repository to be searched before external sourcing, and that rule can
// only be enforced if searches leave a trace.
export async function logSearchAction(
  filters: CandidateFilters,
  resultCount: number,
  requisitionId?: string | null
) {
  const user = await getCurrentUser();
  await logCandidateSearch({
    searchedBy: user.name,
    query: filters.q ?? "",
    filters,
    resultCount,
    requisitionId: requisitionId ?? null,
  });
}
