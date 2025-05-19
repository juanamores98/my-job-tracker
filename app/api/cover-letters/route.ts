import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const UPLOAD_DIR_BASE = 'uploads/coverletters';

// Ensure the base upload directory exists
async function ensureBaseUploadDir() {
  try {
    await fs.access(path.join(process.cwd(), 'uploads'));
  } catch (error) {
    await fs.mkdir(path.join(process.cwd(), 'uploads'), { recursive: true });
  }
  try {
    await fs.access(path.join(process.cwd(), UPLOAD_DIR_BASE));
  } catch (error) {
    await fs.mkdir(path.join(process.cwd(), UPLOAD_DIR_BASE), { recursive: true });
  }
}
ensureBaseUploadDir();

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'File is required' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ message: 'Title is required' }, { status: 400 });
    }

    const userUploadDir = path.join(process.cwd(), UPLOAD_DIR_BASE, userId);
    await fs.mkdir(userUploadDir, { recursive: true });

    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const storagePath = path.join(UPLOAD_DIR_BASE, userId, uniqueFilename); // Relative path for DB
    const absoluteStoragePath = path.join(process.cwd(), storagePath);

    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(absoluteStoragePath, Buffer.from(fileBuffer));

    const coverLetterMetadata = await prisma.coverLetter.create({
      data: {
        userId,
        title,
        originalName,
        storagePath,
        fileType: file.type,
        fileSize: file.size,
      },
    });

    return NextResponse.json(coverLetterMetadata, { status: 201 });
  } catch (error) {
    console.error('Error uploading cover letter:', error);
    if (error instanceof Error && (error as any).code?.startsWith('ENOSPC')) {
        return NextResponse.json({ message: 'File system error: Disk full or other storage issue.' }, { status: 507 });
    }
    return NextResponse.json({ message: 'Internal server error during cover letter upload' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;

  try {
    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(coverLetters, { status: 200 });
  } catch (error) {
    console.error('Error fetching cover letters:', error);
    return NextResponse.json({ message: 'Internal server error while fetching cover letters' }, { status: 500 });
  }
}
