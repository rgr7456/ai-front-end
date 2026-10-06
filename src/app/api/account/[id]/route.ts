import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Mock user data - replace with real database query
    const mockUser = {
      id: id,
      name: "Administrator",
      email: "admin@example.com",
      role: "System Administrator",
      department: "IT Security",
      lastLogin: new Date().toISOString(),
      createdAt: "2024-01-01T00:00:00.000Z"
    };

    return NextResponse.json(mockUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userData = await request.json();
    
    // Mock update - replace with real database update
    console.log(`Updating user ${id}:`, userData);
    
    const updatedUser = {
      id: id,
      ...userData,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Mock delete - replace with real database deletion
    console.log(`Deleting user ${id}`);
    
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}