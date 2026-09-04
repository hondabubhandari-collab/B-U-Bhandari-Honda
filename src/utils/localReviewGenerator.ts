import { ExperienceType, RatingType, ReviewFormData } from '../types';

/**
 * Local Review Generator for B.U. Bhandari Honda – Camp Showroom
 * Generates genuine, natural customer reviews specifically for B.U. Bhandari Honda Camp Showroom.
 * - Mentions "B.U. Bhandari Honda – Camp Showroom" / "B.U. Bhandari Honda Camp Showroom" naturally.
 * - Naturally includes Sales/Service Employee Name and Team Name when provided.
 * - Matches the selected star rating accurately.
 */

function getVariationIndex(seedString: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

export function generateLocalReview(data: ReviewFormData, variationSeed?: number): string {
  const {
    experienceType,
    rating,
    employeeName,
    teamName,
    selectedAspects,
    additionalComments,
  } = data;

  if (!experienceType || !rating) {
    return 'Please select your experience and rating to generate a review.';
  }

  const cleanEmployee = employeeName?.trim();
  const cleanTeam = teamName?.trim();
  const cleanComments = additionalComments?.trim();

  // Combine aspects into a natural phrase
  const aspectsList = Array.isArray(selectedAspects) ? selectedAspects : [];
  let aspectsPhrase = '';
  if (aspectsList.length === 1) {
    aspectsPhrase = aspectsList[0].toLowerCase();
  } else if (aspectsList.length === 2) {
    aspectsPhrase = `${aspectsList[0].toLowerCase()} and ${aspectsList[1].toLowerCase()}`;
  } else if (aspectsList.length > 2) {
    const last = aspectsList[aspectsList.length - 1].toLowerCase();
    const rest = aspectsList.slice(0, -1).map((a) => a.toLowerCase()).join(', ');
    aspectsPhrase = `${rest}, and ${last}`;
  }

  // Determine sentiment level from RatingType
  const is5Star = rating.startsWith('5');
  const is4Star = rating.startsWith('4');
  const is3Star = rating.startsWith('3');
  const is2Star = rating.startsWith('2');
  const is1Star = rating.startsWith('1');
  const isPositive = is5Star || is4Star || is3Star;

  // Staff / Team sentence builder (ONLY if explicitly provided)
  let staffSentence = '';
  if (cleanEmployee && cleanTeam) {
    if (isPositive) {
      staffSentence = ` Special thanks to ${cleanEmployee} and the ${cleanTeam} for their attentive support and guidance.`;
    } else {
      staffSentence = ` Interacted with ${cleanEmployee} and the ${cleanTeam} during this visit.`;
    }
  } else if (cleanEmployee) {
    if (isPositive) {
      staffSentence = ` Special mention to ${cleanEmployee} for explaining everything clearly and assisting so well.`;
    } else {
      staffSentence = ` Coordinated with ${cleanEmployee} regarding my request.`;
    }
  } else if (cleanTeam) {
    if (isPositive) {
      staffSentence = ` The ${cleanTeam} was cooperative and helped answer all questions.`;
    } else {
      staffSentence = ` Dealt with the ${cleanTeam} during my visit.`;
    }
  }

  // Additional comments integration
  let commentsSentence = '';
  if (cleanComments) {
    const formattedComment = cleanComments.endsWith('.') ? cleanComments : `${cleanComments}.`;
    commentsSentence = ` ${formattedComment}`;
  }

  const seed =
    variationSeed !== undefined
      ? variationSeed
      : getVariationIndex(
          `${experienceType}-${rating}-${cleanEmployee}-${cleanTeam}-${aspectsList.join('-')}-${Date.now() % 100}`,
          20
        );

  if (experienceType === 'New Vehicle Purchase') {
    return buildNewVehicleReview(rating, aspectsPhrase, staffSentence, commentsSentence, seed);
  } else if (experienceType === 'Vehicle Service') {
    return buildVehicleServiceReview(rating, aspectsPhrase, staffSentence, commentsSentence, seed);
  } else {
    return buildVehicleDeliveryReview(rating, aspectsPhrase, staffSentence, commentsSentence, seed);
  }
}

function buildNewVehicleReview(
  rating: RatingType,
  aspects: string,
  staff: string,
  comments: string,
  seed: number
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const isAverage = rating.startsWith('2');

  if (isPositive) {
    const templates = [
      `I had a fantastic experience purchasing my vehicle from B.U. Bhandari Honda.${aspects ? ` The ${aspects} made the entire buying process effortless.` : ''}${staff} Truly impressed with their customer service and transparent guidance.${comments}`,
      `Buying a vehicle at B.U. Bhandari Honda was an absolute pleasure.${aspects ? ` Appreciated the ${aspects} throughout the visit.` : ''}${staff} Highly recommend this dealership to anyone planning to purchase a Honda.${comments}`,
      `Visited B.U. Bhandari Honda for buying a Honda and received wonderful assistance.${aspects ? ` Everything from ${aspects} was handled with great care.` : ''}${staff} Very satisfied with the overall sales experience!${comments}`,
      `My new vehicle purchase at B.U. Bhandari Honda went very smoothly.${aspects ? ` The team ensured ${aspects}.` : ''}${staff} A dependable dealership with great professionalism.${comments}`,
      `Purchased my vehicle from B.U. Bhandari Honda. The customer service was top-notch.${aspects ? ` Really valued the ${aspects}.` : ''}${staff} Glad I chose B.U. Bhandari Honda.${comments}`,
      `Great buying experience at B.U. Bhandari Honda.${aspects ? ` The ${aspects} stood out during my purchase journey.` : ''}${staff} Transparent dealing, smooth test drive, and very courteous staff.${comments}`,
      `Had a seamless experience acquiring my new vehicle at B.U. Bhandari Honda.${aspects ? ` The focus on ${aspects} was evident.` : ''}${staff} Thank you for making my purchase so memorable.${comments}`,
      `B.U. Bhandari Honda provides a wonderful environment for buying a new vehicle.${aspects ? ` We noticed ${aspects} right from day one.` : ''}${staff} Great work by the showroom team.${comments}`,
      `Very pleased with our new vehicle purchase from B.U. Bhandari Honda.${aspects ? ` The ${aspects} made the decision easy and hassle-free.` : ''}${staff} Would definitely recommend this dealership to friends and family.${comments}`,
      `Exceptional customer service at B.U. Bhandari Honda while buying my vehicle.${aspects ? ` They took care of ${aspects} without any delays.` : ''}${staff} Happy with our new vehicle!${comments}`,
    ];
    return templates[seed % templates.length];
  } else if (isAverage) {
    const templates = [
      `Purchased a vehicle at B.U. Bhandari Honda. The overall buying process was average.${aspects ? ` While there was some focus on ${aspects}, there is room for improvement.` : ''}${staff} Expecting better communication in the future.${comments}`,
      `My vehicle purchase at B.U. Bhandari Honda was an okay experience.${aspects ? ` Experience with ${aspects} was moderate.` : ''}${staff} The showroom could streamline certain steps to make it smoother for customers.${comments}`,
      `Visited B.U. Bhandari Honda for a vehicle purchase. The purchase was completed decently, but the turnaround time could be improved.${aspects ? ` ${aspects} was satisfactory.` : ''}${staff}${comments}`,
    ];
    return templates[seed % templates.length];
  } else {
    // 1 Star / Needs Improvement
    const templates = [
      `Purchased a vehicle at B.U. Bhandari Honda. The overall sales experience needs improvement.${aspects ? ` Areas concerning ${aspects} require better coordination.` : ''}${staff} Sharing this feedback so the dealership can enhance their customer service.${comments}`,
      `My recent buying experience at B.U. Bhandari Honda did not meet my expectations.${aspects ? ` Facing delays with ${aspects} was inconvenient.` : ''}${staff} Hope management addresses these operational aspects.${comments}`,
      `Sharing feedback regarding my vehicle purchase at B.U. Bhandari Honda.${aspects ? ` The process around ${aspects} could be managed much better.` : ''}${staff} Hoping for proactive improvement in customer handling.${comments}`,
    ];
    return templates[seed % templates.length];
  }
}

function buildVehicleServiceReview(
  rating: RatingType,
  aspects: string,
  staff: string,
  comments: string,
  seed: number
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const isAverage = rating.startsWith('2');

  if (isPositive) {
    const templates = [
      `I had a great vehicle service experience at B.U. Bhandari Honda.${aspects ? ` The ${aspects} ensured my vehicle runs smoothly.` : ''}${staff} Prompt and dependable after-sales service.${comments}`,
      `My periodic service at B.U. Bhandari Honda was carried out smoothly.${aspects ? ` Appreciated the ${aspects} and on-time vehicle handover.` : ''}${staff} Very satisfied with the workshop quality.${comments}`,
      `Got my vehicle serviced at B.U. Bhandari Honda.${aspects ? ` The ${aspects} was done thoroughly.` : ''}${staff} Vehicle performance has noticeably improved post-service.${comments}`,
      `Regular maintenance at B.U. Bhandari Honda has always been a positive experience.${aspects ? ` Impressed by the ${aspects}.` : ''}${staff} Honest advice, genuine parts, and proper attention to details.${comments}`,
      `Excellent service support at B.U. Bhandari Honda.${aspects ? ` The team took good care of ${aspects}.` : ''}${staff} Vehicle was washed and delivered in great condition on time.${comments}`,
      `Timely and efficient vehicle service at B.U. Bhandari Honda.${aspects ? ` The ${aspects} was handled very professionally.` : ''}${staff} Highly recommend for Honda servicing.${comments}`,
      `Had my vehicle serviced at B.U. Bhandari Honda. The ride quality is super smooth now.${aspects ? ` Glad to see the emphasis on ${aspects}.` : ''}${staff} Reliable service advisors and technicians.${comments}`,
      `Very pleased with the periodic maintenance at B.U. Bhandari Honda.${aspects ? ` The ${aspects} made the visit hassle-free.` : ''}${staff} Good transparency in job card and billing.${comments}`,
      `B.U. Bhandari Honda delivered great after-sales service quality today.${aspects ? ` Appreciate the focus on ${aspects}.` : ''}${staff} Smooth running and well maintained.${comments}`,
      `Professional vehicle service at B.U. Bhandari Honda.${aspects ? ` Everything regarding ${aspects} was explained clearly before work began.` : ''}${staff} Will return for future servicing.${comments}`,
    ];
    return templates[seed % templates.length];
  } else if (isAverage) {
    const templates = [
      `Got my vehicle serviced at B.U. Bhandari Honda. The overall service was average.${aspects ? ` While ${aspects} was handled okay, the waiting time could be reduced.` : ''}${staff}${comments}`,
      `My periodic service visit to B.U. Bhandari Honda was satisfactory but had scope for improvement.${aspects ? ` Work on ${aspects} was acceptable.` : ''}${staff} Hoping for faster turnaround next time.${comments}`,
      `Vehicle service at B.U. Bhandari Honda was moderate.${aspects ? ` Attention to ${aspects} was average.` : ''}${staff} The workshop could improve promptness in communication.${comments}`,
    ];
    return templates[seed % templates.length];
  } else {
    // 1 Star / Needs Improvement
    const templates = [
      `My recent service visit to B.U. Bhandari Honda needs improvement.${aspects ? ` Issues around ${aspects} were not resolved satisfactorily.` : ''}${staff} Providing this feedback so the service department can improve quality control.${comments}`,
      `Had an unsatisfactory service experience at B.U. Bhandari Honda.${aspects ? ` Delays and lack of attention to ${aspects} need management review.` : ''}${staff} Expecting better resolution for customer concerns.${comments}`,
      `Feedback regarding vehicle service at B.U. Bhandari Honda.${aspects ? ` Handling of ${aspects} was below expectations.` : ''}${staff} Hope the service department takes corrective steps.${comments}`,
    ];
    return templates[seed % templates.length];
  }
}

function buildVehicleDeliveryReview(
  rating: RatingType,
  aspects: string,
  staff: string,
  comments: string,
  seed: number
): string {
  const isPositive = rating.startsWith('5') || rating.startsWith('4') || rating.startsWith('3');
  const isAverage = rating.startsWith('2');

  if (isPositive) {
    const templates = [
      `Delighted with the vehicle delivery at B.U. Bhandari Honda!${aspects ? ` The ${aspects} made the key handover truly memorable.` : ''}${staff} A warm and welcoming showroom team.${comments}`,
      `Taking delivery of my new vehicle from B.U. Bhandari Honda was an awesome experience.${aspects ? ` Appreciated the ${aspects} and detailed walkthrough.` : ''}${staff} Thank you for making our delivery day special.${comments}`,
      `Punctual and joyful delivery at B.U. Bhandari Honda.${aspects ? ` The ${aspects} made the handover ceremony smooth and pleasant.` : ''}${staff} Proud owner of a new Honda!${comments}`,
      `Received our new vehicle delivery right on the promised time from B.U. Bhandari Honda.${aspects ? ` Great care was taken with ${aspects}.` : ''}${staff} Everything was explained clearly before driving off.${comments}`,
      `The delivery and handover at B.U. Bhandari Honda was seamless and very well organized.${aspects ? ` We loved the ${aspects}.` : ''}${staff} Highly satisfied with their professionalism and courteous approach.${comments}`,
      `Wonderful delivery ceremony at B.U. Bhandari Honda.${aspects ? ` The ${aspects} added a special touch to the entire celebration.` : ''}${staff} The vehicle was in pristine condition.${comments}`,
      `Smooth key handover and vehicle documentation at B.U. Bhandari Honda.${aspects ? ` Appreciated the ${aspects}.` : ''}${staff} The team ensured everything was ready without any waiting.${comments}`,
      `Had a memorable delivery experience for our vehicle at B.U. Bhandari Honda.${aspects ? ` The ${aspects} made us feel truly valued.` : ''}${staff} Keep up the great customer care!${comments}`,
      `Very happy with the delivery process at B.U. Bhandari Honda.${aspects ? ` All details regarding ${aspects} were handled with precision.` : ''}${staff} Vehicle was sparkling clean and ready to go.${comments}`,
      `Excellent delivery day experience at B.U. Bhandari Honda.${aspects ? ` The ${aspects} made it a joyful moment for our family.` : ''}${staff} Thank you to the entire staff.${comments}`,
    ];
    return templates[seed % templates.length];
  } else if (isAverage) {
    const templates = [
      `Vehicle delivery at B.U. Bhandari Honda was average.${aspects ? ` While ${aspects} was okay, there was some unexpected waiting time before handover.` : ''}${staff}${comments}`,
      `Took delivery of our vehicle at B.U. Bhandari Honda. The handover was decent.${aspects ? ` Experience with ${aspects} was satisfactory.` : ''}${staff} Process could be streamlined further.${comments}`,
      `Delivery experience at B.U. Bhandari Honda was moderate.${aspects ? ` Handover of ${aspects} was okay.` : ''}${staff} Better vehicle readiness prior to customer arrival would help.${comments}`,
    ];
    return templates[seed % templates.length];
  } else {
    // 1 Star / Needs Improvement
    const templates = [
      `Delivery experience at B.U. Bhandari Honda needs improvement.${aspects ? ` Handover regarding ${aspects} took longer than committed.` : ''}${staff} Sharing this feedback to help the showroom improve delivery coordination.${comments}`,
      `Faced delays during my new vehicle delivery at B.U. Bhandari Honda.${aspects ? ` Issues with ${aspects} caused unnecessary waiting.` : ''}${staff} Hoping the team improves vehicle readiness on delivery day.${comments}`,
      `Feedback on vehicle delivery at B.U. Bhandari Honda.${aspects ? ` The process surrounding ${aspects} was unorganized.` : ''}${staff} Expecting better punctuality and communication from the team.${comments}`,
    ];
    return templates[seed % templates.length];
  }
}
