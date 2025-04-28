import mongoose from "mongoose";

export function addPostHooks(PostSchema: mongoose.Schema) {
  // Handle cascade delete before deleting a post document
  PostSchema.pre(
    "deleteOne",
    { document: true, query: false },
    async function (next) {
      const postId = this._id;

      await mongoose.model("Comment").deleteMany({ postId: postId });
      await mongoose.model("Like").deleteMany({ postId: postId });
      await mongoose.model("Notification").deleteMany({ postId: postId });

      next();
    }
  );

  // Handle cascade delete before deleting through findOneAndDelete
  PostSchema.pre("findOneAndDelete", async function (next) {
    const post = await this.model.findOne(this.getFilter());
    if (post) {
      await mongoose.model("Comment").deleteMany({ postId: post._id });
      await mongoose.model("Like").deleteMany({ postId: post._id });
      await mongoose.model("Notification").deleteMany({ postId: post._id });
    }
    next();
  });
}
