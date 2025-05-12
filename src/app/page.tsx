import CreatePost from "@/components/CreatePost";
import { currentUser } from "@clerk/nextjs/server";
import RecommendedUsers from "@/components/RecommendedUsers";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/actions/post.action";
import { getDBUserId, getUserByClerkId } from "@/actions/user.action";

export default async function Home() {
  const user = await currentUser();

  const posts = (await getPosts()) ?? [];

  // ✅ Get DB user ID using Clerk user ID directly
  let stringDbUserId = "";
  if (user?.id) {
    const dbUser = await getUserByClerkId(user.id); // pass Clerk user ID
    if (dbUser) {
      stringDbUserId = dbUser._id.toString();
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {user ? <CreatePost /> : null}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} dbUserId={stringDbUserId} />
          ))}
        </div>
      </div>
      <div className="hidden lg:col-span-4 lg:block sticky top-20">
        <RecommendedUsers />
      </div>
    </div>
  );
}
