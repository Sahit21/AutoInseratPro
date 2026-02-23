export enum Platform {
  MOBILE_DE = 'MOBILE_DE',
  AUTOSCOUT24 = 'AUTOSCOUT24',
}

export enum BackgroundStyle {
  ORIGINAL = 'ORIGINAL',
  NEUTRAL = 'NEUTRAL',
  SHOWROOM = 'SHOWROOM',
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey?: () => Promise<boolean>;
      openSelectKey?: () => Promise<void>;
    };
  }
}

export interface UserAccess {
  user_id: string;
  plan: 'starter' | 'pro' | 'business' | null;
  status: 'active' | 'trialing' | 'canceled' | 'past_due' | null;
}

export interface ManualData {
  platform: Platform;
  mileage: string;
  price: string;
  gearbox: string;
  color: string;
  highlights: string;
  notes: string;
  disclaimer: string;
  accidentFree: string;
}

export interface AnalysisResult {
  extracted_data: {
    vin: string | null;
    hsn: string | null;
    tsn: string | null;
    first_registration: string | null;
    displacement_ccm: number | null;
    power_kw: number | null;
    power_ps: number | null;
    fuel_type: string | null;
    make: string | null;
    model: string | null;
  };
  ad_text: {
    headline: string;
    body: string;
  };
  platform_payload: Record<string, any>;
  missing_fields: string[];
  low_confidence_fields: string[];
  redacted_personal_data: string[];
}
