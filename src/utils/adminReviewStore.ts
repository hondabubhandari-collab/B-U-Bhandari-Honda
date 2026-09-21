import { TrackedReview, ReviewSource, ReviewStatus, ReviewAnalyticsStats } from '../types';

const STORAGE_KEY = 'bu_bhandari_admin_reviews_v1';
const AUTH_KEY = 'bu_bhandari_admin_auth_v1';
const CUSTOM_PASS_KEY = 'bu_bhandari_admin_pass_v1';

// Format current date-time nicely
export function formatDateTime(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Initial realistic seed reviews if admin store is brand new
function createInitialSeedReviews(): TrackedReview[] {
  const now = new Date();
  const daysAgo = (days: number, hoursOffset = 0) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000);
    return formatDateTime(d);
  };

  const seed: TrackedReview[] = [
    {
      id: 'rev-seed-1',
      reviewText: 'Decided on B.U. Bhandari Honda for our new vehicle, and the entire experience was delightful. The vehicle test drive was arranged promptly and all features were demonstrated clearly. Special mention to Rahul Shinde for guiding us patiently. Would readily recommend B.U. Bhandari Honda to all vehicle enthusiasts.',
      source: 'AI App Generated',
      status: 'Posted',
      generatedDate: daysAgo(1, 2),
      statusUpdatedDate: daysAgo(1, 1),
      experienceType: 'New Vehicle Purchase',
      rating: '5 Stars (Excellent)',
      employeeName: 'Rahul Shinde',
      teamName: 'Sales Team',
    },
    {
      id: 'rev-seed-2',
      reviewText: 'Got my vehicle serviced at B.U. Bhandari Honda, and the work was carried out impeccably. Regular maintenance at B.U. Bhandari Honda has always been dependable. Clear estimation and thorough inspection gave us complete peace of mind. Truly appreciate the professionalism.',
      source: 'AI App Generated',
      status: 'Posted',
      generatedDate: daysAgo(2, 4),
      statusUpdatedDate: daysAgo(2, 3),
      experienceType: 'Vehicle Service',
      rating: '5 Stars (Excellent)',
      employeeName: 'Amit Kulkarni',
      teamName: 'Service Team',
    },
    {
      id: 'rev-seed-3',
      reviewText: 'Taking delivery of our vehicle from B.U. Bhandari Honda was truly a memorable occasion. The vehicle handover ceremony was organized with great warmth and punctuality. Big thanks to Priyanka and the Delivery Team!',
      source: 'AI App Generated',
      status: 'Pending',
      generatedDate: daysAgo(0, 1),
      statusUpdatedDate: daysAgo(0, 1),
      experienceType: 'Vehicle Delivery',
      rating: '5 Stars (Excellent)',
      employeeName: 'Priyanka Patil',
      teamName: 'Delivery Team',
    },
    {
      id: 'rev-seed-4',
      reviewText: 'Purchased a vehicle from B.U. Bhandari Honda. While the vehicle is great, the process took longer than promised. Staff was polite, but paperwork turnaround needs improvement.',
      source: 'AI App Generated',
      status: 'Spam / Removed',
      generatedDate: daysAgo(3, 5),
      statusUpdatedDate: daysAgo(3, 2),
      experienceType: 'New Vehicle Purchase',
      rating: '2 Stars (Average)',
      notes: 'Customer duplicate post flagged on Google profile',
    },
    {
      id: 'rev-seed-5',
      reviewText: 'Walked in for test drive. Staff was helpful and showed all car accessories without pressure. Delivery promised next week.',
      source: 'Manual / Other',
      status: 'Posted',
      generatedDate: daysAgo(4, 3),
      statusUpdatedDate: daysAgo(4, 2),
      notes: 'Direct customer review submitted on showroom tablet',
    },
    {
      id: 'rev-seed-6',
      reviewText: 'Quick periodic inspection done. Staff behaviour polite and neat lounge with tea coffee served.',
      source: 'Manual / Other',
      status: 'Pending',
      generatedDate: daysAgo(1, 6),
      statusUpdatedDate: daysAgo(1, 6),
      notes: 'SMS feedback link response',
    },
    {
      id: 'rev-seed-7',
      reviewText: 'Buy cheap crypto now guaranteed profit visit website link click here today immediately',
      source: 'Manual / Other',
      status: 'Spam / Removed',
      generatedDate: daysAgo(5, 8),
      statusUpdatedDate: daysAgo(5, 7),
      notes: 'Bot spam comment removed from Google profile',
    },
  ];

  return seed;
}

