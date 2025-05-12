import mongoose, { Schema, Types, Document } from "mongoose";

export interface IComment extends Document {
  content: String;
  authorId: Types.ObjectId;
  postId: Types.ObjectId;
  notifications: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
  },
  { timestamps: true }
);

CommentSchema.index({ authorId: 1, postId: 1 });

export default mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
