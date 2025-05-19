import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;
  const { id: resumeId } = params;

  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json({ message: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden: You do not own this resume' }, { status: 403 });
    }

    // Delete the file from the file system
    const absoluteFilePath = path.join(process.cwd(), resume.storagePath);
    try {
      await fs.unlink(absoluteFilePath);
    } catch (fileError: any) {
      // Log the error, but proceed to delete the DB record if the file is already gone (ENOENT)
      // For other errors (e.g., permissions), we might want to stop and return an error.
      if (fileError.code !== 'ENOENT') {
        console.error('Error deleting resume file:', fileError);
        return NextResponse.json({ message: 'Error deleting resume file from storage' }, { status: 500 });
      }
      console.warn(`Resume file not found, but proceeding to delete DB record: ${absoluteFilePath}`);
    }

    // Delete the resume record from the database
    await prisma.resume.delete({
      where: { id: resumeId },
    });

    return new NextResponse(null, { status: 204 }); // Or NextResponse.json({ message: 'Resume deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting resume ${resumeId}:`, error);
    // Check for specific Prisma errors if needed, e.g., P2025 (Record to delete does not exist)
    if ((error as any).code === 'P2025') {
        return NextResponse.json({ message: 'Resume not found in database' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error during resume deletion' }, { status: 500 });
  }
}
