import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Mock authentication - replace with real authentication logic
    if (email && password) {
      const mockUser = {
        id: "1",
        name: "Administrator",
        email: email,
        role: "System Administrator"
      };
      
      const mockToken = "mock-jwt-token-" + Date.now();
      
      return NextResponse.json({
        success: true,
        user: mockUser,
        token: mockToken
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}