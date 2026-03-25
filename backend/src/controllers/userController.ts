import { Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/userModel';
import Post from '../models/postModel';
import { AuthRequest } from '../types/auth';
import { toPostDTO, getCommentCountMap } from '../utils/postSerializer';

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.params['id']).select('-password -refreshToken');
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({
    id: String(user._id),
    username: user.username,
    email: user.email,
    profileUrl: user.profileUrl,
  });
}

export async function updateUser(req: AuthRequest, res: Response): Promise<void> {
  if (req.params['id'] !== req.user!.sub) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const user = await User.findById(req.params['id']);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { username, email } = req.body as { username?: string; email?: string };
  if (username !== undefined) user.username = username;
  if (email !== undefined) user.email = email;
  if (req.file) user.profileUrl = `/uploads/${req.file.filename}`;

  await user.save();

  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    profileUrl: user.profileUrl,
  });
}

export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  if (req.params['id'] !== req.user!.sub) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  const user = await User.findByIdAndDelete(req.params['id']);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.status(204).send();
}

export async function searchUsers(req: AuthRequest, res: Response): Promise<void> {
  const q = (req.query['q'] as string | undefined)?.trim() ?? '';
  if (!q) {
    res.json([]);
    return;
  }

  const users = await User.find({
    username: { $regex: q, $options: 'i' },
    _id: { $ne: new Types.ObjectId(req.user!.sub) },
  })
    .select('_id username profileUrl')
    .limit(10);

  res.json(users.map((u) => ({
    id: String(u._id),
    username: u.username,
    profileUrl: u.profileUrl,
  })));
}

export async function getUserPosts(req: AuthRequest, res: Response): Promise<void> {
  const posts = await Post.find({ author: req.params['id'] })
    .sort({ createdAt: -1 })
    .populate('author', 'username profileUrl');

  const countMap = await getCommentCountMap(posts.map((p) => p._id as Types.ObjectId));
  const data = posts.map((p) => toPostDTO(p, countMap.get(String(p._id)) ?? 0));

  res.json(data);
}