import { type NextRequest, NextResponse } from "next/server"
import connectDB from "@/server/lib/db"
import Notification from "@/server/models/Notification"
import { verifyToken, getAuthHeader } from "@/server/lib/auth"

// GET user notifications
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const filter: any = { recipient: userId }
    if (unreadOnly) {
      filter.isRead = false
    }

    const notifications = await Notification.find(filter)
      .populate("sender", "username displayName avatar")
      .sort({ createdAt: -1 })
      .limit(50)

    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false })

    return NextResponse.json({
      notifications,
      unreadCount,
    })
  } catch (error) {
    console.error("Notification fetch error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// PUT mark notification(s) as read
export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { notificationIds, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true, readAt: new Date() })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: userId },
        { isRead: true, readAt: new Date() }
      )
    } else {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 })
    }

    return NextResponse.json({ message: "Notifications marked as read" })
  } catch (error) {
    console.error("Notification update error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

// DELETE notification(s)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const token = await getAuthHeader()
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = await verifyToken(token)
    if (!userId) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get("id")

    if (notificationId) {
      await Notification.findOneAndDelete({ _id: notificationId, recipient: userId })
    } else {
      // Delete all read notifications
      await Notification.deleteMany({ recipient: userId, isRead: true })
    }

    return NextResponse.json({ message: "Notification(s) deleted" })
  } catch (error) {
    console.error("Notification deletion error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
