import { Types } from 'mongoose';
import Comment from '../models/commentModel';

export interface PostDTO {
  _id: string;
  id: string;
  text: string;
  imageUrl: string;
  author: { id: string; username: string; profileUrl: string } | null;
  likes: number;
  likedByCurrentUser: boolean;
  commentCount: number;
}

export function toPostDTO(post: any, commentCount: number, currentUserId?: string): PostDTO {
  const a = post.author;
  const author =
    a && typeof a === 'object' && 'username' in a
      ? { id: String(a._id), username: String(a.username), profileUrl: String(a.profileUrl ?? '') }
      : null;
  const likesArray = Array.isArray(post.likes) ? (post.likes as unknown[]) : [];
  
  const likedByCurrentUser = !!currentUserId && likesArray.some((id) => String(id) === currentUserId);
  
  return {
    _id: String(post._id),
    id: String(post._id),
    text: String(post.text),
    imageUrl: String(post.imageUrl ?? ''),
    author,
    likes: likesArray.length,
    likedByCurrentUser,
    commentCount,
  };
}

export async function getCommentCountMap(
  postIds: Types.ObjectId[],
): Promise<Map<string, number>> {
  if (postIds.length === 0) return new Map();
  const counts = await Comment.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { postId: { $in: postIds } } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map(({ _id, count }) => [String(_id), count]));
}