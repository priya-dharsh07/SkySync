import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    let users: Array<{ id: string; name: string; email: string }> = [];

    try {
      const conn = await connectDB();
      if (conn) {
        const filter: Record<string, unknown> = {};
        if (query) {
          filter.$or = [
            { name: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ];
        }

        const found = await User.find(filter)
          .select("_id name email createdAt")
          .limit(25)
          .lean();

        users = found.map((u: any) => ({
          id: u._id.toString(),
          name: u.name,
          email: u.email,
        }));
      }
    } catch (err) {
      console.warn("MongoDB users query warning:", err);
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { success: false, users: [] },
      { status: 500 }
    );
  }
}