// Read reviews from free browser localStorage
export function getTrackedReviews(): TrackedReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialSeedReviews();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed reading tracked reviews from localStorage:', err);
  }
  return [];
}

// Persist reviews to free browser localStorage
export function saveTrackedReviews(reviews: TrackedReview[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.error('Failed saving tracked reviews to localStorage:', err);
  }
}

// Add a newly generated AI review (automatically called when review is generated)
export function addAiGeneratedReview(
  reviewText: string,
  metadata?: {
    experienceType?: string;
    rating?: string;
    employeeName?: string;
    teamName?: string;
  }
): TrackedReview {
  const currentReviews = getTrackedReviews();
  const nowStr = formatDateTime();

  // Check if identical review text was recently generated in past 2 minutes to prevent duplicate logs
  const existingRecent = currentReviews.find(
    (r) => r.source === 'AI App Generated' && r.reviewText.trim() === reviewText.trim()
  );
  if (existingRecent) {
    return existingRecent;
  }

  const newReview: TrackedReview = {
    id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    reviewText: reviewText.trim(),
    source: 'AI App Generated',
    status: 'Pending',
    generatedDate: nowStr,
    statusUpdatedDate: nowStr,
    experienceType: metadata?.experienceType,
    rating: metadata?.rating,
    employeeName: metadata?.employeeName,
    teamName: metadata?.teamName,
  };

  const updated = [newReview, ...currentReviews];
  saveTrackedReviews(updated);
  return newReview;
}

// Add a manual / other review entered by Admin
export function addManualReview(
  reviewText: string,
  status: ReviewStatus = 'Pending',
  dateStr?: string,
  notes?: string
): TrackedReview {
  const currentReviews = getTrackedReviews();
  const nowStr = formatDateTime();

  const newReview: TrackedReview = {
    id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    reviewText: reviewText.trim(),
    source: 'Manual / Other',
    status: status,
    generatedDate: dateStr || nowStr,
    statusUpdatedDate: nowStr,
    notes: notes?.trim() || undefined,
  };

  const updated = [newReview, ...currentReviews];
  saveTrackedReviews(updated);
  return newReview;
}

// Update review status (Posted, Spam / Removed, Pending)
export function updateReviewStatus(id: string, newStatus: ReviewStatus): boolean {
  const currentReviews = getTrackedReviews();
  const index = currentReviews.findIndex((r) => r.id === id);
  if (index === -1) return false;

  const nowStr = formatDateTime();
  currentReviews[index] = {
    ...currentReviews[index],
    status: newStatus,
    statusUpdatedDate: nowStr,
  };

  saveTrackedReviews(currentReviews);
  return true;
}

// Delete review from history
export function deleteTrackedReview(id: string): boolean {
  const currentReviews = getTrackedReviews();
  const filtered = currentReviews.filter((r) => r.id !== id);
  if (filtered.length === currentReviews.length) return false;
  saveTrackedReviews(filtered);
  return true;
}

