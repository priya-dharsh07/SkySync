import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db/unifiedStore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          message: "Email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    let passwordMatch = false;
    if (user.password) {
      try {
        passwordMatch = await bcrypt.compare(password, user.password);
      } catch {
        passwordMatch = password === user.password;
      }
    }

    if (!passwordMatch) {
      return NextResponse.json(
        {
          message: "Invalid email or password.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Store the user's unique id inside a secure HTTP-only cookie.
     */
    const response = NextResponse.json(
      {
        message: "Login successful.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      {
        status: 200,
      }
    );

    response.cookies.set("skysync_session", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while logging in.",
      },
      {
        status: 500,
      }
    );
  }
}