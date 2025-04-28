import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILike extends Document {
  postId: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Add indexes (for faster queries)
LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });
// Prevents the same user liking the same post twice

export default mongoose.models.Like ||
  mongoose.model<ILike>("Like", LikeSchema);
