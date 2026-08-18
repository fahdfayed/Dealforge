"use server";

import { getCurrentUser } from "@/lib/identity";
import { mutateDeal } from "@/lib/deal-mutation";

export async function addCommentAction(dealId: string, revision: number, text: string, replyToId?: string) {
  if (!text.trim()) throw new Error("Comment cannot be empty.");
  const user = await getCurrentUser();

  await mutateDeal(dealId, revision, (twin) => {
    const newComment = {
      id: crypto.randomUUID(),
      author: user.name,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      replies: [],
    };

    if (replyToId) {
      const findAndReply = (comments: any[]): boolean => {
        for (const comment of comments) {
          if (comment.id === replyToId) {
            comment.replies.push(newComment);
            return true;
          }
          if (findAndReply(comment.replies)) return true;
        }
        return false;
      };
      findAndReply(twin.teamComments);
    } else {
      twin.teamComments.push(newComment);
    }

    return twin;
  }, `/deals/${dealId}/comments`);
}

export async function deleteCommentAction(dealId: string, revision: number, commentId: string) {
  await mutateDeal(dealId, revision, (twin) => {
    const deleteRecursive = (comments: any[]): boolean => {
      const index = comments.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        comments.splice(index, 1);
        return true;
      }
      for (const comment of comments) {
        if (deleteRecursive(comment.replies)) return true;
      }
      return false;
    };
    deleteRecursive(twin.teamComments);
    return twin;
  }, `/deals/${dealId}/comments`);
}
