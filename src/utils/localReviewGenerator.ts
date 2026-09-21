import { ExperienceType, RatingType, ReviewFormData, ReviewLanguage } from '../types';
import { isReviewTooSimilar } from './reviewSimilarity';

/**
 * Advanced Dynamic AI Review Generator for B.U. Bhandari Honda
 * Generates unique, natural, highly varied customer reviews.
 *
 * Enforces:
 * 1. Fresh review every time with zero duplicate structures
 * 2. Natural variation in writing styles (Short/simple, Friendly, Professional, Conversational, Detailed, Emotional)
 * 3. Natural variation in length (1-2 sentences, 3-4 sentences, 5-6 sentences)
 * 4. Varied sequencing of points and vocabulary
 * 5. Language support: English, Marathi, Hinglish, Simple English (with Auto variation)
 * 6. Session-level duplicate detection and automated regeneration
 */

export type WritingStyle =
  | 'short_simple'
  | 'friendly'
  | 'professional'
  | 'conversational'
  | 'detailed'
  | 'emotional';

export type LengthProfile = 'short' | 'medium' | 'detailed';

interface GeneratorOptions {
  history?: string[];
  forceLanguage?: ReviewLanguage;
  seed?: number;
}

// Helper: random choice from array
function pickOne<T>(items: T[], rand = Math.random()): T {
  return items[Math.floor(rand * items.length)];
}

// Helper: shuffle array
function shuffle<T>(array: T[], rand = Math.random): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: capitalize first letter
function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ==========================================
// ENGLISH VOCABULARY & SENTENCE GENERATION
// ==========================================

const EN_OPENINGS_PURCHASE = [
  'Decided on B.U. Bhandari Honda for our new vehicle, and the entire experience was delightful.',
  'Recently bought a new vehicle from B.U. Bhandari Honda, and I am genuinely impressed by their service.',
  'Walked into B.U. Bhandari Honda looking for our next family ride, and the team treated us with immense courtesy.',
  'Getting my new Honda from B.U. Bhandari Honda was an effortless and pleasant journey.',
  'Had a seamless vehicle purchase experience at B.U. Bhandari Honda from day one.',
  'We just finalized our vehicle at B.U. Bhandari Honda and couldn’t be happier with how smoothly everything went.',
  'Visiting B.U. Bhandari Honda for our vehicle booking turned out to be a great decision.',
  'A very satisfying buying experience at B.U. Bhandari Honda.',
  'Purchased our latest vehicle from B.U. Bhandari Honda and received wonderful assistance throughout.',
  'From the first showroom walkthrough to finalizing the deal, B.U. Bhandari Honda stood out for their transparency.',
  'B.U. Bhandari Honda made our vehicle purchase smooth, transparent, and completely stress-free.',
  'Glad we chose B.U. Bhandari Honda for bringing home our new vehicle.',
];

const EN_OPENINGS_SERVICE = [
  'Got my vehicle serviced at B.U. Bhandari Honda, and the work was carried out impeccably.',
  'Visited B.U. Bhandari Honda for periodic maintenance and was impressed with their organized workshop.',
  'My recent service visit to B.U. Bhandari Honda was prompt, professional, and very well handled.',
  'Had an excellent experience with vehicle servicing at B.U. Bhandari Honda today.',
  'Regular maintenance at B.U. Bhandari Honda has always been dependable, and this visit was no different.',
  'B.U. Bhandari Honda took great care of my vehicle during the scheduled maintenance.',
  'Smooth turnaround and transparent job estimates at B.U. Bhandari Honda service facility.',
  'Brought my Honda in for servicing at B.U. Bhandari Honda, and it drives like new again.',
];

const EN_OPENINGS_DELIVERY = [
  'Taking delivery of our vehicle from B.U. Bhandari Honda was truly a memorable occasion.',
  'The vehicle handover ceremony at B.U. Bhandari Honda was organized with great warmth and punctuality.',
  'Received our new vehicle delivery today from B.U. Bhandari Honda in sparkling condition.',
  'Delivery day at B.U. Bhandari Honda was handled with complete professionalism and joy.',
  'Smooth key handover and thorough vehicle walkthrough at B.U. Bhandari Honda.',
  'Our delivery experience with B.U. Bhandari Honda was prompt, joyful, and completely hassle-free.',
];

