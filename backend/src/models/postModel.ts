import mongoose from 'mongoose';


const PostSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);



export default mongoose.model('Post', PostSchema);
