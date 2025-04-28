import mongoose from "mongoose";

export function addUserHooks(UserSchema: mongoose.Schema) {
  // Handle cascade delete before deleting a user document
  UserSchema.pre(
    "deleteOne",
    { document: true, query: false },
    async function (next) {
      const userId = this._id;

      await mongoose.model("Post").deleteMany({ authorId: userId });
      await mongoose.model("Comment").deleteMany({ authorId: userId });
      await mongoose.model("Like").deleteMany({ authorId: userId });
      await mongoose.model("Notification").deleteMany({ creatorId: userId });

      // Delete all Follows where user is follower or following
      await mongoose.model("Follow").deleteMany({
        $or: [{ followerId: userId }, { followingId: userId }],
      });

      next();
    }
  );

  // Handle cascade delete before deleting through findOneAndDelete
  UserSchema.pre("findOneAndDelete", async function (next) {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
      await mongoose.model("Post").deleteMany({ authorId: user._id });
      await mongoose.model("Comment").deleteMany({ authorId: user._id });
      await mongoose.model("Like").deleteMany({ authorId: user._id });
      await mongoose.model("Notification").deleteMany({ creatorId: user._id });

      // Delete all Follows where user is follower or following
      await mongoose.model("Follow").deleteMany({
        $or: [{ followerId: user._id }, { followingId: user._id }],
      });
    }
    next();
  });
}
