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
  const { id: coverLetterId } = params;

  try {
    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id: coverLetterId },
    });

    if (!coverLetter) {
      return NextResponse.json({ message: 'Cover letter not found' }, { status: 404 });
    }

    if (coverLetter.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden: You do not own this cover letter' }, { status: 403 });
    }

    // Delete the file from the file system
    const absoluteFilePath = path.join(process.cwd(), coverLetter.storagePath);
    try {
      await fs.unlink(absoluteFilePath);
    } catch (fileError: any) {
      // Log the error, but proceed to delete the DB record if the file is already gone (ENOENT)
      if (fileError.code !== 'ENOENT') {
        console.error('Error deleting cover letter file:', fileError);
        return NextResponse.json({ message: 'Error deleting cover letter file from storage' }, { status: 500 });
      }
      console.warn(`Cover letter file not found, but proceeding to delete DB record: ${absoluteFilePath}`);
    }

    // Delete the cover letter record from the database
    await prisma.coverLetter.delete({
      where: { id: coverLetterId },
    });

    return new NextResponse(null, { status: 204 }); // Or NextResponse.json({ message: 'Cover letter deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting cover letter ${coverLetterId}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete does not exist (Prisma specific)
        return NextResponse.json({ message: 'Cover letter not found in database' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error during cover letter deletion' }, { status: 500 });
  }
}
