import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, saveUser } from "@/lib/db/unifiedStore";
import { AIRPORTS, getAirportByCode } from "@/lib/convergence/airports";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password, homeAirport } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          message: "Name, email and password are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!homeAirport || typeof homeAirport !== "string") {
      return NextResponse.json(
        {
          message: "A primary departure location (airport or city) is required.",
        },
        {
          status: 400,
        }
      );
    }

    const matchedAirport =
      getAirportByCode(homeAirport) ||
      AIRPORTS.find(
        (a) =>
          a.code.toUpperCase() === homeAirport.trim().toUpperCase() ||
          a.city.toLowerCase() === homeAirport.trim().toLowerCase()
      );

    if (!matchedAirport) {
      return NextResponse.json(
        {
          message: `Unknown departure airport code: ${homeAirport}`,
        },
        {
          status: 400,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          message: "Password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return NextResponse.json(
        {
          message: "An account with this email already exists.",
        },
        {
          status: 409,
        }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await saveUser({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      homeAirport: matchedAirport.code,
      homeCity: matchedAirport.city,
      country: matchedAirport.country,
      lat: matchedAirport.lat,
      lng: matchedAirport.lng,
    });

    return NextResponse.json(
      {
        message: "Account created successfully.",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          homeAirport: user.homeAirport,
          homeCity: user.homeCity,
          country: user.country,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        message: "Something went wrong while creating your account.",
      },
      {
        status: 500,
      }
    );
  }
}