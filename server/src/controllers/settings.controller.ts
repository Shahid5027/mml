import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

// 1. Get active office settings (Available to logged-in user to compute distance)
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.officeSettings.findFirst();

    // Fallback seed configuration if database is empty
    if (!settings) {
      settings = await prisma.officeSettings.create({
        data: {
          latitude: 12.894300,
          longitude: 77.575300,
          radiusMeters: 100.0,
          lateThresholdMinutes: 15
        }
      });
    }

    return res.status(200).json(settings);
  } catch (error: any) {
    console.error('GetSettings Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred while retrieving settings.',
      error: error.message
    });
  }
};

// 2. Save/Update office Settings (Admin Only)
export const updateSettings = async (req: Request, res: Response) => {
  const { latitude, longitude, radiusMeters, lateThresholdMinutes } = req.body;

  try {
    // 1. Retrieve the existing settings record
    let settings = await prisma.officeSettings.findFirst();

    if (!settings) {
      // Create new settings if none exists
      settings = await prisma.officeSettings.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseFloat(radiusMeters),
          lateThresholdMinutes: parseInt(lateThresholdMinutes)
        }
      });
    } else {
      // Update existing settings record
      settings = await prisma.officeSettings.update({
        where: { id: settings.id },
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radiusMeters: parseFloat(radiusMeters),
          lateThresholdMinutes: parseInt(lateThresholdMinutes)
        }
      });
    }

    return res.status(200).json({
      message: 'Office settings successfully updated!',
      settings
    });

  } catch (error: any) {
    console.error('UpdateSettings Endpoint Error:', error);
    return res.status(500).json({
      message: 'An internal error occurred while saving settings.',
      error: error.message
    });
  }
};
