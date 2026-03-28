import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required(this: { authProvider?: string }) {
        return this.authProvider !== "google";
      },
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    profileUrl: {
      type: String,
      default: "",
    },
    refreshTokens: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: unknown) {
    throw new Error(String(error));
  }
});

export default mongoose.model("User", userSchema);
