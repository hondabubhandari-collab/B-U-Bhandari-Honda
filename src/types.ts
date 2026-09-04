export type ExperienceType = 'New Vehicle Purchase' | 'Vehicle Service' | 'Vehicle Delivery';

export type RatingType = '5 Stars (Excellent)' | '4 Stars (Very Good)' | '3 Stars (Good)' | '2 Stars (Average)' | '1 Star (Needs Improvement)';

export interface ReviewFormData {
  experienceType: ExperienceType | null;
  rating: RatingType | null;
  employeeName?: string;
  teamName?: string;
  selectedAspects: string[];
  additionalComments?: string;
}

// Columns for Review Activity in Google Sheet:
// A — Date
// B — Time
// C — Experience Type
// D — Rating
// E — Sales Employee Name
// F — Team Name
// G — AI Improvement
// H — AI Status
// I — Review Generated
export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD in IST
  time: string; // HH:MM:SS in IST
  timestamp: number;
  showroom: string; // "B.U. Bhandari Honda – Camp Showroom"
  experienceType: ExperienceType;
  rating: RatingType;
  employeeName: string;
  teamName: string;
  aiImprovement: string;
  aiStatus: string;
  reviewGenerated: string;
  selectedAspects?: string[];
  additionalComments?: string;
  googleReviewOpened?: 'Yes' | 'No';
  sheetSyncStatus?: 'synced' | 'failed' | 'pending';
  sheetSyncMessage?: string;
}

export interface FourHourReportStats {
  reportDate: string;
  reportTime: string;
  totalReviewsGenerated: number;
  totalSubmissions: number;
  averageRating: number;
  // Rating breakdown
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  // Experience type breakdown
  newVehiclePurchaseCount: number;
  vehicleServiceCount: number;
  vehicleDeliveryCount: number;
  // Staff breakdown
  employeeWiseCount: Record<string, number>;
  teamWiseCount: Record<string, number>;
  aiStatusIssues: number;
  failedSheetEntries: number;
  googleReviewOpenedCount: number;
  googleSheetConnected: boolean;
}

export interface DailyReportStats {
  date: string;
  scheduledTime: string;
  totalReviews: number;
  totalSubmissions: number;
  averageRating: number;
  // 5-star to 1-star count
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  // Experience type breakdown
  newVehiclePurchaseCount: number;
  vehicleServiceCount: number;
  vehicleDeliveryCount: number;
  // Performance
  employeePerformance: {
    employeeName: string;
    totalReviews: number;
    avgRating: number;
    fiveStars: number;
  }[];
  teamPerformance: {
    teamName: string;
    totalReviews: number;
    avgRating: number;
  }[];
  seoQualitySummary: string;
  aiStatusSummary: string;
  googleSheetSyncStatus: string;
  googleReviewOpenedCount: number;
}

export interface EmployeeSummary {
  employeeName: string;
  totalReviews: number;
  averageRating: number;
  fiveStarReviews: number;
  fourStarReviews: number;
  threeStarReviews: number;
  twoStarReviews: number;
  oneStarReviews: number;
  latestReviewDate: string;
}

export interface TeamSummary {
  teamName: string;
  totalReviews: number;
  averageRating: number;
  newVehiclePurchase: number;
  vehicleService: number;
  vehicleDelivery: number;
}
