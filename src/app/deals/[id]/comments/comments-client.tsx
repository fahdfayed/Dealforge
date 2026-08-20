"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { ActionButton } from "@/components/button-group";
import { Textarea } from "@/components/form-input";
import { EmptyState } from "@/components/empty-state";
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
        <CardHeader title="Team comments" />
        <CardBody>
          <form onSubmit={handleAddComment} className="mb-6 space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
              disabled={loading}
              rows={3}
              label={replyingTo ? "Reply" : "New comment"}
            />
            <div className="flex justify-between items-center">
              {replyingTo && (
                <ActionButton
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  variant="ghost"
                  size="sm"
                >
                  ✕ Cancel reply
                </ActionButton>
              )}
              <div className="flex-1" />
              <ActionButton
                type="submit"
                disabled={!newComment.trim() || loading}
                variant="primary"
                loading={loading}
              >
                {loading ? "Posting..." : "Post"}
              </ActionButton>
            </div>
          </form>

          {deal.twin.teamComments.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No comments yet"
              compact
            />
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

      <Link href={`/deals/${dealId}`}>
        <ActionButton variant="secondary" className="w-full">
          Back to deal
        </ActionButton>
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
          <ActionButton
            onClick={() => onDelete(comment.id)}
            variant="ghost"
            size="sm"
            title="Delete comment"
          >
            ✕
          </ActionButton>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          <p className="text-slate-500">{new Date(comment.createdAt).toLocaleString()}</p>
          <ActionButton
            onClick={() => onReply(comment.id)}
            variant="ghost"
            size="sm"
          >
            Reply
          </ActionButton>
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
