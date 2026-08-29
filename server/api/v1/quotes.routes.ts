import { Router } from 'express';
import { calculatePricing } from '../../modules/pricing/pricing.engine';

export const quotesRouter = Router();

quotesRouter.post('/', (req, res) => {
  const {
    serviceType = 'local',
    originCity = 'Santo Domingo',
    destCity = 'Santo Domingo',
    weightKg = 1,
    lengthCm = 20,
    widthCm = 15,
    heightCm = 10,
    declaredValueUsd = 0,
    isFragile = false,
    codAmount = 0,
    dangerousZoneId
  } = req.body;

  const quote = calculatePricing({
    serviceType,
    originCity,
    destCity,
    weightKg: Number(weightKg) || 1,
    lengthCm: Number(lengthCm) || 20,
    widthCm: Number(widthCm) || 15,
    heightCm: Number(heightCm) || 10,
    declaredValueUsd: Number(declaredValueUsd) || 0,
    isFragile: Boolean(isFragile),
    codAmount: Number(codAmount) || 0,
    dangerousZoneId
  });

  return res.json({ success: true, quote });
});
