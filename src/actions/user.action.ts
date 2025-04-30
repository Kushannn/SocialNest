"use server";

import { connectToDB } from "@/lib/mongodb";
import Follow from "@/models/follows";
import Post from "@/models/post";
import User from "@/models/user";
import { auth, currentUser } from "@clerk/nextjs/server";

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

    const user = await User.findOne({ clerkId });

    if (!user) return null;

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

  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);

  if (!user) throw new Error("User not found ");

  return user._id;
}
