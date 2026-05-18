import { PrismaClient, Role, PunchType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting high-fidelity database seeding for Live Demo...');

  // Hash standard password for demo accounts
  const passwordHash = await bcrypt.hash('Password123', 12);

  // 1. Seed Default Administrator Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@geoshield.ai' },
    update: { passwordHash },
    create: {
      name: 'Corporate Administrator',
      email: 'admin@geoshield.ai',
      passwordHash,
      role: Role.ADMIN,
      department: 'Operations',
      shiftStartTime: '09:00'
    }
  });
  console.log(`👤 Seeded Admin: ${adminUser.email}`);

  // 2. Seed Default Employees Cohort
  const employeesData = [
    { name: 'Sarah Connor', email: 'employee@geoshield.ai', dept: 'Information Security', shift: '09:00' },
    { name: 'Luke Skywalker', email: 'luke@geoshield.ai', dept: 'Engineering', shift: '09:00' },
    { name: 'Tony Stark', email: 'tony@geoshield.ai', dept: 'Engineering', shift: '08:30' },
    { name: 'Bruce Wayne', email: 'bruce@geoshield.ai', dept: 'Operations', shift: '09:00' },
    { name: 'Natasha Romanoff', email: 'natasha@geoshield.ai', dept: 'HR Tech', shift: '09:00' }
  ];

  const seededEmployees = [];

  for (const emp of employeesData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: { passwordHash, department: emp.dept, shiftStartTime: emp.shift },
      create: {
        name: emp.name,
        email: emp.email,
        passwordHash,
        role: Role.EMPLOYEE,
        department: emp.dept,
        shiftStartTime: emp.shift
      }
    });
    seededEmployees.push(user);
    console.log(`👤 Seeded Staff Employee: ${user.name} (${user.email})`);
  }

  // 3. Seed Default Corporate Office Geofence Settings
  const officeLat = 12.894300;
  const officeLng = 77.575300;
  const officeRadius = 100.0;
  const officeThreshold = 15;

  let officeSettings = await prisma.officeSettings.findFirst();
  if (!officeSettings) {
    officeSettings = await prisma.officeSettings.create({
      data: {
        latitude: officeLat,
        longitude: officeLng,
        radiusMeters: officeRadius,
        lateThresholdMinutes: officeThreshold
      }
    });
  } else {
    // Force benchmark alignment during seeding for presentation
    officeSettings = await prisma.officeSettings.update({
      where: { id: officeSettings.id },
      data: {
        latitude: officeLat,
        longitude: officeLng,
        radiusMeters: officeRadius,
        lateThresholdMinutes: officeThreshold
      }
    });
  }
  console.log(`📍 Configured Office Settings: Lat: ${officeSettings.latitude}, Lng: ${officeSettings.longitude}`);

  // Clean old attendance records to prevent unique constraints issues during re-seeding
  console.log('🧹 Clearing previous attendance logs for fresh presentation timeline...');
  await prisma.attendanceInsight.deleteMany({});
  await prisma.attendanceLog.deleteMany({});
  await prisma.attendance.deleteMany({});

  // 4. Seed Pre-filled attendance logs for the first 15 days of May 2026
  console.log('🗓️ Populating realistic history logs for May 2026 (May 1 to May 15)...');

  for (const emp of seededEmployees) {
    // Parse shift starting time configuration
    const [shiftHrs, shiftMins] = emp.shiftStartTime.split(':').map(Number);

    for (let day = 1; day <= 15; day++) {
      const dateStr = `2026-05-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) continue;

      // Randomize attendance outcome distribution
      const roll = Math.random();
      let status = 'PRESENT';
      let isLate = false;
      let checkInHrs = shiftHrs;
      let checkInMins = Math.floor(Math.random() * 20); // 0 to 19 minutes early

      if (roll > 0.85) {
        // Late (15% chance)
        status = 'LATE';
        isLate = true;
        checkInHrs = shiftHrs;
        checkInMins = officeThreshold + Math.floor(Math.random() * 30); // 16 to 45 mins late
      } else if (roll < 0.05 && emp.email === 'employee@geoshield.ai') {
        // Out-of-bounds anomaly (5% chance only on Sarah's account to demo invalidation triggers)
        status = 'INVALID';
      }

      // Check-In Details
      const checkInTime = new Date(dateObj);
      checkInTime.setHours(checkInHrs, checkInMins, 0, 0);

      // Coordinates within geofence or far breach
      let lat = officeLat + (Math.random() - 0.5) * 0.0008; // ~30-50 meters variance
      let lng = officeLng + (Math.random() - 0.5) * 0.0008;
      let distance = 15 + Math.random() * 40;

      if (status === 'INVALID') {
        lat = officeLat + 0.045; // ~5000 meters breach
        lng = officeLng + 0.035;
        distance = 5400;
      }

      // Check-Out details (work 7.8 to 9.2 hours)
      const workingHours = status === 'INVALID' ? 0.0 : parseFloat((7.8 + Math.random() * 1.4).toFixed(2));
      const checkOutTime = new Date(checkInTime);
      checkOutTime.setMinutes(checkInTime.getMinutes() + Math.round(workingHours * 60));

      const checkOutLat = status === 'INVALID' ? lat : officeLat + (Math.random() - 0.5) * 0.0008;
      const checkOutLng = status === 'INVALID' ? lng : officeLng + (Math.random() - 0.5) * 0.0008;

      // Create primary Attendance Entry
      const attendance = await prisma.attendance.create({
        data: {
          userId: emp.id,
          date: dateObj,
          checkInTime,
          checkInLat: lat,
          checkInLng: lng,
          checkOutTime: status === 'INVALID' ? null : checkOutTime,
          checkOutLat: status === 'INVALID' ? null : checkOutLat,
          checkOutLng: status === 'INVALID' ? null : checkOutLng,
          workingHours: status === 'INVALID' ? null : workingHours,
          isLate,
          status
        }
      });

      // Write corresponding security check logs
      await prisma.attendanceLog.create({
        data: {
          userId: emp.id,
          eventType: PunchType.CHECK_IN,
          timestamp: checkInTime,
          lat,
          lng,
          distanceFromOffice: distance,
          accepted: status !== 'INVALID',
          reason: status === 'INVALID' ? 'Out-of-bounds GPS perimeter breach captured.' : 'Verified inside office area.'
        }
      });

      if (status !== 'INVALID') {
        await prisma.attendanceLog.create({
          data: {
            userId: emp.id,
            eventType: PunchType.CHECK_OUT,
            timestamp: checkOutTime,
            lat: checkOutLat,
            lng: checkOutLng,
            distanceFromOffice: distance - 5,
            accepted: true,
            reason: 'Verified inside office area.'
          }
        });
      }

      // Write analytical trust insights
      const confidence = status === 'INVALID' ? 42 : isLate ? 94 : 98;
      await prisma.attendanceInsight.create({
        data: {
          userId: emp.id,
          date: dateObj,
          confidenceScore: confidence,
          unusualLocation: status === 'INVALID',
          unusualTiming: isLate,
          failedAttemptsCount: status === 'INVALID' ? 1 : 0,
          analysisDetails: status === 'INVALID'
            ? 'Geofence location discrepancy flagged. User attempted punch outside approved workstation circle.'
            : 'Normal telemetry signature registered.'
        }
      });
    }
  }

  console.log('✅ Database seeded with realistic live-presentation timelines successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed with error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
