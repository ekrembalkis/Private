
import { DayEntry, InternshipType } from '../types';
import { INTERNSHIP_CONFIG, PRODUCTION_TOPICS, MANAGEMENT_TOPICS } from '../constants';

// Helper to format date as DD.MM.YYYY
export const formatDateTR = (date: Date): string => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

// Check if a date is a weekend
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0=Sunday, 6=Saturday
};

// Resmi Tatiller Listesi (DD.MM.YYYY)
const HOLIDAYS = [
  '29.10.2025' // Cumhuriyet Bayramı
];

const isHoliday = (dateStr: string): boolean => {
  return HOLIDAYS.includes(dateStr);
};

// Helper to pick a random item from an array
const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

// Generate the initial list of 30 days
export const generateDayList = (): DayEntry[] => {
  const days: DayEntry[] = [];
  const currentDate = new Date(INTERNSHIP_CONFIG.startDate);
  const endDate = new Date(INTERNSHIP_CONFIG.endDate);
  
  let dayCounter = 1;

  // Create pool of types
  const typePool: InternshipType[] = [
    ...Array(INTERNSHIP_CONFIG.productionRatio).fill(InternshipType.PRODUCTION_DESIGN),
    ...Array(INTERNSHIP_CONFIG.managementRatio).fill(InternshipType.MANAGEMENT)
  ];

  // Shuffle types (Fisher-Yates shuffle)
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [typePool[i], typePool[j]] = [typePool[j], typePool[i]];
  }

  // Visual days indices (select 7 random indices out of 30)
  const visualIndices = new Set<number>();
  while (visualIndices.size < 7) {
    visualIndices.add(Math.floor(Math.random() * 30));
  }

  // Loop continues until end date is reached OR total days goal is met
  // Note: If the configured date range is too short to fit 30 working days, 
  // it will stop at endDate regardless of dayCounter.
  while (currentDate <= endDate && dayCounter <= INTERNSHIP_CONFIG.totalDays) {
    const dateStr = formatDateTR(currentDate);

    // Check if it's a valid workday (Not weekend AND Not holiday)
    if (!isWeekend(currentDate) && !isHoliday(dateStr)) {
      const type = typePool[dayCounter - 1] || InternshipType.PRODUCTION_DESIGN;
      
      // Select specific topic based on type
      let specificTopic = '';
      if (type === InternshipType.PRODUCTION_DESIGN) {
        specificTopic = getRandomItem(PRODUCTION_TOPICS);
      } else {
        specificTopic = getRandomItem(MANAGEMENT_TOPICS);
      }

      days.push({
        dayNumber: dayCounter,
        date: dateStr,
        type: type,
        specificTopic: specificTopic,
        content: '',
        isGenerated: false,
        isLoading: false,
        hasVisual: visualIndices.has(dayCounter - 1),
        topic: type === InternshipType.PRODUCTION_DESIGN 
          ? 'Üretim/Tasarım/Saha Aktivitesi' 
          : 'İşletme/Depo/Ofis Aktivitesi'
      });
      dayCounter++;
    }
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return days;
};