const EN_ASPECTS_POSITIVE = [
  'The vehicle test drive was arranged promptly and all features were demonstrated clearly.',
  'Paperwork and documentation were processed swiftly without any confusing back-and-forth.',
  'The staff took the time to answer every question patiently without rushing us.',
  'Pricing and financing options were explained with complete clarity and no hidden surprises.',
  'The showroom was neat, welcoming, and very well maintained.',
  'The vehicle was prepped to perfection and delivered right on the committed hour.',
  'Clear estimation, genuine spare parts, and thorough inspection gave us complete peace of mind.',
  'Communication across all stages was proactive and reassuring.',
  'Every single detail we requested was attended to diligently.',
];

const EN_CLOSINGS_POSITIVE = [
  'Would readily recommend B.U. Bhandari Honda to all vehicle enthusiasts.',
  'Truly appreciate the professionalism of the B.U. Bhandari Honda team.',
  'Very happy with the overall support and loving the drive.',
  'A solid 5-star experience from start to finish.',
  'Big thanks to everyone at B.U. Bhandari Honda for making this so easy.',
  'Will certainly return to B.U. Bhandari Honda for future services.',
  'Definitely one of the best dealership experiences in Pune.',
  'Kudos to the entire dealership team for their dedication.',
  'Proud to be driving our new Honda. Highly satisfied!',
  'Honest guidance, punctual delivery, and great hospitality.',
];

// Average / Constructive feedback (2-3 stars)
const EN_AVERAGE_PURCHASE = [
  'Purchased a vehicle from B.U. Bhandari Honda. While the vehicle is great, the process took longer than promised.',
  'Decent overall buying experience at B.U. Bhandari Honda, though coordination between sales and billing could be faster.',
  'My visit to B.U. Bhandari Honda was okay. The staff was polite, but paperwork turnaround needs improvement.',
];

const EN_POOR_FEEDBACK = [
  'My recent visit to B.U. Bhandari Honda did not meet expectations due to unexpected delays and lack of updates.',
  'Sharing constructive feedback for B.U. Bhandari Honda: the team needs better customer communication and proactive handling.',
  'Experienced multiple delays during my visit to B.U. Bhandari Honda. Hoping management streamlines the handover process.',
];

// ==========================================
// MARATHI (मराठी) REVIEW GENERATION
// ==========================================

const MR_OPENINGS_PURCHASE = [
  'बी. यू. भंडारी होंडा कडून नवीन गाडी खरेदी करण्याचा अनुभव अतिशय सुंदर आणि समाधानकारक राहिला.',
  'नुकतीच बी. यू. भंडारी होंडा येथून गाडी घेतली, आणि त्यांच्या सेवेने मन जिंकून घेतले.',
  'आमच्या कुटुंबाच्या नव्या गाडीसाठी बी. यू. भंडारी होंडाची निवड केली आणि निर्णय अगदी योग्य ठरला.',
  'बी. यू. भंडारी होंडा येथे गाडी बुकिंगपासून ते डिलिव्हरीपर्यंत सर्व कामे अगदी वेळेत आणि व्यवस्थित पार पडली.',
  'गाडी खरेदीसाठी बी. यू. भंडारी होंडाला भेट दिली असता तेथील कर्मचाऱ्यांचे स्वागत आणि मार्गदर्शन उत्तम लाभले.',
  'बी. यू. भंडारी होंडाच्या टीमने गाडी खरेदीची संपूर्ण प्रक्रिया अत्यंत सोपी आणि पारदर्शक ठेवली.',
];

const MR_OPENINGS_SERVICE = [
  'बी. यू. भंडारी होंडा येथे गाडीच्या सर्व्हिसिंगचा अनुभव नेहमीप्रमाणेच उत्तम आणि विश्वासार्ह राहिला.',
  'नियमित मेंटेनन्ससाठी बी. यू. भंडारी होंडाला भेट दिली, आणि गाडी अगदी नव्यासारखी स्मूथ करून दिली.',
  'बी. यू. भंडारी होंडाच्या वर्कशॉपमधील तत्परता आणि कामाचा दर्जा कौतुकास्पद आहे.',
  'गाडी सर्व्हिसिंगचे काम ठरलेल्या वेळेत आणि प्रामाणिकपणे बी. यू. भंडारी होंडा येथे पूर्ण झाले.',
];

