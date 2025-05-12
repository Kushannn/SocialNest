import { Types } from "mongoose";

export enum NotificationType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
}

export interface NotificationBase {
  _id: string;
  userId: string;
  creatorId: {
    _id: string;
    name: string;
    username: string;
    image: string;
  };
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  post?: {
    _id: string;
    content?: string;
    image?: string;
  };
  comment?: {
    _id: string;
    content: string;
    createdAt: Date;
  };
}
