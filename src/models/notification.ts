import mongoose, { Schema, Document, Types } from "mongoose";

export enum NotificationType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
}

export interface INotification extends Document {
  userId: Types.ObjectId;
  creatorId: Types.ObjectId;
  type: NotificationType;
  read: boolean;
  postId?: Types.ObjectId;
  commentId?: Types.ObjectId;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    read: { type: Boolean, default: false },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
