"use client";

import { useState, useTransition } from "react";

export function DiscoveryAnswerField({
  opportunityId,
  questionId,
  initialAnswer,
  onSave,
}: {
  opportunityId: string;
  questionId: string;
  initialAnswer: string;
  onSave: (opportunityId: string, questionId: string, answer: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initialAnswer);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);

  return (
    <div className="mt-1.5">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        onBlur={() => {
          if (saved) return;
          startTransition(async () => {
            await onSave(opportunityId, questionId, value);
            setSaved(true);
          });
        }}
        rows={value ? 2 : 1}
        placeholder="Capture the answer, or paste relevant notes…"
        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <p className="mt-0.5 text-[11px] text-slate-400">
        {isPending ? "Saving…" : saved ? (value ? "Saved" : "Unanswered") : "Unsaved changes — click away to save"}
      </p>
    </div>
  );
}
