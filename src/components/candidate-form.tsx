import {
  ORACLE_SKILL_GROUPS,
  ORACLE_SKILLS,
  CANDIDATE_STATUSES,
  CANDIDATE_SOURCES,
  COMMUNICATION_RATINGS,
  RATE_UNITS,
} from "@/lib/oracle-skills";
import type { Candidate } from "@/lib/candidate-repo";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

// Shared by the create and edit screens so the two cannot drift. Fields are
// controlled selects wherever a value will later be filtered on — a free-text
// skill or status is a filter that quietly stops working.
export function CandidateForm({
  candidate,
  submitLabel,
}: {
  candidate?: Candidate;
  submitLabel: string;
}) {
  const c = candidate;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Who they are" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" defaultValue={c?.fullName} required />
          <Field label="Current employer" name="currentEmployer" defaultValue={c?.currentEmployer} />
          <Field label="Email" name="email" type="email" defaultValue={c?.email} />
          <Field label="Phone" name="phone" defaultValue={c?.phone} />
          <Field label="Location" name="location" defaultValue={c?.location} placeholder="Dubai" />
          <Field label="Country" name="country" defaultValue={c?.country} placeholder="UAE" />
          <Field
            label="Work authorisation"
            name="workAuthorisation"
            defaultValue={c?.workAuthorisation}
            placeholder="UAE employment visa, transferable"
          />
          <Select label="Status" name="status" defaultValue={c?.status ?? "Active"} options={[...CANDIDATE_STATUSES]} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What they do" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Primary skill"
              name="primarySkill"
              defaultValue={c?.primarySkill ?? ""}
              options={["", ...ORACLE_SKILLS]}
            />
            <Field
              label="Years of experience"
              name="yearsExperience"
              type="number"
              min={0}
              defaultValue={c?.yearsExperience ?? ""}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              All Oracle skills
            </label>
            <select
              name="oracleSkills"
              multiple
              size={10}
              defaultValue={c?.oracleSkills ?? []}
              className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              {ORACLE_SKILL_GROUPS.map((group) => (
                <optgroup key={group.group} label={group.group}>
                  {group.skills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-400">
              Hold Ctrl or Cmd to select several. Anything outside this list is discarded, so a
              typo cannot split search results.
            </p>
          </div>

          <Textarea
            label="Summary"
            name="summary"
            defaultValue={c?.summary}
            rows={3}
            placeholder="What they have actually done, in a sentence or two."
          />
          <Field
            label="Tags"
            name="tags"
            defaultValue={c?.tags.join(", ")}
            placeholder="Comma separated"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Availability and rate" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Notice period (days)"
            name="noticePeriodDays"
            type="number"
            min={0}
            defaultValue={c?.noticePeriodDays ?? ""}
          />
          <Field
            label="Available from"
            name="availableFrom"
            type="date"
            defaultValue={c?.availableFrom?.slice(0, 10) ?? ""}
          />
          <Field
            label="Expected rate"
            name="expectedRate"
            type="number"
            min={0}
            defaultValue={c?.expectedRate ?? ""}
          />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Currency" name="rateCurrency" defaultValue={c?.rateCurrency ?? "AED"} />
            <Select label="Per" name="rateUnit" defaultValue={c?.rateUnit ?? "Per day"} options={[...RATE_UNITS]} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Soft skills and communication" />
        <CardBody className="space-y-4">
          {/* Captured at first contact rather than discovered at client
              interview, which is where it currently surfaces. */}
          <Select
            label="Communication"
            name="communicationRating"
            defaultValue={c?.communicationRating ?? "Not assessed"}
            options={[...COMMUNICATION_RATINGS]}
          />
          <Textarea
            label="Observations"
            name="softSkillNotes"
            defaultValue={c?.softSkillNotes}
            rows={3}
            placeholder="How they came across on the call: clarity, confidence, listening, gaps to prepare for."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Where they came from" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Source"
            name="source"
            defaultValue={c?.source ?? "Inbound application"}
            options={[...CANDIDATE_SOURCES]}
          />
          <Field
            label="Vendor"
            name="vendorName"
            defaultValue={c?.vendorName}
            placeholder="Only if sourced through a partner"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Resume" />
        <CardBody className="space-y-2">
          {c?.resumeFilename && (
            <p className="text-xs text-slate-500">
              On file: <span className="font-medium text-slate-700">{c.resumeFilename}</span>. Uploading
              a new file replaces it.
            </p>
          )}
          <input type="file" name="resume" className="w-full text-sm" />
          <p className="text-xs text-slate-400">
            Up to 10 MB. Text files are indexed for keyword search; PDF and Word files are stored
            and downloadable but their contents are not searchable yet.
          </p>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  min,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  min?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        name={name}
        min={min}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o || "—"}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  rows = 3,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}
