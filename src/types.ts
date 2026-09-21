export type ExperienceType = 'New Vehicle Purchase' | 'Vehicle Service' | 'Vehicle Delivery';

export type RatingType = '5 Stars (Excellent)' | '4 Stars (Very Good)' | '3 Stars (Good)' | '2 Stars (Average)' | '1 Star (Needs Improvement)';

export type ReviewLanguage = 'Auto' | 'English' | 'Marathi' | 'Hinglish' | 'Simple English';

export interface ReviewFormData {
  experienceType: ExperienceType | null;
  rating: RatingType | null;
  employeeName?: string;
  teamName?: string;
  selectedAspects: string[];
  additionalComments?: string;
  language?: ReviewLanguage;
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

