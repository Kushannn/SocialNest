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

    revalidatePath("/");

    const newPostToSend = {
      content: postToUpload.content,
      imageUrl: postToUpload.imageUrl,
      authorId: postToUpload.authorId.toString(),
    };

    return { success: true, newPostToSend };
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
        select: "authorId content createdAt", // Explicitly select createdAt
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

    // console.log("The posts recieved from the backend", posts);

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
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        _count: {
          likes: post.likes?.length || 0,
          comments: post.comments?.length || 0,
        },
      })
    );

    // console.log("The finalPosts are ", finalPosts);

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

    if (!currentPost) return;

    const session = await post.startSession();
    session.startTransaction();

    if (existingLike) {
      await like.deleteOne(
        {
          userId: new ObjectId(userId),
          postId: new ObjectId(postId),
        },
        { session }
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
        await notification.create(
          [
            {
              type: "LIKE",
              userId: new ObjectId(currentPost.authorId),
              creatorId: new ObjectId(userId),
              postId: new ObjectId(postId),
              read: false,
              createdAt: new Date(),
            },
          ],
          { session }
        );
      }
    }

    await session.commitTransaction();

    revalidatePath("/");

    return { success: true };
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
      .select("authorId comments") // Ensure comments field is selected for updating
      .session(session);

    if (!currentPost) throw new Error("No post found");

    // Create the new comment
    const newComment = new comment({
      content,
      authorId: new mongoose.Types.ObjectId(userId),
      postId: new mongoose.Types.ObjectId(postId),
      // createdAt: new Date(),
    });

    // Save the new comment
    await newComment.save({ session });

    // Add the new comment ID to the post's comments array
    currentPost.comments.push(newComment._id); // Add the comment's ID to the post's comments array
    await currentPost.save({ session }); // Save the post with the updated comments array

    // If the comment is not from the post author, create a notification
    if (currentPost.authorId.toString() !== userId.toString()) {
      const newNotification = new notification({
        type: "COMMENT",
        userId: new mongoose.Types.ObjectId(currentPost.authorId),
        creatorId: new mongoose.Types.ObjectId(userId),
        postId: new mongoose.Types.ObjectId(postId),
        commentId: new mongoose.Types.ObjectId(newComment.id),
      });

      await newNotification.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const safeComment = {
      _id: newComment._id.toString(),
      content: newComment.content,
      authorId: newComment.authorId.toString(),
      postId: newComment.postId.toString(),
      // createdAt: newComment.createdAt,
    };

    // Revalidate the page or path to reflect the updated post
    revalidatePath("/");

    return { success: true, safeComment };
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

    if (currentPost.authorId.toString() !== userId.toString())
      throw new Error("Unauthorized ");

    await post.deleteOne({ _id: postId });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete post:", error);
    return { success: false, error: "Failed to delete post" };
  }
}
