import { Language } from './types';

export interface Translations {
  appName: string;
  goodMorning: string;
  familyName: string;
  runningSmoothly: string;
  speakTask: string;
  speakPrompt: string;
  todaysReminders: string;
  viewAll: string;
  familySpace: string;
  momsBirthday: string;
  inDaysSaturday: string;
  cardBtn: string;
  giftIdeasBtn: string;
  secureVault: string;
  sharedDocsUpdated: string;
  wifiPass: string;
  travelIns: string;
  addNew: string;
  
  // Navigation
  navHome: string;
  navShared: string;
  navSpeak: string;
  navVault: string;
  navSos: string;
  
  // Document Vault
  securityActive: string;
  encryptedNotice: string;
  vaultTitle: string;
  vaultSubtitle: string;
  scanDocument: string;
  uploadFile: string;
  recentDocuments: string;
  itemsCount: string;
  changePassphrase: string;
  passphraseNotice: string;
  
  // SOS
  criticalAlert: string;
  sosHeadline: string;
  sosProtocolTitle: string;
  sosProtocolDesc: string;
  call911: string;
  medicalId: string;
  sosTriggered: string;
  
  // Shared / Events
  anniversaryTitle: string;
  anniversarySub: string;
  sendToast: string;
  viewMemories: string;
  upcomingMilestones: string;
  celebratingLife: string;
  seeCalendar: string;
  quickSyncReminders: string;
  addSharedReminder: string;
  everyDayGift: string;
  
  // Speak / Task
  listening: string;
  aiDetection: string;
  extractedTask: string;
  taskLabel: string;
  assigneeLabel: string;
  reminderMethodLabel: string;
  confirmSend: string;
  
  // Settings & Voice
  voiceAndAi: string;
  voiceCloning: string;
  manageFamily: string;
  settings: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'FamilyOS',
    goodMorning: 'Good Morning,',
    familyName: 'The Millers',
    runningSmoothly: 'Everything is running smoothly today.',
    speakTask: 'SPEAK TASK',
    speakPrompt: '"Remind me to call Grandma at 4 PM"',
    todaysReminders: "Today's Reminders",
    viewAll: 'View All',
    familySpace: 'Family Space',
    momsBirthday: "Mom's Birthday",
    inDaysSaturday: 'In 3 days • Saturday',
    cardBtn: 'Card',
    giftIdeasBtn: 'Gift Ideas',
    secureVault: 'Secure Vault',
    sharedDocsUpdated: '3 shared documents updated',
    wifiPass: 'Wifi Pass',
    travelIns: 'Travel Ins.',
    addNew: 'Add New',
    
    navHome: 'Home',
    navShared: 'Shared',
    navSpeak: 'Speak',
    navVault: 'Vault',
    navSos: 'SOS',
    
    securityActive: 'SECURITY ACTIVE',
    encryptedNotice: 'AES-256 Encrypted',
    vaultTitle: 'Document Vault',
    vaultSubtitle: 'Securely store and share critical family identity documents.',
    scanDocument: 'Scan Document',
    uploadFile: 'Upload File',
    recentDocuments: 'RECENT DOCUMENTS',
    itemsCount: 'items',
    changePassphrase: 'Change Passphrase',
    passphraseNotice: 'For your privacy, your vault passphrase is not stored on our servers. Keep it safe.',
    
    criticalAlert: 'CRITICAL ALERT',
    sosHeadline: 'EMERGENCY: Tap to alert all family members instantly.',
    sosProtocolTitle: 'Automatic Protocol',
    sosProtocolDesc: 'Tapping the button above will trigger an immediate high-priority alert to 5 family members. Your live GPS location will be shared and your phone will automatically attempt to call emergency services if no family member responds within 60 seconds.',
    call911: '911 Directly',
    medicalId: 'Medical ID',
    sosTriggered: 'EMERGENCY PROTOCOL ACTIVATED: Family alerted. Live GPS shared. Emergency sequence initiated.',
    
    anniversaryTitle: "Mom & Dad's 20th Anniversary",
    anniversarySub: '2 Decades of Love!',
    sendToast: 'Send Shared Toast',
    viewMemories: 'View Memories',
    upcomingMilestones: 'Upcoming Milestones',
    celebratingLife: "Celebrating life's little moments together",
    seeCalendar: 'See Calendar',
    quickSyncReminders: 'Quick Sync Reminders',
    addSharedReminder: 'Add shared reminder',
    everyDayGift: 'EVERY DAY IS A GIFT',
    
    listening: 'Listening...',
    aiDetection: 'AI DETECTION',
    extractedTask: 'Extracted Task',
    taskLabel: 'TASK',
    assigneeLabel: 'ASSIGNEE',
    reminderMethodLabel: 'REMINDER METHOD',
    confirmSend: 'CONFIRM & SEND',
    
