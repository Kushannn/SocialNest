"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";
import toast from "react-hot-toast";
import { toggleFollow } from "@/actions/user.action";

function FollowButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);

    try {
      await toggleFollow(userId);
      toast.success("User followed succesfully");
    } catch (error) {
      toast.error("Error following the user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={loading}
      className="w-20"
    >
      {loading ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Follow"}
    </Button>
  );
}

export default FollowButton;
