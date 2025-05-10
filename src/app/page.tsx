import CreatePost from "@/components/CreatePost";
import { currentUser } from "@clerk/nextjs/server";
import RecommendedUsers from "@/components/RecommendedUsers";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/actions/post.action";
import { getDBUserId } from "@/actions/user.action";

export default async function Home() {
  const user = await currentUser();

  const posts = (await getPosts()) ?? [];

  const dbUserId = await getDBUserId();

  const stringDbUserId = dbUserId.toString();

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
