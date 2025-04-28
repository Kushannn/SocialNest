import mongoose, { Schema, Document, Types } from "mongoose";
import { addUserHooks } from "@/mongooseHooks/userHooks";

export interface IUser extends Document {
  email: string;
  username: string;
  clerkId: string;
  name?: string;
  bio?: string;
  image?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;

  posts: Types.ObjectId[];
  comments: Types.ObjectId[];
  likes: Types.ObjectId[];

  followers: Types.ObjectId[];
  following: Types.ObjectId[];

  notifications: Types.ObjectId[];
  notificationsCreated: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    clerkId: { type: String, required: true, unique: true },
    name: { type: String },
    bio: { type: String },
    image: { type: String },
    location: { type: String },
    website: { type: String },

    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Like" }],

    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Follow" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "Follow" }],

    notifications: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
    notificationsCreated: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
    ],
  },
  { timestamps: true }
);

addUserHooks(UserSchema);

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
