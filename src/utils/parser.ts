export interface ParsedTaskResult {
  rawText: string;
  taskTitle: string;
  timeString: string;
  targetTimeFormatted: string;
  triggerTimeFormatted: string;
  targetDate: Date;
  triggerDate: Date;
  assignee: string;
  method: 'call' | 'notification';
  category: 'medication' | 'shopping' | 'chore' | 'general';
}

const TAMIL_NUMBER_MAP: Record<string, number> = {
  'ஒன்று': 1, 'ஒன்னு': 1, 'ஒரு': 1,
  'இரண்டு': 2, 'ரெண்டு': 2,
  'மூன்று': 3, 'மூணு': 3,
  'நான்கு': 4, 'நாலு': 4,
  'ஐந்து': 5, 'அஞ்சு': 5,
  'ஆறு': 6,
  'ஏழு': 7,
  'எட்டு': 8,
  'ஒன்பது': 9, 'ஒம்போது': 9,
  'பத்து': 10,
  'பதினொன்று': 11, 'பதினொன்னு': 11,
  'பன்னிரண்டு': 12, 'பன்னிரெண்டு': 12
};

/**
 * Programmatically extracts time value, descriptive chore text,
 * category, assignee, and computes trigger times in English & Tamil.
 * Assigning to oneself (defaultAssignee) is the FIRST PREFERENCE.
 */