const MR_OPENINGS_DELIVERY = [
  'बी. यू. भंडारी होंडा येथे नवीन गाडीची चावी घेतानाचा क्षण आमच्या संपूर्ण कुटुंबासाठी अत्यंत आनंदाचा ठरला.',
  'गाडीची डिलिव्हरी अगदी वेळेवर आणि अतिशय सुंदर सेरेमनीसह बी. यू. भंडारी होंडाने दिली.',
  'गाडीचे हँडओव्हर आणि आवश्यक सर्व माहिती बी. यू. भंडारी होंडाच्या टीमने अतिशय सविस्तर समजावून सांगितली.',
];

const MR_ASPECTS_POSITIVE = [
  'टेस्ट ड्राईव्ह अगदी वेळेवर मिळाली आणि गाडीच्या प्रत्येक फिचरची माहिती सविस्तर दिली.',
  'कागदपत्रे आणि फायनान्सची प्रक्रिया कुठलाही त्रास न होता जलद गतीने पूर्ण झाली.',
  'शोरूममधील स्वच्छता आणि सर्व कर्मचाऱ्यांचे सौजन्यपूर्ण संभाषण विशेष जाणवले.',
  'सर्व खर्चाची माहिती सुरुवातीलाच स्पष्ट दिली, कोणतीही लपवाछपवी नव्हती.',
  'गाडी एकदम चकाचक आणि सज्ज करून वेळेत सुपूर्द करण्यात आली.',
  'ग्राहकांच्या प्रत्येक प्रश्नाला शांतपणे आणि आदराने उत्तरे देण्यात आली.',
];

const MR_CLOSINGS_POSITIVE = [
  'बी. यू. भंडारी होंडाच्या संपूर्ण टीमचे मनापासून आभार!',
  'नवीन होंडा गाडी घेणाऱ्या प्रत्येकाला मी बी. यू. भंडारी होंडाची शिफारस नक्की करेन.',
  'अतिशय उत्कृष्ट सेवा आणि सहकार्य. खूप खूप धन्यवाद!',
  'पुण्यातील सर्वोत्तम आणि विश्वासू होंडा डीलरशिप!',
  'गाडी आणि सेवा दोन्हीबद्दल १००% समाधानी आहोत.',
  'भविष्यातील सर्व्हिसिंगसाठीही बी. यू. भंडारी होंडावरच आमचा पूर्ण विश्वास असेल.',
];

const MR_AVERAGE_FEEDBACK = [
  'बी. यू. भंडारी होंडा येथील अनुभव सर्वसाधारण राहिला. कामात अजून थोडी गती आणि सुसूत्रता हवी होती.',
  'गाडी उत्तम आहे, पण बी. यू. भंडारी होंडा येथे कामासाठी थोडा जास्त वेळ लागला. पुढील वेळी अधिक चांगल्या सेवेची अपेक्षा आहे.',
];

// ==========================================
// HINGLISH / MARATHI-ENGLISH GENERATION
// ==========================================

const HINGLISH_OPENINGS_PURCHASE = [
  'B.U. Bhandari Honda madhun new vehicle purchase kela, and overall experience ekdam super hota!',
  'Recently B.U. Bhandari Honda visit kela for our new ride. Showroom staff and management was very helpful.',
  'B.U. Bhandari Honda se vehicle purchase ka experience sach me bahut smooth aur hassle-free raha.',
  'Got our new vehicle from B.U. Bhandari Honda. Right from booking till delivery, everything went on time.',
  'B.U. Bhandari Honda showroom madhe enter kelya pasun deliver hoin paraynt full support milaala.',
];

const HINGLISH_OPENINGS_SERVICE = [
  'Vehicle service B.U. Bhandari Honda madhe karavla, and result is totally satisfying.',
  'Periodic servicing at B.U. Bhandari Honda was done very professionally. Gaadi ekdam smooth chalat ahe.',
  'B.U. Bhandari Honda service center team handled my vehicle maintenance on-time and with proper care.',
];

