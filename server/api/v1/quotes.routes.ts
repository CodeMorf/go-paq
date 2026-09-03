import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { calculatePricing } from '../../modules/pricing/pricing.engine';
import { KarrioAdapter } from '../../integrations/karrio/karrio.adapter';
import { asyncHandler } from '../../core/http';
import { getPublicOrganizationId } from '../../core/publicTenant';

export const quotesRouter = Router();

const quoteSchema = z.object({
    serviceType: z.enum(['local', 'express', 'nacional', 'internacional', 'mudanza', 'carga_pesada']).default('local'),
    originCity: z.string().trim().min(2).max(120).default('Santo Domingo'),
    destCity: z.string().trim().min(2).max(120).default('Santo Domingo'),
    originCountry: z.string().trim().length(2).default('DO'),
    destinationCountry: z.string().trim().length(2).default('DO'),
    originPostalCode: z.string().trim().max(30).optional(),
    destinationPostalCode: z.string().trim().max(30).optional(),
    originAddress: z.string().trim().max(250).optional(),
    destinationAddress: z.string().trim().max(250).optional(),
    senderName: z.string().trim().max(160).optional(),
    recipientName: z.string().trim().max(160).optional(),
    senderPhone: z.string().trim().max(40).optional(),
    recipientPhone: z.string().trim().max(40).optional(),
    weightKg: z.coerce.number().positive().max(100000).default(1),
    lengthCm: z.coerce.number().positive().max(10000).default(20),
    widthCm: z.coerce.number().positive().max(10000).default(15),
    heightCm: z.coerce.number().positive().max(10000).default(10),
    declaredValueUsd: z.coerce.number().min(0).max(100000000).default(0),
    isFragile: z.boolean().default(false),
    codAmount: z.coerce.number().min(0).max(100000000).default(0),
    dangerousZoneId: z.string().trim().max(120).optional(),
    distanceKm: z.coerce.number().min(0).max(100000).optional(),
    clientId: z.string().trim().max(120).optional(),
    branchId: z.string().trim().max(120).optional(),
    serviceVariant: z.string().trim().max(40).optional()
  });

quotesRouter.post('/', asyncHandler(async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de cotización inválidos.' });
  const {
    serviceType = 'local',
    originCity = 'Santo Domingo',
    destCity = 'Santo Domingo',
    originCountry = 'DO',
    destinationCountry = 'DO',
    originPostalCode,
    destinationPostalCode,
    originAddress,
    destinationAddress,
    senderName,
    recipientName,
    senderPhone,
    recipientPhone,
    weightKg = 1,
    lengthCm = 20,
    widthCm = 15,
    heightCm = 10,
    declaredValueUsd = 0,
    isFragile = false,
    codAmount = 0,
    dangerousZoneId,
    distanceKm,
    clientId,
    branchId,
    serviceVariant
  } = parsed.data;

  const quote = await calculatePricing({
    serviceType,
    originCity,
    destCity,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValueUsd,
    isFragile,
    codAmount,
    dangerousZoneId,
    distanceKm,
    clientId,
    branchId,
    serviceVariant
  }, getPublicOrganizationId());

  const needsCarrierRates = serviceType === 'internacional' || String(originCountry).toUpperCase() !== String(destinationCountry).toUpperCase();
  if (!needsCarrierRates) return res.json({ success: true, quote, carrierRates: null });

  const carrierResult = await KarrioAdapter.fetchLiveCarrierRates({
    shipper: {
      country_code: String(originCountry).toUpperCase(),
      postal_code: originPostalCode,
      city: originCity,
      address_line1: originAddress,
      person_name: senderName,
      phone_number: senderPhone
    },
    recipient: {
      country_code: String(destinationCountry).toUpperCase(),
      postal_code: destinationPostalCode,
      city: destCity,
      address_line1: destinationAddress,
      person_name: recipientName,
      phone_number: recipientPhone
    },
    parcels: [{
      weight: weightKg,
      weight_unit: 'KG',
      length: lengthCm,
      width: widthCm,
      height: heightCm,
      dimension_unit: 'CM'
    }],
    reference: `gopaq-quote-${crypto.randomUUID()}`
  });

  if (!carrierResult.success) {
    return res.json({
      success: true,
      quote,
      carrierRates: {
        provider: 'karrio',
        available: false,
        error: carrierResult.error || 'provider_unavailable'
      }
    });
  }

  return res.json({
    success: true,
    quote,
    carrierRates: {
      provider: 'karrio',
      available: true,
      shipmentId: carrierResult.shipmentId,
      rates: carrierResult.rates || []
    }
  });
}));
