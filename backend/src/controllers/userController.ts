import { Request, Response } from 'express';
import { Types } from 'mongoose';
import User from '../models/userModel';
import Post from '../models/postModel';
import { AuthRequest } from '../types/auth';
import { toPostDTO, getCommentCountMap } from '../utils/postSerializer';
import { generateTokens, verifyRefreshToken } from '../utils/authUtils';
import {
  authenticateGoogleUser,
  authenticateLocalUser,
  registerLocalUser,
} from '../services/authService';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const newUser = await registerLocalUser(username, email, password);
    const tokens = generateTokens(newUser._id.toString(), newUser.username);
    
    newUser.refreshTokens.push(tokens.refreshToken);
    await newUser.save();

    res.status(201).json({
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
      ...tokens
    });
  } catch (error: any) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: 'Error during registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await authenticateLocalUser(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const tokens = generateTokens(user._id.toString(), user.username);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.json({
      user: { id: user._id, username: user.username, email: user.email },
      ...tokens
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      await user.save();
    }

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const newTokens = generateTokens(user._id.toString(), user.username);
    
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newTokens.refreshToken);
    await user.save();

    res.json(newTokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Google idToken is required" });
    }

    const user = await authenticateGoogleUser(idToken);
    if (!user) {
      return res.status(401).json({ message: "Invalid Google credentials" });
    }

    // Generate and save refresh token to database
    const tokens = generateTokens(user._id.toString(), user.username);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();
    
    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        profileUrl: user.profileUrl,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(401).json({ message: "Invalid Google credentials" });
  }
};

export async function getUserById(req: AuthRequest, res: Response): Promise<void> {
  const user = await User.findById(req.params['id']).select('-password -refreshTokens');
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