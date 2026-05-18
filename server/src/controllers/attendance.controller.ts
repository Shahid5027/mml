import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// Helper: Haversine geodesic distance calculation (in meters)
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// Helper: Check if user is LATE based on current time, shift start time, and buffer threshold
function checkIsLate(shiftStartTime: string, lateThresholdMinutes: number): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [shiftHour, shiftMinute] = shiftStartTime.split(':').map(Number);
  const checkInMinutes = currentHour * 60 + currentMinute;
  const shiftStartMinutes = shiftHour * 60 + shiftMinute;

  return checkInMinutes > shiftStartMinutes + lateThresholdMinutes;
}

// 1. Employee Check-In (POST /api/attendance/check-in)
export const checkIn = async (req: any, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;

  try {
    // 1. Validate coordinates bounds
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        message: 'Invalid coordinate parameters. Latitude must be -90..90, Longitude must be -180..180.'
      });
    }

    // 2. Fetch User Shift details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // 3. Fetch Office Benchmark Settings
    let office = await prisma.officeSettings.findFirst();
    if (!office) {
      // Seeding fallback
      office = await prisma.officeSettings.create({
        data: { latitude: 12.8943, longitude: 77.5753, radiusMeters: 100.0, lateThresholdMinutes: 15 }
      });
    }

    // 4. Calculate Distance Proximity (Haversine)
    const distance = calculateHaversineDistance(latNum, lngNum, office.latitude, office.longitude);

    // 5. Prevent Duplicate Check-In for the same calendar date (local user date)
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayDate = new Date(todayStr); // Maps perfectly to @db.Date DateTime
    
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: todayDate
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: 'Transaction rejected. You have already checked in for today.'
      });
    }

    // 6. Geofence Perimeter Validation
    if (distance > office.radiusMeters) {
      // Write Rejected Audit Log trace
      await prisma.attendanceLog.create({
        data: {
          userId,
          eventType: 'CHECK_IN',
          lat: latNum,
          lng: lngNum,
          distanceFromOffice: parseFloat(distance.toFixed(2)),
          accepted: false,
          reason: `Out of geofence. Distance: ${distance.toFixed(1)}m. Geofence radius limit: ${office.radiusMeters}m.`
        }
      });

      return res.status(400).json({
        message: `Check-in rejected. You are ${distance.toFixed(1)}m away, exceeding the allowable office radius of ${office.radiusMeters}m.`,
        distance: parseFloat(distance.toFixed(2))
      });
    }

    // 7. Calculate status (PRESENT or LATE)
    const isLate = checkIsLate(user.shiftStartTime, office.lateThresholdMinutes);
    const punchTime = new Date();

    // 8. Atomic Database transaction: Write Attendance & Accepted Audit Log
    const result = await prisma.$transaction(async (tx) => {
      const att = await tx.attendance.create({
        data: {
          userId,
          date: todayDate,
          checkInTime: punchTime,
          checkInLat: latNum,
          checkInLng: lngNum,
          isLate,
          status: isLate ? 'LATE' : 'PRESENT'
        }
      });

      await tx.attendanceLog.create({
        data: {
          userId,
          eventType: 'CHECK_IN',
          lat: latNum,
          lng: lngNum,
          distanceFromOffice: parseFloat(distance.toFixed(2)),
          accepted: true,
          reason: `Successful check-in inside perimeter. Status: ${isLate ? 'LATE' : 'PRESENT'}`
        }
      });

      return att;
    });

    return res.status(201).json({
      message: 'Check-in transaction completed successfully!',
      attendance: result,
      distance: parseFloat(distance.toFixed(2))
    });

  } catch (error: any) {
    console.error('CheckIn Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred during check-in.',
      error: error.message
    });
  }
};

