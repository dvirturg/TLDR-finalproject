import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
        required: true
    },
    content: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
  },
  { timestamps: true }

);
export default mongoose.model('ChatMessage', ChatMessageSchema);