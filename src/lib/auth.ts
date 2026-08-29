import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();

    const sessionId =
      cookieStore.get("skysync_session")?.value;

    if (!sessionId) {
      return null;
    }

    await connectDB();

    const user = await User.findById(sessionId).select(
      "-password"
    );

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    console.error(
      "getCurrentUser error:",
      error
    );

    return null;
  }
}