    voiceAndAi: 'Voice & AI',
    voiceCloning: 'Voice Cloning',
    manageFamily: 'Manage Family',
    settings: 'Settings'
  },
  ta: {
    appName: 'FamilyOS',
    goodMorning: 'காலை வணக்கம்,',
    familyName: 'மில்லர்ஸ் குடும்பம்',
    runningSmoothly: 'இன்று அனைத்தும் இனிதாக நடந்து கொண்டிருக்கிறது.',
    speakTask: 'குரல் பணி',
    speakPrompt: '"மாலை 4 மணிக்கு பாட்டிக்கு போன் செய்ய நினைவூட்டு"',
    todaysReminders: 'இன்றைய நினைவூட்டல்கள்',
    viewAll: 'அனைத்தும் காண்க',
    familySpace: 'குடும்ப வெளி',
    momsBirthday: 'அம்மாவின் பிறந்தநாள்',
    inDaysSaturday: '3 நாட்களில் • சனிக்கிழமை',
    cardBtn: 'வாழ்த்து அட்டை',
    giftIdeasBtn: 'பரிசு யோசனைகள்',
    secureVault: 'பாதுகாப்பான பெட்டகம்',
    sharedDocsUpdated: '3 பகிரப்பட்ட ஆவணங்கள் புதுப்பிக்கப்பட்டன',
    wifiPass: 'வைஃபை பாஸ்',
    travelIns: 'பயணக் காப்பீடு',
    addNew: 'புதியது சேர்க்க',
    
    navHome: 'முகப்பு',
    navShared: 'பகிர்வு',
    navSpeak: 'பேசுக',
    navVault: 'பெட்டகம்',
    navSos: 'அவசரம்',
    
    securityActive: 'பாதுகாப்பு செயல்முறை',
    encryptedNotice: 'AES-256 குறியாக்கம் செய்யப்பட்டது',
    vaultTitle: 'ஆவண பெட்டகம்',
    vaultSubtitle: 'முக்கியமான குடும்ப அடையாள ஆவணங்களை பாதுகாப்பாக சேமித்து பகிரவும்.',
    scanDocument: 'ஆவணத்தை ஸ்கேன் செய்',
    uploadFile: 'கோப்பை பதிவேற்று',
    recentDocuments: 'சமீபத்திய ஆவணங்கள்',
    itemsCount: 'கோப்புகள்',
    changePassphrase: 'கடவுச்சொல்லை மாற்றுக',
    passphraseNotice: 'உங்கள் தனியுரிமைக்காக, உங்கள் பெட்டக கடவுச்சொல் எங்கள் சேவையகங்களில் சேமிக்கப்படவில்லை. பாதுகாப்பாக வைக்கவும்.',
    
    criticalAlert: 'அவசர எச்சரிக்கை',
    sosHeadline: 'அவசரநிலை: குடும்ப உறுப்பினர்கள் அனைவருக்கும் உடனடியாக எச்சரிக்க தட்டவும்.',
    sosProtocolTitle: 'தானியங்கி நெறிமுறை',
    sosProtocolDesc: 'மேலே உள்ள பொத்தானைத் தட்டினால் 5 குடும்ப உறுப்பினர்களுக்கு உடனடி அவசர எச்சரிக்கை அனுப்பப்படும். உங்கள் நேரடி ஜிபிஎஸ் இருப்பிடம் பகிரப்படும், 60 வினாடிகளுக்குள் குடும்பத்தினர் பதிலளிக்காவிட்டால் அவசர சேவை அழைக்கப்படும்.',
    call911: 'நேரடி அவசர அழைப்பு (112)',
    medicalId: 'மருத்துவ சுயவிவரம்',
    sosTriggered: 'அவசர நெறிமுறை இயக்கப்பட்டது: குடும்பத்திற்கு எச்சரிக்கை அனுப்பப்பட்டது. ஜிபிஎஸ் இருப்பிடம் பகிரப்பட்டது.',
    
    anniversaryTitle: 'அம்மா & அப்பாவின் 20வது திருமண நாள்',
    anniversarySub: '20 ஆண்டுகால அன்பு!',
    sendToast: 'குடும்ப வாழ்த்து அனுப்பு',
    viewMemories: 'நினைவுகளைப் பார்',
    upcomingMilestones: 'வரவிருக்கும் நிகழ்வுகள்',
    celebratingLife: 'வாழ்வின் இனிய தருணங்களை ஒன்றாகக் கொண்டாடுவோம்',
    seeCalendar: 'நாட்காட்டியைப் பார்',
    quickSyncReminders: 'விரைவு நினைவூட்டல்கள்',
    addSharedReminder: 'புதிய நினைவூட்டல் சேர்க்க',
    everyDayGift: 'ஒவ்வொரு நாளும் ஒரு பொக்கிஷம்',
    
    listening: 'கேட்கிறது...',
    aiDetection: 'செயற்கை நுண்ணறிவு கண்டறிதல்',
    extractedTask: 'பிரித்தெடுக்கப்பட்ட பணி',
    taskLabel: 'பணி',
    assigneeLabel: 'ஒதுக்கப்பட்டவர்',
    reminderMethodLabel: 'நினைவூட்டல் முறை',
    confirmSend: 'உறுதிசெய்து அனுப்பு',
    
    voiceAndAi: 'குரல் மற்றும் AI',
    voiceCloning: 'குரல் நகலெடுத்தல்',
    manageFamily: 'குடும்ப மேலாண்மை',
    settings: 'அமைப்புகள்'
  }
};
