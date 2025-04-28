import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFollow extends Document {
  followerId: Types.ObjectId;
  followingId: Types.ObjectId;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    followerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    followingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export default mongoose.models.Follow ||
  mongoose.model<IFollow>("Follow", FollowSchema);
