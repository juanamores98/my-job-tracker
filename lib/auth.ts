import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Remember to set JWT_SECRET in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export async function verifyAuth(request: NextRequest): Promise<{ userId: string } | NextResponse> {
  const token = cookies().get('token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized: Missing token' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Unauthorized: Invalid token payload' }, { status: 401 });
    }
    return { userId: decoded.userId };
  } catch (error) {
    console.error('Authentication error:', error);
    // Differentiate between expired token and other verification errors
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json({ message: 'Unauthorized: Token expired' }, { status: 401 });
    }
    return NextResponse.json({ message: 'Unauthorized: Invalid token' }, { status: 401 });
  }
}

// Helper to get user ID directly, or null if not authenticated
// This can be used in contexts where an error response is not desired immediately
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return null; // Indicates authentication failure
  }
  return authResult.userId;
}
