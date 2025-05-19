import { PrismaClient, WorkMode } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth'; // Assuming lib/auth.ts exists

const prisma = new PrismaClient();

interface RouteParams {
  params: {
    id: string;
  };
}

// GET handler for fetching a single job by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;
  const { id: jobId } = params;

  try {
    const job = await prisma.job.findUnique({
      where: {
        id: jobId,
        userId: userId, // Ensure the job belongs to the authenticated user
      },
      include: {
        status: true, // Include related JobState
      },
    });

    if (!job) {
      return NextResponse.json({ message: 'Job not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(job, { status: 200 });
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating a job by ID
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;
  const { id: jobId } = params;

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

    // Validate workMode if provided
    if (workMode && !Object.values(WorkMode).includes(workMode as WorkMode)) {
        return NextResponse.json({ message: 'Invalid workMode value' }, { status: 400 });
    }

    // Validate priority if provided
    if (priority !== undefined && (typeof priority !== 'number' || priority < 0 || priority > 5) ) {
        return NextResponse.json({ message: 'Priority must be a number between 0 and 5' }, { status: 400 });
    }
    
    // First, check if the job exists and belongs to the user
    const existingJob = await prisma.job.findUnique({
      where: {
        id: jobId,
        userId: userId,
      },
    });

    if (!existingJob) {
      return NextResponse.json({ message: 'Job not found or access denied' }, { status: 404 });
    }

    const updatedJob = await prisma.job.update({
      where: {
        id: jobId,
        // No need to check userId here again as we've confirmed ownership
      },
      data: {
        company,
        position,
        statusId,
        location,
        url,
        date: date ? new Date(date) : undefined, // Only update if provided
        applyDate: applyDate ? new Date(applyDate) : undefined, // Only update if provided
        salaryMin,
        salaryMax,
        salaryCurrency,
        workMode: workMode as WorkMode,
        priority,
        tags,
        description,
        notes,
        updatedAt: new Date(), // Manually update updatedAt
      },
      include: {
        status: true,
      },
    });

    return NextResponse.json(updatedJob, { status: 200 });
  } catch (error) {
    console.error(`Error updating job ${jobId}:`, error);
     // Check for specific Prisma errors, e.g., foreign key constraint for statusId
    if ((error as any).code === 'P2003' && (error as any).meta?.field_name?.includes('statusId')) {
        return NextResponse.json({ message: 'Invalid statusId: JobState not found.' }, { status: 400 });
    }
    if ((error as any).code === 'P2025') { // Record to update not found (should be caught by pre-check, but good to have)
        return NextResponse.json({ message: 'Job not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for deleting a job by ID
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized
  }
  const { userId } = authResult;
  const { id: jobId } = params;

  try {
    // First, check if the job exists and belongs to the user
    const jobToDelete = await prisma.job.findUnique({
      where: {
        id: jobId,
        userId: userId,
      },
    });

    if (!jobToDelete) {
      return NextResponse.json({ message: 'Job not found or access denied' }, { status: 404 });
    }

    await prisma.job.delete({
      where: {
        id: jobId,
      },
    });

    return NextResponse.json({ message: 'Job deleted successfully' }, { status: 200 });
    // Or use 204 No Content:
    // return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error);
    if ((error as any).code === 'P2025') { // Record to delete not found (should be caught by pre-check)
        return NextResponse.json({ message: 'Job not found or access denied' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
