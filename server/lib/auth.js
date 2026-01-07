import jwt from "jsonwebtoken";
import { headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export async function getAuthHeader() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.split(" ")[1];
    }
    return null;
  } catch (error) {
    return null;
  }
}
