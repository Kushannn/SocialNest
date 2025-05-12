"use server";

import { connectToDB } from "@/lib/mongodb";
import { getDBUserId } from "./user.action";
import notification from "@/models/notification";
import mongoose from "mongoose";
import { sanitizeMongoDoc } from "@/utilites/sanitizeMongoData";

export async function getNotifications() {
  await connectToDB();

  try {
    const userId = await getDBUserId();
    if (!userId) return [];

    const newNotifications = await notification
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate({
        path: "creatorId",
        select: "id name username image",
        model: "User",
      })
      .populate({
        path: "postId",
        select: "id content image",
        model: "Post",
      })
      .populate({
        path: "commentId",
        select: "id content createdAt",
        model: "Comment",
      })
      .lean();

    // console.log("new notifications ", newNotifications);

    const safeNotifications = sanitizeMongoDoc(newNotifications);

    // console.log("safe notifications ", safeNotifications);

    return safeNotifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new Error("Failed to fetch notifications");
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    await connectToDB();

    // console.log("notificaiton ids ", notificationIds);

    await notification.updateMany(
      {
        _id: {
          $in: notificationIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
      {
        $set: { read: true },
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return { success: false };
  }
}