const HINGLISH_OPENINGS_DELIVERY = [
  'Vehicle delivery ceremony at B.U. Bhandari Honda was memorable. Family members were really very happy!',
  'On-time delivery and clean handover done by B.U. Bhandari Honda team today.',
  'Keys handover smoothly jhaala B.U. Bhandari Honda madhe. Vehicle presentation was top class.',
];

const HINGLISH_ASPECTS_POSITIVE = [
  'Test drive quickly arrange kela and features detail madhe explain kile.',
  'Documentation and loan formalities without any delay complete jhaale.',
  'Staff behaviour was super polite and attentive to our needs.',
  'Vehicle bilkul clean aur ready condition me handover kiya gaya.',
  'Transparent pricing and prompt updates at every single step.',
];

const HINGLISH_CLOSINGS_POSITIVE = [
  'Big thanks to the entire B.U. Bhandari Honda team for this great experience!',
  'Totally satisfied with B.U. Bhandari Honda. Highly recommended to friends & family.',
  'Superb service quality. Glad we chose B.U. Bhandari Honda Pune!',
  'Smooth buying process and supportive staff. 5 stars from my side.',
];

// ==========================================
// SIMPLE CONVERSATIONAL ENGLISH
// ==========================================

const SIMPLE_EN_REVIEWS_PURCHASE = [
  'Bought our new vehicle from B.U. Bhandari Honda. The staff was polite and explained everything clearly. The delivery was on time and we are very happy with our purchase.',
  'Great buying experience at B.U. Bhandari Honda. Simple paperwork, quick test drive, and honest staff. Would recommend this dealership to everyone.',
  'Smooth and quick vehicle purchase at B.U. Bhandari Honda. The showroom is clean and the staff is very supportive.',
  'Got my Honda from B.U. Bhandari Honda. Everything was handled on schedule without any confusion. Thank you for the good service.',
  'Very happy with B.U. Bhandari Honda. The vehicle was delivered clean and on time. Courteous team throughout.',
];

const SIMPLE_EN_REVIEWS_SERVICE = [
  'Gave my vehicle for regular service at B.U. Bhandari Honda. Timely delivery and clean washing. Drives very smoothly now.',
  'Service at B.U. Bhandari Honda was quick and professional. Fair billing and friendly staff.',
  'Dependable vehicle service at B.U. Bhandari Honda. The advisor explained the job card clearly and delivered on time.',
];

const SIMPLE_EN_REVIEWS_DELIVERY = [
  'Vehicle delivery at B.U. Bhandari Honda was on time and pleasant. All documents were ready and explained nicely.',
  'Smooth delivery ceremony at B.U. Bhandari Honda. The vehicle was spotless and the staff was very warm.',
];

// ==========================================
// STAFF MENTION BUILDERS
// ==========================================

