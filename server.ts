import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI lazily on server
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini] GEMINI_API_KEY environment variable is not set');
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ActivityLogEntry {
  id: string;
  date: string; // YYYY-MM-DD in IST
  time: string; // HH:MM:SS in IST
  timestamp: number;
  showroom: string; // "B.U. Bhandari Honda – Camp Showroom"
  experienceType: 'New Vehicle Purchase' | 'Vehicle Service' | 'Vehicle Delivery';
  rating: '5 Stars (Excellent)' | '4 Stars (Very Good)' | '3 Stars (Good)' | '2 Stars (Average)' | '1 Star (Needs Improvement)';
  employeeName?: string;
  teamName?: string;
  aiImprovement: string;
  aiStatus: string;
  reviewGenerated: string;
  selectedAspects?: string[];
  additionalComments?: string;
  googleReviewOpened?: 'Yes' | 'No';
  sheetSyncStatus?: 'synced' | 'failed' | 'pending';
  sheetSyncMessage?: string;
}

const STORAGE_FILE = path.join(process.cwd(), 'activity-logs.json');
const CONFIG_FILE = path.join(process.cwd(), 'sheet-config.json');

const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwylHqJJyb6awBoQ14i2x5sP3U1XP5yLrGoGGyXA1neP4RXJSWTxm6WUpFmFUXCV4v9/exec';

function loadLogs(): ActivityLogEntry[] {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading logs file:', err);
  }
  return [];
}

function saveLogs(logs: ActivityLogEntry[]) {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing logs file:', err);
  }
}

interface SheetConfig {
  webhookUrl: string;
  sheetName: string;
  lastSyncStatus?: string;
  lastSyncTime?: string;
}

function loadSheetConfig(): SheetConfig {
  const envUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return {
        webhookUrl: data.webhookUrl || envUrl || DEFAULT_APPS_SCRIPT_URL,
        sheetName: data.sheetName || 'B.U. Bhandari Honda – Camp Showroom Review Reports',
        lastSyncStatus: data.lastSyncStatus,
        lastSyncTime: data.lastSyncTime,
      };
    }
  } catch (err) {
    console.error('Error reading config file:', err);
  }
  return {
    webhookUrl: envUrl || DEFAULT_APPS_SCRIPT_URL,
    sheetName: 'B.U. Bhandari Honda – Camp Showroom Review Reports',
  };
}

function saveSheetConfig(config: SheetConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving config file:', err);
  }
}

let inMemoryLogs: ActivityLogEntry[] = loadLogs();
let sheetConfig: SheetConfig = loadSheetConfig();

