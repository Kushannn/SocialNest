"use server";

import { connectToDB } from "@/lib/mongodb";
import { getDBUserId } from "./user.action";
import { ObjectId } from "mongodb";
import "@/models/comment"; //
import "@/models/like";
import { sanitizeMongoDoc } from "@/utilites/sanitizeMongoData";

import { revalidatePath } from "next/cache";
import like from "@/models/like";
import mongoose from "mongoose";
import notification from "@/models/notification";
import comment from "@/models/comment";
import post from "@/models/post";

export async function createPost(content: string, imageUrl: string) {
  try {
    await connectToDB();

    const userId = await getDBUserId();

    if (!userId) return { success: false, error: "User not found" };

    const postToUpload = await post.create({
      content,
      imageUrl,
      authorId: userId,
    });

    revalidatePath("/"); // purge the cache for home page ( save the post and then redirect to home page)

    // console.log("This is the post ", postToUpload);

    return { success: true, postToUpload };
  } catch (error) {
    console.log("Failed to create the post ", error);
    return { success: false, error: "Failed to create the post" };
  }
}

export async function getPosts() {
  try {
    await connectToDB();

    const posts = await post
      .find({})
      .sort({ createdAt: -1 })
      .populate({
        path: "authorId",
        select: "id name image username",
      })
      .populate({
        path: "comments",
        options: { sort: { createdAt: 1 } },
        populate: {
          path: "authorId",
          select: "id username image name",
        },
      })
      .populate({
        path: "likes",
        select: "userId",
      })
      .lean();

    type SanitizedPost = {
      _id: string;
      authorId: {
        _id: string;
        name: string;
        username: string;
        image: string;
      };
      content?: string;
      image?: string;
      comments: any[];
      likes: any[];
      notifications?: any[];
      createdAt: Date;
      updatedAt: Date;
    };

    const finalPosts = (sanitizeMongoDoc(posts) as SanitizedPost[]).map(
      (post) => ({
        ...post,
        createdAt: post.createdAt.toString(),
        updatedAt: post.updatedAt.toString(),
        _count: {
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
        },
      })
    );

    return finalPosts;
  } catch (error) {
    console.error("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string) {
  try {
    await connectToDB();

    const userId = await getDBUserId();

    if (!userId) return;

    const existingLike = await like.findOne({
      userId: new ObjectId(userId),
      postId: new ObjectId(postId),
    });

    const currentPost = await post.findById(postId).select("authorId");

    if (!post) return;

    const session = await post.startSession();
    session.startTransaction();

    if (existingLike) {
      await like.deleteOne(
        {
          userId: new ObjectId(userId),
          postId: new ObjectId(postId),
        },
        session
      );
    } else {
      await like.create(
        [
          {
            userId: new ObjectId(userId),
            postId: new ObjectId(postId),
          },
        ],
        { session }
      );

      if (currentPost.authorId.toString() !== userId) {
        await notification.create([
          {
            type: "LIKE",
            userId: new ObjectId(currentPost.authorId),
            creatorId: new ObjectId(userId),
            postId: new ObjectId(postId),
            read: false,
            createdAt: new Date(),
          },
        ]);
      }

      return { success: true };
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function createComment(postId: string, content: string) {
  await connectToDB();

  try {
    const userId = await getDBUserId();

    if (!userId) return;

    if (!content) throw new Error("Comment cannot be empty");

    const session = await mongoose.startSession();
    session.startTransaction();

    const currentPost = await post
      .findById(postId)
      .select("authorId")
      .session(session);

    if (!currentPost) throw new Error("No post found");

    const newComment = new comment({
      content,
      authorId: new mongoose.Types.ObjectId(userId),
      postId: new mongoose.Types.ObjectId(postId),
    });

    await newComment.save({ session });

    if (currentPost.authorId.toString() !== userId) {
      const newNotification = new notification({
        type: "COMMENT",
        userId: new mongoose.Types.ObjectId(currentPost.authorId),
        creatorId: new mongoose.Types.ObjectId(userId),
        postId: new mongoose.Types.ObjectId(postId),
        commentId: new mongoose.Types.ObjectId(newComment.id),
      });

      await newNotification.save({ session });
    }

    await session.commitTransaction;
    session.endSession();

    revalidatePath("/");

    return { success: true, newComment };
  } catch (error) {
    console.error("Failed to create comment:", error);
    return { success: false, error: "Failed to create comment" };
  }
}

export async function deletePost(postId: string) {
  await connectToDB();

  try {
    const userId = await getDBUserId();

    const currentPost = await post.findById(postId).select("authorId");

    if (!currentPost) throw new Error("Post not found");

    if (currentPost.authorId !== userId) throw new Error("Unauthorized ");

    await post.deleteOne({ _id: postId });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
