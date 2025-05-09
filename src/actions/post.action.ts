"use server";

import { connectToDB } from "@/lib/mongodb";
import { getDBUserId } from "./user.action";
import post from "@/models/post";
import { revalidatePath } from "next/cache";

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

    console.log("This is the post ", postToUpload);

    return { success: true, postToUpload };
  } catch (error) {
    console.log("Failed to create the post ", error);
    return { success: false, error: "Failed to create the post" };
  }
}