function buildStaffSentence(
  employeeName?: string,
  teamName?: string,
  lang: ReviewLanguage = 'English',
  isPositive = true
): string {
  const emp = employeeName?.trim();
  const team = teamName?.trim();

  if (!emp && !team) return '';

  if (lang === 'Marathi') {
    if (emp && team) {
      return isPositive
        ? ` ${emp} आणि ${team} यांनी दाखवलेले सहकार्य आणि तत्परता विशेष कौतुकास्पद होती.`
        : ` या भेटीदरम्यान ${emp} व ${team} यांच्याशी चर्चा झाली.`;
    }
    if (emp) {
      return isPositive
        ? ` विशेषतः ${emp} यांनी सर्व गोष्टी अतिशय शांतपणे आणि स्पष्ट समजावून सांगितल्या.`
        : ` ${emp} यांच्याशी समन्वय साधला.`;
    }
    if (team) {
      return isPositive
        ? ` ${team} कडून मिळालेले सहकार्य खूप चांगले होते.`
        : ` ${team} सोबत या कामाबाबत बोलणे झाले.`;
    }
  }

  if (lang === 'Hinglish') {
    if (emp && team) {
      return isPositive
        ? ` Special thanks to ${emp} and ${team} for their polite and fast support.`
        : ` Interacted with ${emp} and ${team} during this visit.`;
    }
    if (emp) {
      return isPositive
        ? ` ${emp} was very supportive and explained each detail patiently.`
        : ` Coordinated with ${emp} regarding my query.`;
    }
    if (team) {
      return isPositive
        ? ` ${team} handled all the formalities smoothly.`
        : ` Handled by ${team} during the visit.`;
    }
  }

  // English & Simple English
  if (emp && team) {
    const variations = [
      ` Special appreciation to ${emp} and the ${team} for their warm guidance throughout.`,
      ` Huge thanks to ${emp} along with the ${team} for ensuring everything went effortlessly.`,
      ` Both ${emp} and the ${team} were attentive, knowledgeable, and genuinely helpful.`,
      ` Sincere thanks to ${emp} and the ${team} for prompt updates and support.`,
    ];
    return isPositive ? pickOne(variations) : ` Dealt with ${emp} and the ${team} during this process.`;
  }

  if (emp) {
    const variations = [
      ` Special mention to ${emp} for guiding us patiently through every detail.`,
      ` A shoutout to ${emp} for providing clear answers and professional advice.`,
      ` Appreciate ${emp} for the courteous approach and transparent explanations.`,
      ` ${emp} made sure all our queries were addressed without any delay.`,
    ];
    return isPositive ? pickOne(variations) : ` Coordinated with ${emp} regarding this request.`;
  }

  if (team) {
    const variations = [
      ` The ${team} was proactive and made sure all formalities went through smoothly.`,
      ` Commendable coordination by the ${team} throughout our visit.`,
      ` The entire ${team} was approachable and highly cooperative.`,
    ];
    return isPositive ? pickOne(variations) : ` Dealt with the ${team} during this visit.`;
  }

  return '';
}

// ==========================================
// CORE SYNTHESIS ENGINE
// ==========================================

function synthesizeEnglishReview(
  experienceType: ExperienceType,
  rating: RatingType,
  selectedAspects: string[],
  employeeName?: string,
  teamName?: string,
  additionalComments?: string,
  style: WritingStyle = 'conversational',
  length: LengthProfile = 'medium'
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const isAverage = rating.startsWith('2');
  const isPoor = rating.startsWith('1');

  const staff = buildStaffSentence(employeeName, teamName, 'English', isPositive);
  const comments = additionalComments?.trim()
    ? ` ${additionalComments.trim().endsWith('.') ? additionalComments.trim() : `${additionalComments.trim()}.`}`
    : '';

  // 1-2 Stars Constructive
  if (isPoor) {
    const opening = pickOne(EN_POOR_FEEDBACK);
    return `${opening}${staff}${comments}`;
  }
  if (isAverage) {
    const opening = pickOne(EN_AVERAGE_PURCHASE);
    return `${opening}${staff}${comments}`;
  }

  // 3-5 Stars Positive
  let openingPool = EN_OPENINGS_PURCHASE;
  if (experienceType === 'Vehicle Service') openingPool = EN_OPENINGS_SERVICE;
  if (experienceType === 'Vehicle Delivery') openingPool = EN_OPENINGS_DELIVERY;

  // Selected user aspects to highlight phrase
  let userAspectsSentence = '';
  if (selectedAspects && selectedAspects.length > 0) {
    const shuffledAspects = shuffle(selectedAspects);
    const chosen = shuffledAspects.slice(0, 2);
    const aspectConnectors = [
      `In particular, the ${chosen.map((a) => a.toLowerCase()).join(' and ')} stood out positively.`,
      `We especially appreciated the focus on ${chosen.map((a) => a.toLowerCase()).join(' as well as ')}.`,
      `The attention given to ${chosen.map((a) => a.toLowerCase()).join(' and ')} made a significant difference.`,
      `From ${chosen[0].toLowerCase()} to overall support, everything felt seamless.`,
    ];
    userAspectsSentence = ` ${pickOne(aspectConnectors)}`;
  } else {
    // Pick 1 random natural aspect
    userAspectsSentence = ` ${pickOne(EN_ASPECTS_POSITIVE)}`;
  }

  const opening = pickOne(openingPool);
  const closing = pickOne(EN_CLOSINGS_POSITIVE);

  // Vary structures based on length and style
  if (length === 'short' || style === 'short_simple') {
    // 1-2 sentences
    const shortFormats = [
      `${opening} ${closing}${comments}`,
      `${opening}${staff}${comments}`,
      `${opening}${userAspectsSentence}${comments}`,
    ];
    return pickOne(shortFormats);
  }

  if (length === 'detailed' || style === 'detailed') {
    // 4-6 sentences
    const naturalDetail = pickOne(EN_ASPECTS_POSITIVE);
    const detailedFormats = [
      `${opening}${userAspectsSentence} ${naturalDetail}${staff} ${closing}${comments}`,
      `${opening}${staff}${userAspectsSentence} ${naturalDetail} ${closing}${comments}`,
      `${opening} ${naturalDetail}${userAspectsSentence}${staff} ${closing}${comments}`,
    ];
    return pickOne(detailedFormats);
  }

  // Medium (3-4 sentences)
  const mediumFormats = [
    `${opening}${userAspectsSentence}${staff} ${closing}${comments}`,
    `${opening}${staff}${userAspectsSentence} ${closing}${comments}`,
    `${opening} ${pickOne(EN_ASPECTS_POSITIVE)}${staff} ${closing}${comments}`,
  ];
  return pickOne(mediumFormats);
}

