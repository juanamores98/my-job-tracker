import { PrismaClient, WorkMode } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth'; // Assuming lib/auth.ts exists

const prisma = new PrismaClient();

// POST handler for creating a new job
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;

  try {
    const {
      company,
      position,
      statusId,
      location,
      url,
      date,
      applyDate,
      salaryMin,
      salaryMax,
      salaryCurrency,
      workMode,
      priority,
      tags,
      description,
      notes,
    } = await request.json();

    // Basic validation
    if (!company || !position || !statusId) {
      return NextResponse.json({ message: 'Company, position, and statusId are required' }, { status: 400 });
    }

    // Validate workMode if provided
    if (workMode && !Object.values(WorkMode).includes(workMode as WorkMode)) {
        return NextResponse.json({ message: 'Invalid workMode value' }, { status: 400 });
    }
    
    // Validate priority if provided
    if (priority !== undefined && (typeof priority !== 'number' || priority < 0 || priority > 5) ) {
        return NextResponse.json({ message: 'Priority must be a number between 0 and 5' }, { status: 400 });
    }


    const newJob = await prisma.job.create({
      data: {
        userId,
        company,
        position,
        statusId,
        location,
        url,
        date: date ? new Date(date) : null,
        applyDate: applyDate ? new Date(applyDate) : null,
        salaryMin,
        salaryMax,
        salaryCurrency,
        workMode: workMode as WorkMode, // Prisma will validate enum
        priority,
        tags: tags || [], // Default to empty array if not provided
        description,
        notes,
      },
      include: {
        status: true, // Include the related JobState
      },
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    // Check for specific Prisma errors if needed, e.g., foreign key constraint
    if ((error as any).code === 'P2003') { // Foreign key constraint failed (e.g. statusId not found)
        return NextResponse.json({ message: 'Invalid statusId: JobState not found.' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// GET handler for fetching all jobs for the authenticated user
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;

  try {
    const jobs = await prisma.job.findMany({
      where: { userId },
      include: {
        status: true, // Include related JobState
      },
      orderBy: {
        updatedAt: 'desc', // Default sort order
      },
    });

    return NextResponse.json(jobs, { status: 200 });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