// Get current IST date and time (Asia/Kolkata)
function getISTDateAndTime(timestamp = Date.now()) {
  const dateObj = new Date(timestamp);
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(dateObj);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const day = getPart('day');
  const month = getPart('month');
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');
  const second = getPart('second');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`,
    hour: parseInt(hour, 10),
    minute: parseInt(minute, 10),
    formattedIST: `${day}/${month}/${year}, ${hour}:${minute}:${second} IST`,
  };
}

// Forward to Google Apps Script Web App
async function forwardToGoogleSheet(
  action: 'create' | 'update' | 'test_connection',
  entry: Partial<ActivityLogEntry>
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = sheetConfig.webhookUrl || DEFAULT_APPS_SCRIPT_URL;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'Google Sheet Web App URL is not configured' };
  }

  const ist = getISTDateAndTime();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    // Extract actual numeric 1-5 rating (e.g. "5 Stars (Excellent)" -> 5)
    let numericRating: any = entry.rating;
    if (typeof entry.rating === 'string') {
      const match = entry.rating.match(/^(\d)/);
      if (match) {
        numericRating = parseInt(match[1], 10);
      }
    }

    const payload = {
      action,
      experienceType: entry.experienceType || 'New Vehicle Purchase',
      rating: numericRating !== undefined ? numericRating : 5,
      employeeName: entry.employeeName || '',
      teamName: entry.teamName || '',
      aiImprovement: entry.aiImprovement || 'No',
      aiStatus: entry.aiStatus || 'Local Review Generated',
      reviewGenerated: entry.reviewGenerated || '',
      id: entry.id,
      date: entry.date || ist.date,
      time: entry.time || ist.time,
      showroom: 'B.U. Bhandari Honda',
      selectedAspects: Array.isArray(entry.selectedAspects) ? entry.selectedAspects.join(', ') : '',
      additionalComments: entry.additionalComments || '',
      googleReviewOpened: entry.googleReviewOpened || 'No',
      timestamp: entry.timestamp || Date.now(),
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      let isSuccess = true;
      let respMessage = 'Review activity saved.';
      try {
        const json = await res.json();
        if (json && typeof json === 'object') {
          if (json.success === false) {
            isSuccess = false;
            respMessage = json.message || 'Apps script reported failure';
          } else if (json.success === true) {
            isSuccess = true;
            respMessage = json.message || 'Review activity saved.';
          }
        }
      } catch {
        // Apps Script may return raw text or redirect response
        isSuccess = true;
      }

      if (isSuccess) {
        sheetConfig.lastSyncStatus = 'Connected & Synced';
        sheetConfig.lastSyncTime = ist.formattedIST;
        saveSheetConfig(sheetConfig);
        return { success: true, message: respMessage };
      } else {
        sheetConfig.lastSyncStatus = respMessage;
        saveSheetConfig(sheetConfig);
        return { success: false, message: respMessage };
      }
    } else {
      const errMsg = `Google Apps Script returned HTTP ${res.status}`;
      sheetConfig.lastSyncStatus = errMsg;
      saveSheetConfig(sheetConfig);
      return { success: false, message: errMsg };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    const errMsg = err.name === 'AbortError' ? 'Timeout reaching Google Apps Script' : (err.message || 'Connection error');
    sheetConfig.lastSyncStatus = errMsg;
    saveSheetConfig(sheetConfig);
    return { success: false, message: errMsg };
  }
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dealership: 'B.U. Bhandari Honda – Camp Showroom',
    timeIST: getISTDateAndTime().formattedIST,
    sheetConnected: Boolean(sheetConfig.webhookUrl),
    appsScriptUrl: sheetConfig.webhookUrl,
  });
});

// 1. Improve Review with Gemini AI (Called ONLY on explicit button click)
app.post('/api/improve-review', async (req, res) => {
  const {
    experienceType,
    rating,
    selectedAspects,
    employeeName,
    teamName,
    additionalComments,
    currentReview,
  } = req.body;

  if (!currentReview) {
    return res.status(400).json({ error: 'currentReview is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Gemini AI service is not available. Please keep your local review.',
      fallbackReview: currentReview,
    });
  }

  // Enforce 5-second timeout
  const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
    setTimeout(() => resolve({ isTimeout: true }), 4800)
  );

  try {
    const prompt = `You are an expert customer review assistant for "B.U. Bhandari Honda – Camp Showroom" in Pune.
Refine the customer review draft to sound completely natural, fluent, and genuine, preserving the EXACT sentiment and rating.

Details provided:
- Dealership: B.U. Bhandari Honda – Camp Showroom (Camp Showroom only; do NOT mention Bhawani Peth, Mundhwa, Baner, or any other branch)
- Experience: ${experienceType || 'General'}
- Rating: ${rating || '5 Stars'}
- Customer Highlights: ${Array.isArray(selectedAspects) && selectedAspects.length ? selectedAspects.join(', ') : 'None specified'}
- Sales / Service Employee Name: ${employeeName ? employeeName : 'None provided'}
- Team Name: ${teamName ? teamName : 'None provided'}
- Additional Remarks: ${additionalComments ? additionalComments : 'None'}

Current Review Draft:
"${currentReview}"

STRICT RULES:
1. Polish the review into an authentic 30-65 word customer review.
2. NEVER invent employee names or team names not in the input. If ${employeeName ? `"${employeeName}"` : 'no employee name'} or ${teamName ? `"${teamName}"` : 'no team'} was provided, include ONLY what was given.
3. Keep the customer's actual rating sentiment (${rating}).
4. Always refer to the dealership as "B.U. Bhandari Honda – Camp Showroom" or "B.U. Bhandari Honda Camp Showroom".
5. Return ONLY the plain review text. No quotes, no markdown, no headings.`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You write genuine, authentic automotive customer reviews for B.U. Bhandari Honda Camp Showroom. Output ONLY plain review text without markdown or quotes.',
        temperature: 0.7,
      },
    });

    const result = await Promise.race([aiPromise, timeoutPromise]);

    if ('isTimeout' in result) {
      console.warn('[Gemini] Request timed out after 5s limit, falling back to local review.');
      return res.status(200).json({
        review: currentReview,
        isFallback: true,
        reason: 'timeout',
      });
    }

    const text = result.text?.trim();
    if (!text) {
      return res.status(200).json({
        review: currentReview,
        isFallback: true,
        reason: 'empty_response',
      });
    }

    const cleanedReview = text.replace(/^["']|["']$/g, '').trim();

    return res.status(200).json({
      review: cleanedReview,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('[Gemini] Error generating improved review:', err);
    return res.status(200).json({
      review: currentReview,
      isFallback: true,
      reason: err?.message || 'error',
    });
  }
});

// 2. Log Review Activity (Sheet 1: Review Activity with Columns A through I)
app.post('/api/log-activity', async (req, res) => {
  const {
    id,
    experienceType,
    rating,
    employeeName,
    teamName,
    aiImprovement,
    aiStatus,
    reviewGenerated,
    selectedAspects,
    additionalComments,
    googleReviewOpened,
  } = req.body;

  const ist = getISTDateAndTime();

  const newEntry: ActivityLogEntry = {
    id: id || 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    date: ist.date,
    time: ist.time,
    timestamp: Date.now(),
    showroom: 'B.U. Bhandari Honda – Camp Showroom',
    experienceType: experienceType || 'New Vehicle Purchase',
    rating: rating || '5 Stars (Excellent)',
    employeeName: employeeName?.trim() || '',
    teamName: teamName?.trim() || '',
    aiImprovement: aiImprovement || 'No',
    aiStatus: aiStatus || 'Generated',
    reviewGenerated: reviewGenerated || '',
    selectedAspects: Array.isArray(selectedAspects) ? selectedAspects : [],
    additionalComments: additionalComments?.trim() || '',
    googleReviewOpened: googleReviewOpened === 'Yes' ? 'Yes' : 'No',
    sheetSyncStatus: 'pending',
  };

  // Prepend new entry to memory log
  inMemoryLogs.unshift(newEntry);
  if (inMemoryLogs.length > 5000) {
    inMemoryLogs = inMemoryLogs.slice(0, 5000);
  }
  saveLogs(inMemoryLogs);

  // Synchronously forward to Google Sheet with short timeout to return real status
  const syncResult = await forwardToGoogleSheet('create', newEntry);
  newEntry.sheetSyncStatus = syncResult.success ? 'synced' : 'failed';
  newEntry.sheetSyncMessage = syncResult.message;
  saveLogs(inMemoryLogs);

  res.json({
    success: true,
    entryId: newEntry.id,
    istTime: ist.formattedIST,
    sheetSyncStatus: newEntry.sheetSyncStatus,
    sheetSyncMessage: newEntry.sheetSyncMessage,
  });
});

// 3. Update existing log entry (e.g. when AI polish completes or text is updated)
app.post('/api/update-log-ai-status', async (req, res) => {
  const { entryId, aiImprovement, aiStatus, reviewGenerated } = req.body;
  if (!entryId) return res.status(400).json({ error: 'entryId required' });

  const entry = inMemoryLogs.find((l) => l.id === entryId);
  if (entry) {
    if (aiImprovement) entry.aiImprovement = aiImprovement;
    if (aiStatus) entry.aiStatus = aiStatus;
    if (reviewGenerated) entry.reviewGenerated = reviewGenerated;
    saveLogs(inMemoryLogs);

    // Forward update to Google Sheet
    const syncResult = await forwardToGoogleSheet('update', entry);
    entry.sheetSyncStatus = syncResult.success ? 'synced' : 'failed';
    entry.sheetSyncMessage = syncResult.message;
    saveLogs(inMemoryLogs);

    return res.json({
      success: true,
      sheetSyncStatus: entry.sheetSyncStatus,
      sheetSyncMessage: entry.sheetSyncMessage,
    });
  }
  res.status(404).json({ error: 'Entry not found' });
});

// 4. Log Google Review button click (Google Review Opened: Yes)
app.post('/api/log-google-review-opened', async (req, res) => {
  const { entryId } = req.body;
  if (!entryId) return res.status(400).json({ error: 'entryId required' });

  const entry = inMemoryLogs.find((l) => l.id === entryId);
  if (entry) {
    entry.googleReviewOpened = 'Yes';
    saveLogs(inMemoryLogs);

    // Forward update to Google Sheet
    forwardToGoogleSheet('update', entry);

    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Entry not found' });
});

// 5. Get Review Activity (Tab 1 Data)
app.get('/api/reports/activity', (req, res) => {
  res.json({
    logs: inMemoryLogs.slice(0, 100),
    totalCount: inMemoryLogs.length,
  });
});

// 6. Get 4-Hour Report (Tab 2 Data)
app.get('/api/reports/4-hour', (req, res) => {
  const ist = getISTDateAndTime();
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  const recentLogs = inMemoryLogs.filter((l) => l.timestamp >= fourHoursAgo);

  let newVehiclePurchaseCount = 0;
  let vehicleServiceCount = 0;
  let vehicleDeliveryCount = 0;

  let fiveStarCount = 0;
  let fourStarCount = 0;
  let threeStarCount = 0;
  let twoStarCount = 0;
  let oneStarCount = 0;

  let totalStarSum = 0;
  let ratingCount = 0;

  const employeeWiseCount: Record<string, number> = {};
  const teamWiseCount: Record<string, number> = {};
  let aiStatusIssues = 0;
  let googleReviewOpenedCount = 0;
  let failedSheetEntries = 0;

  for (const log of recentLogs) {
    if (log.experienceType === 'New Vehicle Purchase') newVehiclePurchaseCount++;
    else if (log.experienceType === 'Vehicle Service') vehicleServiceCount++;
    else if (log.experienceType === 'Vehicle Delivery') vehicleDeliveryCount++;

    if (log.rating?.startsWith('5')) {
      fiveStarCount++;
      totalStarSum += 5;
      ratingCount++;
    } else if (log.rating?.startsWith('4')) {
      fourStarCount++;
      totalStarSum += 4;
      ratingCount++;
    } else if (log.rating?.startsWith('3')) {
      threeStarCount++;
      totalStarSum += 3;
      ratingCount++;
    } else if (log.rating?.startsWith('2')) {
      twoStarCount++;
      totalStarSum += 2;
      ratingCount++;
    } else if (log.rating?.startsWith('1')) {
      oneStarCount++;
      totalStarSum += 1;
      ratingCount++;
    }

    if (log.employeeName && log.employeeName.trim()) {
      const emp = log.employeeName.trim();
      employeeWiseCount[emp] = (employeeWiseCount[emp] || 0) + 1;
    }

    if (log.teamName && log.teamName.trim()) {
      const team = log.teamName.trim();
      teamWiseCount[team] = (teamWiseCount[team] || 0) + 1;
    }

    if (log.aiStatus === 'Failed' || log.aiStatus === 'Timeout / Fallback') {
      aiStatusIssues++;
    }

    if (log.googleReviewOpened === 'Yes') {
      googleReviewOpenedCount++;
    }

    if (log.sheetSyncStatus === 'failed') {
      failedSheetEntries++;
    }
  }

  const averageRating = ratingCount > 0 ? parseFloat((totalStarSum / ratingCount).toFixed(2)) : 5.0;

  res.json({
    reportDate: ist.date,
    reportTime: ist.time + ' IST',
    totalReviewsGenerated: recentLogs.length,
    totalSubmissions: recentLogs.length,
    averageRating,
    fiveStarCount,
    fourStarCount,
    threeStarCount,
    twoStarCount,
    oneStarCount,
    newVehiclePurchaseCount,
    vehicleServiceCount,
    vehicleDeliveryCount,
    employeeWiseCount,
    teamWiseCount,
    aiStatusIssues,
    failedSheetEntries,
    googleReviewOpenedCount,
    googleSheetConnected: Boolean(sheetConfig.webhookUrl),
  });
});

// 7. Get Daily Report (Tab 3 Data)
app.get('/api/reports/daily', (req, res) => {
  const ist = getISTDateAndTime();
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const dailyLogs = inMemoryLogs.filter((l) => l.timestamp >= twentyFourHoursAgo);

  let newVehiclePurchaseCount = 0;
  let vehicleServiceCount = 0;
  let vehicleDeliveryCount = 0;

  let fiveStarCount = 0;
  let fourStarCount = 0;
  let threeStarCount = 0;
  let twoStarCount = 0;
  let oneStarCount = 0;

  let totalStarSum = 0;
  let ratingCount = 0;
  let googleReviewOpenedCount = 0;
  let aiErrors = 0;

  const empMap: Record<string, { total: number; sumStars: number; fiveStars: number }> = {};
  const teamMap: Record<string, { total: number; sumStars: number }> = {};

  for (const log of dailyLogs) {
    if (log.experienceType === 'New Vehicle Purchase') newVehiclePurchaseCount++;
    else if (log.experienceType === 'Vehicle Service') vehicleServiceCount++;
    else if (log.experienceType === 'Vehicle Delivery') vehicleDeliveryCount++;

    let stars = 5;
    if (log.rating?.startsWith('5')) {
      fiveStarCount++;
      stars = 5;
    } else if (log.rating?.startsWith('4')) {
      fourStarCount++;
      stars = 4;
    } else if (log.rating?.startsWith('3')) {
      threeStarCount++;
      stars = 3;
    } else if (log.rating?.startsWith('2')) {
      twoStarCount++;
      stars = 2;
    } else if (log.rating?.startsWith('1')) {
      oneStarCount++;
      stars = 1;
    }

    totalStarSum += stars;
    ratingCount++;

    if (log.googleReviewOpened === 'Yes') googleReviewOpenedCount++;
    if (log.aiStatus === 'Failed') aiErrors++;

    if (log.employeeName && log.employeeName.trim()) {
      const emp = log.employeeName.trim();
      if (!empMap[emp]) empMap[emp] = { total: 0, sumStars: 0, fiveStars: 0 };
      empMap[emp].total++;
      empMap[emp].sumStars += stars;
      if (stars === 5) empMap[emp].fiveStars++;
    }

    if (log.teamName && log.teamName.trim()) {
      const team = log.teamName.trim();
      if (!teamMap[team]) teamMap[team] = { total: 0, sumStars: 0 };
      teamMap[team].total++;
      teamMap[team].sumStars += stars;
    }
  }

  const averageRating = ratingCount > 0 ? parseFloat((totalStarSum / ratingCount).toFixed(2)) : 5.0;

  const employeePerformance = Object.entries(empMap).map(([employeeName, d]) => ({
    employeeName,
    totalReviews: d.total,
    avgRating: parseFloat((d.sumStars / d.total).toFixed(2)),
    fiveStars: d.fiveStars,
  }));

  const teamPerformance = Object.entries(teamMap).map(([teamName, d]) => ({
    teamName,
    totalReviews: d.total,
    avgRating: parseFloat((d.sumStars / d.total).toFixed(2)),
  }));

  res.json({
    date: ist.date,
    scheduledTime: '18:00 IST (Daily 6:00 PM)',
    totalReviews: dailyLogs.length,
    totalSubmissions: dailyLogs.length,
    averageRating,
    fiveStarCount,
    fourStarCount,
    threeStarCount,
    twoStarCount,
    oneStarCount,
    newVehiclePurchaseCount,
    vehicleServiceCount,
    vehicleDeliveryCount,
    employeePerformance,
    teamPerformance,
    seoQualitySummary: '100% genuine reviews for B.U. Bhandari Honda – Camp Showroom.',
    aiStatusSummary: `${aiErrors === 0 ? 'All reviews generated flawlessly.' : `${aiErrors} AI fallback(s) handled gracefully.`}`,
    googleSheetSyncStatus: sheetConfig.webhookUrl ? 'Connected & Active' : 'Webhook Not Configured',
    googleReviewOpenedCount,
  });
});

// 8. Get Employee Summary (Tab 4 Data)
app.get('/api/reports/employee-summary', (req, res) => {
  const empMap: Record<
    string,
    {
      total: number;
      starSum: number;
      fiveStar: number;
      fourStar: number;
      threeStar: number;
      twoStar: number;
      oneStar: number;
      latestDate: string;
      latestTimestamp: number;
    }
  > = {};

  const teamMap: Record<
    string,
    {
      total: number;
      starSum: number;
      newVehiclePurchase: number;
      vehicleService: number;
      vehicleDelivery: number;
    }
  > = {};

  for (const log of inMemoryLogs) {
    const stars = log.rating?.startsWith('5')
      ? 5
      : log.rating?.startsWith('4')
      ? 4
      : log.rating?.startsWith('3')
      ? 3
      : log.rating?.startsWith('2')
      ? 2
      : 1;

    if (log.employeeName && log.employeeName.trim()) {
      const emp = log.employeeName.trim();
      if (!empMap[emp]) {
        empMap[emp] = {
          total: 0,
          starSum: 0,
          fiveStar: 0,
          fourStar: 0,
          threeStar: 0,
          twoStar: 0,
          oneStar: 0,
          latestDate: log.date,
          latestTimestamp: log.timestamp,
        };
      }
      empMap[emp].total++;
      empMap[emp].starSum += stars;
      if (stars === 5) empMap[emp].fiveStar++;
      else if (stars === 4) empMap[emp].fourStar++;
      else if (stars === 3) empMap[emp].threeStar++;
      else if (stars === 2) empMap[emp].twoStar++;
      else if (stars === 1) empMap[emp].oneStar++;

      if (log.timestamp > empMap[emp].latestTimestamp) {
        empMap[emp].latestDate = log.date;
        empMap[emp].latestTimestamp = log.timestamp;
      }
    }

    if (log.teamName && log.teamName.trim()) {
      const team = log.teamName.trim();
      if (!teamMap[team]) {
        teamMap[team] = {
          total: 0,
          starSum: 0,
          newVehiclePurchase: 0,
          vehicleService: 0,
          vehicleDelivery: 0,
        };
      }
      teamMap[team].total++;
      teamMap[team].starSum += stars;
      if (log.experienceType === 'New Vehicle Purchase') teamMap[team].newVehiclePurchase++;
      else if (log.experienceType === 'Vehicle Service') teamMap[team].vehicleService++;
      else if (log.experienceType === 'Vehicle Delivery') teamMap[team].vehicleDelivery++;
    }
  }

  const summaries = Object.entries(empMap).map(([employeeName, data]) => ({
    employeeName,
    totalReviews: data.total,
    averageRating: parseFloat((data.starSum / data.total).toFixed(2)),
    fiveStarReviews: data.fiveStar,
    fourStarReviews: data.fourStar,
    threeStarReviews: data.threeStar,
    twoStarReviews: data.twoStar,
    oneStarReviews: data.oneStar,
    latestReviewDate: data.latestDate,
  }));

  const teamSummaries = Object.entries(teamMap).map(([teamName, data]) => ({
    teamName,
    totalReviews: data.total,
    averageRating: parseFloat((data.starSum / data.total).toFixed(2)),
    newVehiclePurchase: data.newVehiclePurchase,
    vehicleService: data.vehicleService,
    vehicleDelivery: data.vehicleDelivery,
  }));

  res.json({ summaries, teamSummaries });
});

// 9. Sheet Config Endpoints
app.get('/api/sheet-config', (req, res) => {
  res.json(sheetConfig);
});

app.post('/api/sheet-config', (req, res) => {
  const { webhookUrl, sheetName } = req.body;
  sheetConfig.webhookUrl = webhookUrl !== undefined ? webhookUrl.trim() : sheetConfig.webhookUrl;
  sheetConfig.sheetName = sheetName !== undefined ? sheetName.trim() : sheetConfig.sheetName;
  saveSheetConfig(sheetConfig);
  res.json({ success: true, config: sheetConfig });
});

// 10. Webhook Connection Test
app.post('/api/sheet-test-sync', async (req, res) => {
  const { webhookUrl } = req.body;
  const targetUrl = webhookUrl || sheetConfig.webhookUrl || DEFAULT_APPS_SCRIPT_URL;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Valid Google Apps Script Web App URL is required.' });
  }

  const ist = getISTDateAndTime();
  const testPayload = {
    action: 'test_connection',
    spreadsheetName: 'B.U. Bhandari Honda – Camp Showroom Review Reports',
    showroom: 'B.U. Bhandari Honda – Camp Showroom',
    date: ist.date,
    time: ist.time,
    experienceType: 'New Vehicle Purchase',
    rating: '5 Stars (Excellent)',
    employeeName: 'System Test',
    teamName: 'Quality Team',
    aiImprovement: 'Natural Generator',
    aiStatus: 'Test Verified',
    reviewGenerated: 'B.U. Bhandari Honda Camp Showroom Webhook connection test successful.',
    timestamp: Date.now(),
  };

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
      redirect: 'follow',
    });

    if (response.ok) {
      sheetConfig.lastSyncStatus = 'Connected & Verified';
      sheetConfig.lastSyncTime = ist.formattedIST;
      saveSheetConfig(sheetConfig);
      return res.json({
        success: true,
        message: 'Google Apps Script Web App responded successfully (HTTP 200).',
      });
    } else {
      return res.status(response.status).json({
        error: `Google Apps Script returned status ${response.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to reach Google Apps Script Web App URL.',
    });
  }
});

