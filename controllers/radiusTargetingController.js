// controllers/radiusTargetingController.js
import { Bodyshop } from '../models/index.js';
import { calculateDistance } from '../utils/calculateDistance.js';
import { Op } from 'sequelize';

export async function getBodyshopsWithinRadius(jobLat, jobLng) {
  const bodyshops = await Bodyshop.findAll({
    where: {
      verified: true,
      adminApproved: true,
      status: 'active',
      latitude: { [Op.ne]: null },
      longitude: { [Op.ne]: null }
    }
  });

  const matched = [];

  for (const shop of bodyshops) {
    const radius = shop.radius || 10;
    const distance = calculateDistance(jobLat, jobLng, shop.latitude, shop.longitude);

    if (distance <= radius) {
      matched.push({ ...shop.dataValues, distance });
    }
  }

  return matched;
}
