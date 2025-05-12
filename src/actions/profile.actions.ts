"use server";

import { connectToDB } from "@/lib/mongodb";
import follows from "@/models/follows";
import post from "@/models/post";
import user from "@/models/user";
import { auth } from "@clerk/nextjs/server";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getDBUserId } from "./user.action";

export async function getProfileByUsername(username: string) {
  try {
    await connectToDB();

    const currentUser = await user.findOne({ username });

    if (!currentUser) return null;

    const userId = new mongoose.Types.ObjectId(currentUser._id);

    const [followersCount, followingCount, postsCount] = await Promise.all([
      follows.countDocuments({ followingId: userId }),
      follows.countDocuments({ followerId: userId }),
      post.countDocuments({ authorId: userId }),
    ]);

    return {
      id: currentUser._id,
      name: currentUser.name,
      username: currentUser.username,
      bio: currentUser.bio,
      image: currentUser.image,
      location: currentUser.location,
      website: currentUser.website,
      createdAt: currentUser.createdAt,
      _count: {
        followers: followersCount,
        following: followingCount,
        posts: postsCount,
      },
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw new Error("Failed to fetch profile");
  }
}

export async function getUserPosts(userId: string) {
  try {
    await connectToDB();

    const currentPosts = await post
      .find({ authorId: userId })
      .populate({
        path: "authorId",
        select: "_id name username image",
        model: user,
      })
      .populate({
        path: "comments.authorId",
        select: "_id name username image",
        model: user,
      })
      .populate({
        path: "likes",
        select: "userId",
      })
      .lean()
      .sort({ createdAt: -1 });

    const newPosts = currentPosts.map((post) => ({
      ...post,
      _id: String(post._id),
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      content: post.content,
      image: post.image,
      comments: post.comments.map((comment: any) => ({
        ...comment,
        authorId: comment.authorId,
      })),
      likes: post.likes.map((like: any) => ({ userId: like.userId })),
      _count: {
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
      },
    }));

    return newPosts;
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw new Error("Failed to fetch user posts");
  }
}

export async function getUserLikedPosts(userId: string) {
  try {
    await connectToDB();

    const likedPosts = await post
      .find({
        "likes.userId": new mongoose.Types.ObjectId(userId),
      })
      .populate({
        path: "authorId",
        select: "id name username image",
        model: user,
      })
      .populate({
        path: "comments.authorId",
        select: "id name username image",
        model: user,
      })
      .sort({ createdAt: -1 })
      .lean();

    const enrichedPosts = likedPosts.map((post) => ({
      ...post,
      author: post.authorId,
      comments: post.comments.map((comment: any) => ({
        ...comment,
        author: comment.authorId,
      })),
      likes: post.likes.map((like: any) => ({ userId: like.userId })),
      _count: {
        likes: post.likes?.length || 0,
        comments: post.comments?.length || 0,
      },
    }));

    return enrichedPosts;
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    throw new Error("Failed to fetch liked posts");
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const location = formData.get("location") as string;
    const website = formData.get("website") as string;

    await connectToDB();

    // Update the user profile in the database
    const currentUser = await user.findOneAndUpdate(
      { clerkId }, // Find user by Clerk ID
      { name, bio, location, website }, // Update the fields
      { new: true } // Return the updated user
    );

    // Revalidate the profile path after the update
    revalidatePath("/profile");

    return { success: true, currentUser };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getDBUserId();
    if (!currentUserId) return false;

    await connectToDB();

    // Check if a follow relationship exists between the current user and the target user
    const follow = await follows.findOne({
      followerId: currentUserId,
      followingId: userId,
    });

    return !!follow; // Return true if the follow relationship exists
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
}