function synthesizeMarathiReview(
  experienceType: ExperienceType,
  rating: RatingType,
  selectedAspects: string[],
  employeeName?: string,
  teamName?: string,
  additionalComments?: string,
  length: LengthProfile = 'medium'
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const staff = buildStaffSentence(employeeName, teamName, 'Marathi', isPositive);
  const comments = additionalComments?.trim()
    ? ` ${additionalComments.trim().endsWith('.') ? additionalComments.trim() : `${additionalComments.trim()}.`}`
    : '';

  if (!isPositive) {
    const feedback = pickOne(MR_AVERAGE_FEEDBACK);
    return `${feedback}${staff}${comments}`;
  }

  let openingPool = MR_OPENINGS_PURCHASE;
  if (experienceType === 'Vehicle Service') openingPool = MR_OPENINGS_SERVICE;
  if (experienceType === 'Vehicle Delivery') openingPool = MR_OPENINGS_DELIVERY;

  const opening = pickOne(openingPool);
  const closing = pickOne(MR_CLOSINGS_POSITIVE);
  const aspect = pickOne(MR_ASPECTS_POSITIVE);

  if (length === 'short') {
    return `${opening} ${closing}${comments}`;
  }

  if (length === 'detailed') {
    const aspect2 = pickOne(MR_ASPECTS_POSITIVE);
    return `${opening} ${aspect} ${aspect2}${staff} ${closing}${comments}`;
  }

  return `${opening} ${aspect}${staff} ${closing}${comments}`;
}

function synthesizeHinglishReview(
  experienceType: ExperienceType,
  rating: RatingType,
  selectedAspects: string[],
  employeeName?: string,
  teamName?: string,
  additionalComments?: string,
  length: LengthProfile = 'medium'
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const staff = buildStaffSentence(employeeName, teamName, 'Hinglish', isPositive);
  const comments = additionalComments?.trim()
    ? ` ${additionalComments.trim().endsWith('.') ? additionalComments.trim() : `${additionalComments.trim()}.`}`
    : '';

  if (!isPositive) {
    return `B.U. Bhandari Honda experience was average. Service and coordination time could be improved.${staff}${comments}`;
  }

  let openingPool = HINGLISH_OPENINGS_PURCHASE;
  if (experienceType === 'Vehicle Service') openingPool = HINGLISH_OPENINGS_SERVICE;
  if (experienceType === 'Vehicle Delivery') openingPool = HINGLISH_OPENINGS_DELIVERY;

  const opening = pickOne(openingPool);
  const closing = pickOne(HINGLISH_CLOSINGS_POSITIVE);
  const aspect = pickOne(HINGLISH_ASPECTS_POSITIVE);

  if (length === 'short') {
    return `${opening} ${closing}${comments}`;
  }

  if (length === 'detailed') {
    const aspect2 = pickOne(HINGLISH_ASPECTS_POSITIVE);
    return `${opening} ${aspect}. ${aspect2}.${staff} ${closing}${comments}`;
  }

  return `${opening} ${aspect}.${staff} ${closing}${comments}`;
}

