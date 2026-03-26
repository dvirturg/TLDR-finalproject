import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/userModel';
import Post from '../models/postModel';
import { AuthRequest } from '../types/auth';
import { toPostDTO, getCommentCountMap } from '../utils/postSerializer';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/authUtils'; 


export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const newUser = await User.create({ username, email, password });

    const accessToken = generateToken(newUser._id.toString(), newUser.username);

    res.status(201).json({
      accessToken,
      user: {
        id: String(newUser._id),
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error: any) {
  console.error("Registration Error Details:", error); // זה ידפיס בטרמינל של ה-VS Code את השגיאה
  res.status(500).json({ 
    message: 'Error during registration', 
    error: error.message
  });  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = generateToken(user._id.toString(), user.username);

    res.json({
      accessToken,
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        profileUrl: user.profileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
}

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