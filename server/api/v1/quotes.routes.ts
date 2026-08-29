import { Router } from 'express';
import { calculatePricing } from '../../modules/pricing/pricing.engine';
import { KarrioAdapter } from '../../integrations/karrio/karrio.adapter';

export const quotesRouter = Router();

quotesRouter.post('/', async (req, res) => {
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
      weight: Number(weightKg) || 1,
      weight_unit: 'KG',
      length: Number(lengthCm) || 20,
      width: Number(widthCm) || 15,
      height: Number(heightCm) || 10,
      dimension_unit: 'CM'
    }],
    reference: `gopaq-quote-${Date.now()}`
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
});