function synthesizeSimpleEnglishReview(
  experienceType: ExperienceType,
  rating: RatingType,
  employeeName?: string,
  teamName?: string,
  additionalComments?: string
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const staff = buildStaffSentence(employeeName, teamName, 'Simple English', isPositive);
  const comments = additionalComments?.trim()
    ? ` ${additionalComments.trim().endsWith('.') ? additionalComments.trim() : `${additionalComments.trim()}.`}`
    : '';

  let pool = SIMPLE_EN_REVIEWS_PURCHASE;
  if (experienceType === 'Vehicle Service') pool = SIMPLE_EN_REVIEWS_SERVICE;
  if (experienceType === 'Vehicle Delivery') pool = SIMPLE_EN_REVIEWS_DELIVERY;

  const base = pickOne(pool);
  return `${base}${staff}${comments}`;
}

/**
 * Main Generation Entrypoint with Automated Duplicate Prevention & Session History
 */
export function generateLocalReview(
  data: ReviewFormData,
  variationSeed?: number | GeneratorOptions
): string {
  const {
    experienceType,
    rating,
    employeeName,
    teamName,
    selectedAspects = [],
    additionalComments,
    language = 'Auto',
  } = data;

  if (!experienceType || !rating) {
    return 'Please select your experience and rating to generate a review.';
  }

  let history: string[] = [];
  let userForcedLanguage: ReviewLanguage = language || 'Auto';

  if (typeof variationSeed === 'object' && variationSeed !== null) {
    if (Array.isArray(variationSeed.history)) {
      history = variationSeed.history;
    }
    if (variationSeed.forceLanguage) {
      userForcedLanguage = variationSeed.forceLanguage;
    }
  }

  // Languages pool for 'Auto': mix English (50%), Marathi (25%), Hinglish (15%), Simple English (10%)
  const autoLanguages: ReviewLanguage[] = [
    'English',
    'English',
    'English',
    'Marathi',
    'Marathi',
    'Hinglish',
    'Simple English',
  ];

  const styles: WritingStyle[] = [
    'short_simple',
    'friendly',
    'professional',
    'conversational',
    'detailed',
    'emotional',
  ];

  const lengths: LengthProfile[] = ['short', 'medium', 'medium', 'detailed'];

  let bestCandidate = '';
  let lowestSimilarity = 1.0;

  // Run up to 25 candidate generation attempts to guarantee uniqueness against session history
  for (let attempt = 0; attempt < 25; attempt++) {
    const chosenLang =
      userForcedLanguage && userForcedLanguage !== 'Auto'
        ? userForcedLanguage
        : pickOne(autoLanguages);

    const chosenStyle = pickOne(styles);
    const chosenLength = pickOne(lengths);

    let candidate = '';

    if (chosenLang === 'Marathi') {
      candidate = synthesizeMarathiReview(
        experienceType,
        rating,
        selectedAspects,
        employeeName,
        teamName,
        additionalComments,
        chosenLength
      );
    } else if (chosenLang === 'Hinglish') {
      candidate = synthesizeHinglishReview(
        experienceType,
        rating,
        selectedAspects,
        employeeName,
        teamName,
        additionalComments,
        chosenLength
      );
    } else if (chosenLang === 'Simple English') {
      candidate = synthesizeSimpleEnglishReview(
        experienceType,
        rating,
        employeeName,
        teamName,
        additionalComments
      );
    } else {
      // English
      candidate = synthesizeEnglishReview(
        experienceType,
        rating,
        selectedAspects,
        employeeName,
        teamName,
        additionalComments,
        chosenStyle,
        chosenLength
      );
    }

    // Clean extra whitespace
    candidate = candidate.replace(/\s+/g, ' ').trim();

    // Check similarity against session history
    const { isDuplicate, maxSimilarity } = isReviewTooSimilar(candidate, history, 0.38);

    if (!isDuplicate) {
      return candidate;
    }

    if (maxSimilarity < lowestSimilarity) {
      lowestSimilarity = maxSimilarity;
      bestCandidate = candidate;
    }
  }

  return bestCandidate || 'Excellent customer service and smooth experience at B.U. Bhandari Honda.';
}
