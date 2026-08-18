"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { addCommentAction, deleteCommentAction } from "./actions";
import type { TeamComment, Deal } from "@/types/deal-twin";

export function CommentsClient({ initialDeal, dealId }: { initialDeal: Deal; dealId: string }) {
  const [deal, setDeal] = useState<Deal>(initialDeal);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await addCommentAction(dealId, deal.revision, newComment, replyingTo || undefined);
      setNewComment("");
      setReplyingTo(null);
      // Refresh deal - in a real app you'd use a proper cache invalidation
      // For now, just update optimistically
      setDeal((prev) => ({
        ...prev,
        revision: prev.revision + 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    setLoading(true);
    try {
      await deleteCommentAction(dealId, deal.revision, commentId);
      setDeal((prev) => ({
        ...prev,
        revision: prev.revision + 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader title="Team comments" subtitle="Discuss this deal with your team" />
        <CardBody>
          <form onSubmit={handleAddComment} className="mb-6 space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              disabled={loading}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:bg-slate-50"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <div className="text-xs text-slate-500">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    ✕ Cancel reply
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || loading}
                className="rounded-md px-4 py-2 text-sm font-medium text-white hover:shadow-md disabled:bg-slate-300"
                style={{
                  backgroundColor: !newComment.trim() || loading ? undefined : "var(--intelloger-navy)",
                }}
              >
                {loading ? "..." : "Post"}
              </button>
            </div>
          </form>

          {deal.twin.teamComments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet. Start the conversation.</p>
          ) : (
            <div className="space-y-4">
              {deal.twin.teamComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  dealId={dealId}
                  revision={deal.revision}
                  onReply={setReplyingTo}
                  onDelete={handleDeleteComment}
                  isReplying={replyingTo === comment.id}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Link href={`/deals/${dealId}`} className="block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 text-center">
        Back to deal
      </Link>
    </div>
  );
}

function CommentThread({
  comment,
  dealId,
  revision,
  onReply,
  onDelete,
  isReplying,
  depth = 0,
}: {
  comment: TeamComment;
  dealId: string;
  revision: number;
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  isReplying?: boolean;
  depth?: number;
}) {
  const marginLeft = depth * 24;

  return (
    <div style={{ marginLeft: `${marginLeft}px` }} className="space-y-3">
      <div className={`rounded-md border ${isReplying ? "border-slate-400 bg-blue-50" : "border-slate-200"} p-3`} style={{ borderColor: isReplying ? "var(--intelloger-navy)" : undefined, backgroundColor: isReplying ? "rgba(0, 61, 122, 0.05)" : undefined }}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-900">{comment.author}</p>
            <p className="mt-1 text-sm text-slate-700">{comment.text}</p>
          </div>
          <button
            onClick={() => onDelete(comment.id)}
            className="text-xs text-slate-400 hover:text-rose-600"
            title="Delete comment"
          >
            ✕
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <p className="text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
          <button
            onClick={() => onReply(comment.id)}
            className="font-medium hover:underline"
            style={{ color: "var(--intelloger-navy)" }}
          >
            Reply
          </button>
        </div>
      </div>

      {comment.replies.map((reply) => (
        <CommentThread
          key={reply.id}
          comment={reply}
          dealId={dealId}
          revision={revision}
          onReply={onReply}
          onDelete={onDelete}
          isReplying={isReplying}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