// 2. Employee Check-Out (POST /api/attendance/check-out)
export const checkOut = async (req: any, res: Response) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;

  try {
    // 1. Validate coordinates bounds
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return res.status(400).json({
        message: 'Invalid coordinate parameters. Latitude must be -90..90, Longitude must be -180..180.'
      });
    }

    // 2. Verify check-in existence first
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const todayDate = new Date(todayStr);

    const activeAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: todayDate
      }
    });

    if (!activeAttendance) {
      return res.status(400).json({
        message: 'Transaction rejected. You must check in before performing check-out.'
      });
    }

    if (activeAttendance.checkOutTime) {
      return res.status(400).json({
        message: 'Transaction rejected. You have already checked out for today.'
      });
    }

    // 3. Fetch Office Benchmark Settings
    let office = await prisma.officeSettings.findFirst();
    if (!office) {
      office = await prisma.officeSettings.create({
        data: { latitude: 12.8943, longitude: 77.5753, radiusMeters: 100.0, lateThresholdMinutes: 15 }
      });
    }

    // 4. Calculate Distance Proximity (Haversine)
    const distance = calculateHaversineDistance(latNum, lngNum, office.latitude, office.longitude);

    // 5. Geofence Perimeter Validation
    if (distance > office.radiusMeters) {
      // Write Rejected Audit Log trace
      await prisma.attendanceLog.create({
        data: {
          userId,
          eventType: 'CHECK_OUT',
          lat: latNum,
          lng: lngNum,
          distanceFromOffice: parseFloat(distance.toFixed(2)),
          accepted: false,
          reason: `Check-out geofence violation. Distance: ${distance.toFixed(1)}m.`
        }
      });

      return res.status(400).json({
        message: `Check-out rejected. You are ${distance.toFixed(1)}m away, exceeding the allowable office radius of ${office.radiusMeters}m.`,
        distance: parseFloat(distance.toFixed(2))
      });
    }

    // 6. Calculate server-side working hours in decimal hours format
    const checkOutTime = new Date();
    const checkInTime = new Date(activeAttendance.checkInTime);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    // 7. Atomic Database transaction: Update Attendance & Write Audit Log
    const result = await prisma.$transaction(async (tx) => {
      const att = await tx.attendance.update({
        where: { id: activeAttendance.id },
        data: {
          checkOutTime,
          checkOutLat: latNum,
          checkOutLng: lngNum,
          workingHours
        }
      });

      await tx.attendanceLog.create({
        data: {
          userId,
          eventType: 'CHECK_OUT',
          lat: latNum,
          lng: lngNum,
          distanceFromOffice: parseFloat(distance.toFixed(2)),
          accepted: true,
          reason: `Successful check-out. Shift working hours calculated: ${workingHours} hrs.`
        }
      });

      return att;
    });

    return res.status(200).json({
      message: 'Check-out transaction completed successfully!',
      attendance: result,
      distance: parseFloat(distance.toFixed(2))
    });

  } catch (error: any) {
    console.error('CheckOut Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred during check-out.',
      error: error.message
    });
  }
};

// 3. Get employee today's attendance status (GET /api/attendance/today)
export const getTodayStatus = async (req: any, res: Response) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date(todayStr);

  try {
    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: todayDate
      }
    });

    const office = await prisma.officeSettings.findFirst();

    return res.status(200).json({
      attendance,
      office: office || { latitude: 12.8943, longitude: 77.5753, radiusMeters: 100.0, lateThresholdMinutes: 15 }
    });
  } catch (error: any) {
    console.error('GetTodayStatus Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred while compiling status.',
      error: error.message
    });
  }
};

// 4. Get employee attendance history logs (GET /api/attendance/history)
export const getHistory = async (req: any, res: Response) => {
  const userId = req.user.id;
  const { month } = req.query; // Expects YYYY-MM format

  try {
    if (!month || typeof month !== 'string') {
      return res.status(400).json({
        message: 'Parameter mismatch. Supply a valid YYYY-MM month parameter.'
      });
    }

    const [year, monthStr] = month.split('-').map(Number);
    const startDate = new Date(year, monthStr - 1, 1);
    const endDate = new Date(year, monthStr, 1);

    // Filter by user and monthly DateTime range bounds
    const history = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json(history);
  } catch (error: any) {
    console.error('GetHistory Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred while fetching history ledger.',
      error: error.message
    });
  }
};
