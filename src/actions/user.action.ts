"use server";

import { connectToDB } from "@/lib/mongodb";
import Follow from "@/models/follows";
import notification from "@/models/notification";
import Post from "@/models/post";
import User from "@/models/user";
import { auth, currentUser } from "@clerk/nextjs/server";
import mongoose from "mongoose";

// Function to sync user information
export async function syncUser() {
  try {
    await connectToDB(); // Ensure the DB is connected

    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return null;

    const existingUser = await User.findOne({ clerkId: userId });

    if (existingUser) return existingUser;

    const newUser = await User.create({
      clerkId: userId,
      name: `${user.firstName || ""} ${user.lastName}`,
      username:
        user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
      email: user.emailAddresses[0].emailAddress,
      image: user.imageUrl,
    });

    return newUser;
  } catch (error) {
    console.log("Error syncing user: ", error);
  }
}

// Function to get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  try {
    await connectToDB(); // Ensure the DB is connected

    const userDoc = await User.findOne({ clerkId });

    if (!userDoc) return null;

    const user = userDoc.toObject();

    const userId = user._id;

    // Using Promise.all to run these in parallel
    const [followersCount, followingCount, postsCount] = await Promise.all([
      Follow.countDocuments({ followingId: userId }),
      Follow.countDocuments({ followerId: userId }),
      Post.countDocuments({ authorId: userId }),
    ]);

    return {
      ...user,
      _count: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
      },
    };
  } catch (error) {
    console.log("Error in getUser: ", error);
  }
}

// getting just the id of the user from the database

export async function getDBUserId() {
  const { userId: clerkId } = await auth();

  console.log("This is the clerk id ", clerkId);

  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);

  console.log("This is the user ", user);

  if (!user) {
    console.log("This is the error if user is not found ");
    throw new Error("User not found");
  }

  return user._id;
}

export async function getSuggestedUsers() {
  try {
    await connectToDB();

    const userId = await getDBUserId();
    if (!userId) return [];

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const currentUser = await User.findById(userObjectId).select("following");

    const followingList: mongoose.Types.ObjectId[] =
      currentUser?.following || [];

    //get 3 random users , excluding us and the ones we follow
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userObjectId, $nin: followingList },
        },
      },
      {
        $project: {
          id: "$_id",
          name: 1,
          username: 1,
          image: 1,
          followersCount: { $size: "$followers" },
        },
      },
      { $sample: { size: 3 } },
    ]);

    return suggestedUsers;
  } catch (error) {
    console.error("error getting the suggested users");
  }
}

export async function toggleFollow(userToFollowId: string) {
  try {
    await connectToDB();

    const currentUserId = await getDBUserId();

    if (currentUserId === userToFollowId)
      throw new Error("You cannot follow yourself");

    //person who is following
    const followerObjectId = new mongoose.Types.ObjectId(currentUserId);

    // person whom he wants to follow
    const followingObjectId = new mongoose.Types.ObjectId(userToFollowId);

    const alreadyFollow = await Follow.findOne({
      followerId: followerObjectId,
      followingId: followingObjectId,
    });

    if (alreadyFollow) {
      await Follow.deleteOne({
        followerId: followerObjectId,
        followingId: followingObjectId,
      });
    } else {
      await Promise.all([
        Follow.create({
          followerId: followerObjectId,
          followingObjectId: followingObjectId,
        }),

        notification.create({
          type: "FOLLOW",
          userId: followingObjectId, // person who is being followed
          creatorId: followerObjectId, // person who is following
        }),
      ]);
    }

    return { success: true };
  } catch (error) {
    console.error("Error in the follow action ", error);
    return { success: false, error: "Error toggling follow" };
  }
}
