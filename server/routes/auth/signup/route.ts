import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/models/User"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { username, email, password } = await request.json()

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 })
    }

    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password,
    })

    await user.save()

    const token = generateToken(user._id.toString())

    return NextResponse.json(
      {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
