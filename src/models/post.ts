import mongoose, { Schema, Document, Types } from "mongoose";
import { addPostHooks } from "@/mongooseHooks/postHooks";

export interface IPost extends Document {
  authorId: Types.ObjectId;
  content?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;

  comments: Types.ObjectId[]; // reference to comments,
  likes: Types.ObjectId[]; // reference to likes ,
  notifications: Types.ObjectId[]; // reference to notification
}

const PostSchema = new Schema<IPost>(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    image: {
      type: String,
    },
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Like",
      },
    ],
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification",
      },
    ],
  },
  { timestamps: true }
);

addPostHooks(PostSchema);

export default mongoose.models.Post ||
  mongoose.model<IPost>("Post", PostSchema);