// Calculate Review Analytics accurately without double-counting
export function calculateReviewAnalytics(reviews: TrackedReview[]): ReviewAnalyticsStats {
  let aiGenerated = 0;
  let aiPosted = 0;
  let aiSpamRemoved = 0;
  let aiPending = 0;

  let manualTracked = 0;
  let manualPosted = 0;
  let manualSpamRemoved = 0;
  let manualPending = 0;

  for (const r of reviews) {
    if (r.source === 'AI App Generated') {
      aiGenerated++;
      if (r.status === 'Posted') aiPosted++;
      else if (r.status === 'Spam / Removed') aiSpamRemoved++;
      else if (r.status === 'Pending') aiPending++;
    } else {
      manualTracked++;
      if (r.status === 'Posted') manualPosted++;
      else if (r.status === 'Spam / Removed') manualSpamRemoved++;
      else if (r.status === 'Pending') manualPending++;
    }
  }

  const totalReviewsGenerated = aiGenerated;
  const totalAiReviews = aiGenerated;
  const totalManualReviews = manualTracked;
  const totalTrackedReviews = totalAiReviews + totalManualReviews;
  const totalMarkedAsPosted = aiPosted + manualPosted;
  const totalMarkedAsSpamRemoved = aiSpamRemoved + manualSpamRemoved;
  const totalPending = aiPending + manualPending;

  // Spam / Removed % = (Total Reviews Marked as Spam / Removed ÷ Total Tracked Reviews) × 100
  const spamRemovedPercentage =
    totalTrackedReviews > 0
      ? Number(((totalMarkedAsSpamRemoved / totalTrackedReviews) * 100).toFixed(1))
      : 0;

  return {
    totalReviewsGenerated,
    totalAiReviews,
    totalManualReviews,
    totalTrackedReviews,
    totalMarkedAsPosted,
    totalMarkedAsSpamRemoved,
    totalPending,
    spamRemovedPercentage,
    aiBreakdown: {
      generated: aiGenerated,
      posted: aiPosted,
      spamRemoved: aiSpamRemoved,
      pending: aiPending,
    },
    manualBreakdown: {
      tracked: manualTracked,
      posted: manualPosted,
      spamRemoved: manualSpamRemoved,
      pending: manualPending,
    },
  };
}

// ==========================================
// ADMIN AUTHENTICATION (EXACT EMAIL ACCESS CONTROL)
// ==========================================

export const AUTHORIZED_ADMIN_EMAIL = 'hondabubhandari@gmail.com';

export function getAuthenticatedAdminEmail(): string | null {
  try {
    const raw = sessionStorage.getItem(AUTH_KEY) || localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed.authenticated && parsed.email?.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        return parsed.email;
      }
    }
    // Legacy token check
    if (raw === 'bhandari_authenticated') {
      return AUTHORIZED_ADMIN_EMAIL;
    }
  } catch {
    return null;
  }
  return null;
}

export function isAdminAuthenticated(): boolean {
  return getAuthenticatedAdminEmail() === AUTHORIZED_ADMIN_EMAIL;
}

export function loginAdmin(
  emailInput: string,
  passwordInput: string
): { success: boolean; message?: string } {
  const cleanEmail = (emailInput || '').trim().toLowerCase();
  const cleanPass = (passwordInput || '').trim();

  // Strict email verification: ONLY hondabubhandari@gmail.com is authorized
  if (cleanEmail !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      message: `Access Denied: "${emailInput || 'Empty'}" is not authorized. Only ${AUTHORIZED_ADMIN_EMAIL} is granted administrative access. All other email addresses are treated as public users.`,
    };
  }

  // Accepted passwords:
  // 1. Any custom password configured in localStorage
  // 2. Dealership administrative keys
  const customPass = localStorage.getItem(CUSTOM_PASS_KEY);
  const acceptedPasswords = [
    'admin123',
    'bhandari@admin',
    'honda@admin',
    'bhandari2026',
    'admin',
  ];

  if (customPass) {
    acceptedPasswords.push(customPass);
  }

  if (acceptedPasswords.includes(cleanPass)) {
    try {
      const sessionData = JSON.stringify({
        email: AUTHORIZED_ADMIN_EMAIL,
        authenticated: true,
        loginTime: new Date().toISOString(),
      });
      sessionStorage.setItem(AUTH_KEY, sessionData);
      localStorage.setItem(AUTH_KEY, sessionData);
    } catch (e) {
      console.warn('Session storage error:', e);
    }
    return { success: true };
  }

  return { success: false, message: 'Incorrect administrator password. Please verify credentials.' };
}

export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  } catch (e) {
    console.warn('Logout error:', e);
  }
}

export function setCustomAdminPassword(newPass: string): boolean {
  try {
    if (!newPass || newPass.trim().length < 4) return false;
    localStorage.setItem(CUSTOM_PASS_KEY, newPass.trim());
    return true;
  } catch {
    return false;
  }
}