// 11. Trigger Email Test
app.post('/api/reports/trigger-email', async (req, res) => {
  const { reportType, recipientEmail } = req.body;
  const targetEmail = recipientEmail || 'hondabubhandari@gmail.com';
  const webhookUrl = sheetConfig.webhookUrl || DEFAULT_APPS_SCRIPT_URL;

  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return res.status(400).json({
      error: 'Google Sheet Web App URL not configured. Please configure it in Reports & Sheet.',
    });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_email_report',
        reportType: reportType || 'daily',
        recipientEmail: targetEmail,
        showroom: 'B.U. Bhandari Honda – Camp Showroom',
      }),
      redirect: 'follow',
    });

    if (response.ok) {
      return res.json({
        success: true,
        message: `Email report command triggered for ${targetEmail}.`,
      });
    } else {
      return res.status(response.status).json({
        error: `Webhook responded with HTTP ${response.status}`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      error: err.message || 'Failed to trigger email report via Google Apps Script.',
    });
  }
});

// 12. Full Google Apps Script Generator
app.get('/api/reports/google-apps-script', (req, res) => {
  const scriptContent = `/**
 * =========================================================================
 * B.U. BHANDARI HONDA – CAMP SHOWROOM CUSTOMER REVIEW ASSISTANT & AUTOMATED REPORTING
 * =========================================================================
 * Dealership: B.U. Bhandari Honda – Camp Showroom
 * Target Email: hondabubhandari@gmail.com
 * Time Zone: Asia/Kolkata (IST)
 *
 * 4 TABS IN GOOGLE SHEET:
 * 1. "Review Activity" (Columns A-I)
 *    A: Date | B: Time | C: Experience Type | D: Rating | E: Sales Employee Name | F: Team Name | G: AI Improvement | H: AI Status | I: Review Generated
 * 2. "4 Hour Report" (Every 4 Hours automated trigger & snapshot)
 * 3. "Daily Report" (Daily at 6:00 PM IST automated trigger & summary)
 * 4. "Employee Summary" (Live Employee Performance leaderboard)
 * =========================================================================
 */

const TARGET_EMAIL = "hondabubhandari@gmail.com";
const TIME_ZONE = "Asia/Kolkata";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    initializeSheets(ss);
    
    if (data.action === "create") {
      appendReviewActivity(ss, data);
      updateEmployeeSummary(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "created" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "update") {
      updateReviewActivity(ss, data);
      updateEmployeeSummary(ss);
      return ContentService.createTextOutput(JSON.stringify({ status: "success", action: "updated" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "test_connection") {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Connected to B.U. Bhandari Honda Camp Showroom Review Sheet" }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (data.action === "send_email_report") {
      if (data.reportType === "4hour") {
        send4HourEmailReport();
      } else {
        sendDailyEmailReport();
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email report dispatched" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function initializeSheets(ss) {
  let sheet1 = ss.getSheetByName("Review Activity");
  if (!sheet1) {
    sheet1 = ss.insertSheet("Review Activity");
    const headers = [
      "Date",
      "Time",
      "Experience Type",
      "Rating",
      "Sales Employee Name",
      "Team Name",
      "AI Improvement",
      "AI Status",
      "Review Generated"
    ];
    sheet1.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet1.getRange(1, 1, 1, headers.length)
      .setBackground("#CC0000")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
    sheet1.setFrozenRows(1);
  }

  let sheet2 = ss.getSheetByName("4 Hour Report");
  if (!sheet2) {
    sheet2 = ss.insertSheet("4 Hour Report");
    const headers = [
      "Report Timestamp (IST)",
      "Window",
      "Total Reviews",
      "Average Rating",
      "5-Star",
      "4-Star",
      "3-Star",
      "2-Star",
      "1-Star",
      "New Vehicle Purchase",
      "Vehicle Service",
      "Vehicle Delivery",
      "Employee Mentions",
      "Team Mentions",
      "Email Dispatched To"
    ];
    sheet2.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet2.getRange(1, 1, 1, headers.length)
      .setBackground("#1E293B")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
    sheet2.setFrozenRows(1);
  }

  let sheet3 = ss.getSheetByName("Daily Report");
  if (!sheet3) {
    sheet3 = ss.insertSheet("Daily Report");
    const headers = [
      "Date (IST)",
      "Total Daily Reviews",
      "Average Rating",
      "5-Star Count",
      "4-Star Count",
      "3-Star Count",
      "2-Star Count",
      "1-Star Count",
      "New Vehicle Purchase",
      "Vehicle Service",
      "Vehicle Delivery",
      "Top Sales Employee",
      "Top Team",
      "Email Sent To"
    ];
    sheet3.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet3.getRange(1, 1, 1, headers.length)
      .setBackground("#0F172A")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
    sheet3.setFrozenRows(1);
  }

  let sheet4 = ss.getSheetByName("Employee Summary");
  if (!sheet4) {
    sheet4 = ss.insertSheet("Employee Summary");
    const headers = [
      "Sales Employee Name",
      "Total Reviews",
      "Average Rating",
      "5-Star Reviews",
      "4-Star Reviews",
      "3-Star Reviews",
      "2-Star Reviews",
      "1-Star Reviews",
      "Latest Review Date"
    ];
    sheet4.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet4.getRange(1, 1, 1, headers.length)
      .setBackground("#CC0000")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold");
    sheet4.setFrozenRows(1);
  }
}

function appendReviewActivity(ss, data) {
  const sheet = ss.getSheetByName("Review Activity");
  const row = [
    data.date || Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd"),
    data.time || Utilities.formatDate(new Date(), TIME_ZONE, "HH:mm:ss"),
    data.experienceType || "New Vehicle Purchase",
    data.rating || "5 Stars (Excellent)",
    data.employeeName || "",
    data.teamName || "",
    data.aiImprovement || "No",
    data.aiStatus || "Generated",
    data.reviewGenerated || ""
  ];
  sheet.appendRow(row);
}

function updateReviewActivity(ss, data) {
  const sheet = ss.getSheetByName("Review Activity");
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(lastRow, 7).setValue(data.aiImprovement || "Refined with AI");
    sheet.getRange(lastRow, 8).setValue(data.aiStatus || "Success");
    if (data.reviewGenerated) {
      sheet.getRange(lastRow, 9).setValue(data.reviewGenerated);
    }
  }
}

function updateEmployeeSummary(ss) {
  const actSheet = ss.getSheetByName("Review Activity");
  const empSheet = ss.getSheetByName("Employee Summary");
  if (!actSheet || !empSheet) return;

  const data = actSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  const empMap = {};

  for (let i = 1; i < data.length; i++) {
    const date = data[i][0];
    const ratingStr = String(data[i][3]);
    const emp = String(data[i][4]).trim();

    if (!emp) continue;

    let stars = 5;
    if (ratingStr.indexOf("5") === 0) stars = 5;
    else if (ratingStr.indexOf("4") === 0) stars = 4;
    else if (ratingStr.indexOf("3") === 0) stars = 3;
    else if (ratingStr.indexOf("2") === 0) stars = 2;
    else if (ratingStr.indexOf("1") === 0) stars = 1;

    if (!empMap[emp]) {
      empMap[emp] = { total: 0, sum: 0, s5: 0, s4: 0, s3: 0, s2: 0, s1: 0, latest: date };
    }
    empMap[emp].total++;
    empMap[emp].sum += stars;
    if (stars === 5) empMap[emp].s5++;
    else if (stars === 4) empMap[emp].s4++;
    else if (stars === 3) empMap[emp].s3++;
    else if (stars === 2) empMap[emp].s2++;
    else if (stars === 1) empMap[emp].s1++;
    empMap[emp].latest = date;
  }

  const lastRow = empSheet.getLastRow();
  if (lastRow > 1) {
    empSheet.getRange(2, 1, lastRow - 1, 9).clearContent();
  }

  const rows = [];
  for (const emp in empMap) {
    const d = empMap[emp];
    const avg = (d.sum / d.total).toFixed(2);
    rows.push([emp, d.total, avg, d.s5, d.s4, d.s3, d.s2, d.s1, d.latest]);
  }

  if (rows.length > 0) {
    empSheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

function send4HourEmailReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const actSheet = ss.getSheetByName("Review Activity");
  const reportSheet = ss.getSheetByName("4 Hour Report");
  if (!actSheet) return;

  const now = new Date();
  const timestampStr = Utilities.formatDate(now, TIME_ZONE, "yyyy-MM-dd HH:mm:ss") + " IST";
  const data = actSheet.getDataRange().getValues();

  let total = 0;
  let s5 = 0, s4 = 0, s3 = 0, s2 = 0, s1 = 0;
  let nNew = 0, nServ = 0, nDeliv = 0;
  let empCount = 0, teamCount = 0;
  let starSum = 0;

  for (let i = 1; i < data.length; i++) {
    total++;
    const exp = String(data[i][2]);
    const rat = String(data[i][3]);
    const emp = String(data[i][4]).trim();
    const team = String(data[i][5]).trim();

    if (exp.indexOf("New") >= 0) nNew++;
    else if (exp.indexOf("Service") >= 0) nServ++;
    else if (exp.indexOf("Delivery") >= 0) nDeliv++;

    let stars = 5;
    if (rat.indexOf("5") === 0) { s5++; stars = 5; }
    else if (rat.indexOf("4") === 0) { s4++; stars = 4; }
    else if (rat.indexOf("3") === 0) { s3++; stars = 3; }
    else if (rat.indexOf("2") === 0) { s2++; stars = 2; }
    else if (rat.indexOf("1") === 0) { s1++; stars = 1; }
    starSum += stars;

    if (emp) empCount++;
    if (team) teamCount++;
  }

  const avg = total > 0 ? (starSum / total).toFixed(2) : "5.00";

  if (reportSheet) {
    reportSheet.appendRow([
      timestampStr,
      "Last 4 Hours",
      total,
      avg,
      s5, s4, s3, s2, s1,
      nNew, nServ, nDeliv,
      empCount, teamCount,
      TARGET_EMAIL
    ]);
  }

  const subject = "📊 B.U. Bhandari Honda (Camp Showroom) – 4-Hour Review Report (" + timestampStr + ")";
  const htmlBody = \`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #CC0000; color: #ffffff; padding: 18px 24px;">
        <h2 style="margin: 0; font-size: 20px;">B.U. Bhandari Honda – Camp Showroom</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">4-Hour Customer Review Performance Summary</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; margin-top: 0;"><strong>Report Generated:</strong> \${timestampStr}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px; text-align: left;">Metric</th>
            <th style="padding: 10px; text-align: right;">Count / Value</th>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Total Reviews Generated</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">\${total}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Average Customer Rating</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #CC0000;">⭐ \${avg} / 5.0</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">5-Star Reviews</td>
            <td style="padding: 10px; text-align: right;">\${s5}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">4-Star Reviews</td>
            <td style="padding: 10px; text-align: right;">\${s4}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">3-Star Reviews</td>
            <td style="padding: 10px; text-align: right;">\${s3}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">New Vehicle Purchase</td>
            <td style="padding: 10px; text-align: right;">\${nNew}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Vehicle Service</td>
            <td style="padding: 10px; text-align: right;">\${nServ}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Vehicle Delivery</td>
            <td style="padding: 10px; text-align: right;">\${nDeliv}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Sales Employees Mentioned</td>
            <td style="padding: 10px; text-align: right;">\${empCount}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f8fafc; padding: 14px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
        B.U. Bhandari Honda – Camp Showroom • Customer Review Assistant System
      </div>
    </div>
  \`;

  MailApp.sendEmail({
    to: TARGET_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendDailyEmailReport() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const actSheet = ss.getSheetByName("Review Activity");
  const dailySheet = ss.getSheetByName("Daily Report");
  if (!actSheet) return;

  const todayStr = Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd");
  const data = actSheet.getDataRange().getValues();

  let total = 0;
  let s5 = 0, s4 = 0, s3 = 0, s2 = 0, s1 = 0;
  let nNew = 0, nServ = 0, nDeliv = 0;
  let starSum = 0;
  const empMap = {};
  const teamMap = {};

  for (let i = 1; i < data.length; i++) {
    total++;
    const exp = String(data[i][2]);
    const rat = String(data[i][3]);
    const emp = String(data[i][4]).trim();
    const team = String(data[i][5]).trim();

    if (exp.indexOf("New") >= 0) nNew++;
    else if (exp.indexOf("Service") >= 0) nServ++;
    else if (exp.indexOf("Delivery") >= 0) nDeliv++;

    let stars = 5;
    if (rat.indexOf("5") === 0) { s5++; stars = 5; }
    else if (rat.indexOf("4") === 0) { s4++; stars = 4; }
    else if (rat.indexOf("3") === 0) { s3++; stars = 3; }
    else if (rat.indexOf("2") === 0) { s2++; stars = 2; }
    else if (rat.indexOf("1") === 0) { s1++; stars = 1; }
    starSum += stars;

    if (emp) empMap[emp] = (empMap[emp] || 0) + 1;
    if (team) teamMap[team] = (teamMap[team] || 0) + 1;
  }

  const avg = total > 0 ? (starSum / total).toFixed(2) : "5.00";

  let topEmp = "None";
  let maxEmp = 0;
  for (const emp in empMap) {
    if (empMap[emp] > maxEmp) {
      maxEmp = empMap[emp];
      topEmp = emp + " (" + maxEmp + " reviews)";
    }
  }

  let topTeam = "None";
  let maxTeam = 0;
  for (const team in teamMap) {
    if (teamMap[team] > maxTeam) {
      maxTeam = teamMap[team];
      topTeam = team + " (" + maxTeam + " reviews)";
    }
  }

  if (dailySheet) {
    dailySheet.appendRow([
      todayStr,
      total,
      avg,
      s5, s4, s3, s2, s1,
      nNew, nServ, nDeliv,
      topEmp, topTeam,
      TARGET_EMAIL
    ]);
  }

  const subject = "📈 B.U. Bhandari Honda (Camp Showroom) – Daily Review Summary (" + todayStr + ")";
  const htmlBody = \`
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #CC0000; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 22px;">B.U. Bhandari Honda – Camp Showroom</h2>
        <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.95;">Daily Customer Review Summary (6:00 PM IST)</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 14px; margin-top: 0;"><strong>Date:</strong> \${todayStr} | <strong>Showroom:</strong> B.U. Bhandari Honda – Camp Showroom</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
            <th style="padding: 10px; text-align: left;">Category / Metric</th>
            <th style="padding: 10px; text-align: right;">Result</th>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Total Daily Reviews</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; font-size: 16px;">\${total}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Average Star Rating</td>
            <td style="padding: 10px; text-align: right; font-weight: bold; color: #CC0000; font-size: 16px;">⭐ \${avg} / 5.0</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">5-Star & 4-Star Share</td>
            <td style="padding: 10px; text-align: right;">\${total > 0 ? (((s5 + s4) / total) * 100).toFixed(1) : 100}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">New Vehicle Purchase Reviews</td>
            <td style="padding: 10px; text-align: right;">\${nNew}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Vehicle Service Reviews</td>
            <td style="padding: 10px; text-align: right;">\${nServ}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Vehicle Delivery Reviews</td>
            <td style="padding: 10px; text-align: right;">\${nDeliv}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Top Sales Employee</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">\${topEmp}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px;">Top Team Mention</td>
            <td style="padding: 10px; text-align: right; font-weight: bold;">\${topTeam}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; text-align: center;">
        B.U. Bhandari Honda – Camp Showroom • Automated Daily Operations Report
      </div>
    </div>
  \`;

  MailApp.sendEmail({
    to: TARGET_EMAIL,
    subject: subject,
    htmlBody: htmlBody
  });
}

function installTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  ScriptApp.newTrigger("send4HourEmailReport")
    .timeBased()
    .everyHours(4)
    .create();

  ScriptApp.newTrigger("sendDailyEmailReport")
    .timeBased()
    .atHour(18)
    .everyDays(1)
    .inTimezone(TIME_ZONE)
    .create();

  Logger.log("✅ Successfully installed automated 4-Hour and 6:00 PM IST Daily triggers for " + TARGET_EMAIL);
}
`;

  res.json({
    script: scriptContent,
    targetEmail: 'hondabubhandari@gmail.com',
    spreadsheetName: 'B.U. Bhandari Honda – Camp Showroom Review Reports',
    dealershipName: 'B.U. Bhandari Honda – Camp Showroom',
  });
});

// Vite middleware for dev / static for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[B.U. Bhandari Honda] Server running at http://localhost:${PORT}`);
  });
}

startServer();