export function parseVoiceChore(input: string, defaultAssignee: string = 'Myself'): ParsedTaskResult {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. Detect Assignee (First preference: Myself)
  let assignee = defaultAssignee;

  if (/\b(dad|father|appa)\b/i.test(trimmed) || /அப்பா|தந்தை/i.test(trimmed)) {
    assignee = 'Alexander';
  } else if (/\b(mom|mother|amma)\b/i.test(trimmed) || /அம்மா|தாய்/i.test(trimmed)) {
    assignee = 'Priya';
  } else if (/\b(leo)\b/i.test(trimmed) || /லியோ|தம்பி|மகன்/i.test(trimmed)) {
    assignee = 'Leo';
  } else if (/\b(everyone|all|whole family)\b/i.test(trimmed) || /அனைவரும்|எல்லோரும்|குடும்பம்|அனைவருக்கும்/i.test(trimmed)) {
    assignee = 'Everyone';
  } else if (/\b(me|myself|i|self)\b/i.test(lower) || /எனக்கு|நான்|என்/i.test(trimmed)) {
    assignee = defaultAssignee;
  }

  // 2. Detect Method: Strictly Telegram Voice Call or Push Notification
  let method: 'call' | 'notification' = 'call';
  if (/\b(push|notification|notify|alert|மெசேஜ்|அறிவிப்பு)\b/i.test(trimmed)) {
    method = 'notification';
  } else {
    method = 'call'; // default to Telegram voice call
  }

  // 3. Detect Category (Medication, Shopping, Chore, General)
  let category: 'medication' | 'shopping' | 'chore' | 'general' = 'chore';
  if (/\b(tablet|pill|medicine|bp|vitamins|doctor|hospital|dose|sugar|insulin)\b/i.test(lower) ||
      /மாத்திரை|மருந்து|டேப்லெட்|பிபி|வைட்டமின்|மருத்துவ|சுகர்|இன்சுலின்/i.test(trimmed)) {
    category = 'medication';
  } else if (/\b(grocery|buy|shop|market|milk|vegetables|fruits|store|provisions)\b/i.test(lower) ||
             /வாங்கு|கடை|மளிகை|பால்|காய்கறி|பழங்கள்|பொருட்கள்|காய்கறிகள்/i.test(trimmed)) {
    category = 'shopping';
  } else if (/\b(clean|water|plants|lock|door|trash|wash|cook|fold|iron)\b/i.test(lower) ||
             /செடி|தண்ணீர்|சுத்தம்|பூட்டு|சலவை|கதவு|சமையல்|துணி/i.test(trimmed)) {
    category = 'chore';
  }

  // 4. Detect Time Patterns (Standard 12/24h & Tamil text patterns including colloquial terms)
  const timeRegex24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
  const timeRegex12 = /\b([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm)\b/i;
  // Tamil: "மாலை 5 மணிக்கு", "சாயங்காலம் 6:00", "காலையில 8 மணி", "மதியம் 1 மணிக்கு", "ராத்திரி 9"
  const tamilTimeRegex = /(காலை|காலையில|முற்பகல்|மதியம்|மத்யானம்|மாலை|சாயங்காலம்|சாயந்திரம்|இரவு|ராத்திரி)\s*(\d{1,2}|[^\s]+)\s*(?:மணி|:)?\s*(\d{2})?\s*(?:மணிக்கு|மணியளவில்|மணி)?/i;

  let hours = 17;
  let minutes = 30;
  let foundTimeString = '5:30 PM';

  const match24 = lower.match(timeRegex24);
  const match12 = lower.match(timeRegex12);
  const matchTamil = trimmed.match(tamilTimeRegex);

  if (matchTamil) {
    const period = matchTamil[1];
    let numStr = matchTamil[2];
    const minStr = matchTamil[3];

    let h = parseInt(numStr, 10);
    if (isNaN(h) && TAMIL_NUMBER_MAP[numStr]) {
      h = TAMIL_NUMBER_MAP[numStr];
    }
    if (isNaN(h)) h = 5;

    let m = minStr ? parseInt(minStr, 10) : 0;
    if (isNaN(m)) m = 0;

    const isEveningOrNight = /மாலை|சாயங்காலம்|சாயந்திரம்|இரவு|ராத்திரி|மதியம்|மத்யானம்/.test(period);
    if (isEveningOrNight && h < 12) h += 12;
    if ((/காலை|காலையில|முற்பகல்/.test(period)) && h === 12) h = 0;

    hours = h;
    minutes = m;
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const meridiem = h >= 12 ? 'PM' : 'AM';
    foundTimeString = `${displayH}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
  } else if (match24) {
    hours = parseInt(match24[1], 10);
    minutes = parseInt(match24[2], 10);
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    const meridiem = hours >= 12 ? 'PM' : 'AM';
    foundTimeString = `${displayH}:${minutes.toString().padStart(2, '0')} ${meridiem}`;
  } else if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridiem = match12[3].toLowerCase();
    if (meridiem === 'pm' && h < 12) h += 12;
    if (meridiem === 'am' && h === 12) h = 0;
    hours = h;
    minutes = m;
    const displayH = h % 12 === 0 ? 12 : h % 12;
    foundTimeString = `${displayH}:${minutes.toString().padStart(2, '0')} ${meridiem.toUpperCase()}`;
  }

  // Target Date calculation
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setHours(hours, minutes, 0, 0);
  if (targetDate.getTime() <= now.getTime()) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const triggerDate = new Date(targetDate.getTime() - 5 * 60 * 1000);

  const formatHHMM = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  const targetTimeFormatted = formatHHMM(targetDate);
  const triggerTimeFormatted = formatHHMM(triggerDate);

  // Clean Task Title
  let taskTitle = trimmed;
  // English cleaning
  taskTitle = taskTitle.replace(/^(please\s+)?remind\s+(me|us|[a-z]+)\s+(at\s+[\d:apm\s]+)?to\s+/i, '');
  taskTitle = taskTitle.replace(/^(please\s+)?assign\s+['"]?([^'"]+)['"]?\s+to\s+[a-z]+/i, '$2');
  taskTitle = taskTitle.replace(/^(please\s+)?create\s+(a\s+)?reminder\s+to\s+/i, '');
  taskTitle = taskTitle.replace(/\s+via\s+(sip\s+call|telegram\s+call|notification).*$/i, '');
  taskTitle = taskTitle.replace(/\s+at\s+([01]?\d|2[0-3]):([0-5]\d).*$/i, '');
  taskTitle = taskTitle.replace(/\s+at\s+([1-9]|1[0-2])(?::([0-5]\d))?\s*(am|pm).*$/i, '');

  // Tamil cleaning: remove time phrases and reminder directives
  taskTitle = taskTitle.replace(/(காலை|காலையில|முற்பகல்|மதியம்|மத்யானம்|மாலை|சாயங்காலம்|சாயந்திரம்|இரவு|ராத்திரி)\s*(\d{1,2}|[^\s]+)\s*(?:மணி|:)?\s*(\d{2})?\s*(?:மணிக்கு|மணியளவில்|மணி)?/g, '');
  taskTitle = taskTitle.replace(/(எனக்கு|அப்பாவுக்கு|அம்மாவுக்கு|லியோவுக்கு)\s*/g, '');
  taskTitle = taskTitle.replace(/ஞாபகப்படுத்துங்கள்|ஞாபகப்படுத்து|நினைவூட்டு|வேண்டும்|செய்யவும்|சொல்லுங்க/g, '');
  taskTitle = taskTitle.trim();

  if (!taskTitle) {
    taskTitle = category === 'medication' ? 'Medicine Tablet' : category === 'shopping' ? 'Grocery Shopping' : 'Personal Family Task';
  } else {
    taskTitle = taskTitle.charAt(0).toUpperCase() + taskTitle.slice(1);
  }

  return {
    rawText: trimmed,
    taskTitle,
    timeString: foundTimeString,
    targetTimeFormatted,
    triggerTimeFormatted,
    targetDate,
    triggerDate,
    assignee,
    method,
    category
  };
}
