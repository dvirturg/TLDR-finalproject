import bcrypt from "bcrypt";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import User from "../models/userModel";
import { generateTokens } from "../utils/authUtils";

type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    profileUrl?: string;
  };
};

const googleClient = new OAuth2Client();

const slugifyUsername = (value: string): string => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
  return normalized || "user";
};

const buildUniqueUsername = async (seed: string): Promise<string> => {
  const base = slugifyUsername(seed);
  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}${suffix}`;
    const existingUser = await User.exists({ username: candidate });
    if (!existingUser) return candidate;
  }
  return `${base}${Date.now()}`;
};

const mapGooglePayload = (payload: TokenPayload): GoogleProfile => ({
  googleId: payload.sub,
  email: payload.email ?? "",
  emailVerified: payload.email_verified ?? false,
  name: payload.name,
  picture: payload.picture,
});

export const buildAuthResponse = (user: any): AuthResponse => {
  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.username);
  const profileUrl = 
    user.profileUrl || 
    user.picture || 
    (user._doc && (user._doc.profileUrl || user._doc.picture)) || 
    "";

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      profileUrl: profileUrl,
    },
  };
};

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleProfile> => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) throw new Error("GOOGLE_CLIENT_ID is not defined");

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("Missing Google token payload");

  return mapGooglePayload(payload);
};

export const authenticateLocalUser = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || !user.password) return null;

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return null;

  return user;
};

export const registerLocalUser = async (username: string, email: string, password: string) => {
  return User.create({ username, email, password, authProvider: "local" });
};

export const authenticateGoogleUser = async (idToken: string) => {
  const profile = await verifyGoogleIdToken(idToken);
  
  if (!profile.email || !profile.emailVerified) return null;

  const existingUser = await User.findOne({ email: profile.email });
  if (existingUser) {
    if (!existingUser.googleId) existingUser.googleId = profile.googleId;
    if (existingUser.authProvider !== "google") existingUser.authProvider = "google";
    await existingUser.save();
    return existingUser;
  }

  const usernameSeed = profile.name ?? profile.email.split("@")[0] ?? "user";
  const username = await buildUniqueUsername(usernameSeed);

  return User.create({
    username,
    email: profile.email,
    authProvider: "google",
    googleId: profile.googleId,
    profileUrl: profile.picture ?? "",
  });
};