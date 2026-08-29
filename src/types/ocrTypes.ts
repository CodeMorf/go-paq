export interface OcrExtractedData {
  trackingNumber: string;
  recipientName?: string;
  recipientDni?: string;
  recipientPhone?: string;
  address?: string;
  codAmount?: number;
  weightKg?: number;
  barcodeValue?: string;
  confidence: number;
  rawText: string;
  capturedPhotoUrl: string;
  timestamp: string;
  matchStatus: 'matched' | 'mismatched' | 'partial' | 'not_found';
  matchedStopId?: string;
}

export interface SamplePackageLabelPreset {
  id: string;
  title: string;
  badge: string;
  trackingNumber: string;
  recipientName: string;
  recipientDni: string;
  address: string;
  codAmount?: number;
  weightKg: number;
  serviceType: string;
  barcode: string;
  imageUrl?: string;
}
