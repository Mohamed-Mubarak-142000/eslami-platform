export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  gregorianDate: string;
}

interface RawTimingsResponse {
  code: number;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
    };
    date: { readable: string };
  };
}

const TIMINGS_URL = "https://api.aladhan.com/v1/timings";
// Method 5 = Egyptian General Authority of Survey — a common default for Arabic-speaking users.
const CALCULATION_METHOD = 5;

function stripTimezoneSuffix(value: string): string {
  return value.split(" ")[0] ?? value;
}

export async function getPrayerTimes(latitude: number, longitude: number, date: Date = new Date()): Promise<PrayerTimes | null> {
  try {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const url = `${TIMINGS_URL}/${day}-${month}-${date.getFullYear()}?latitude=${latitude}&longitude=${longitude}&method=${CALCULATION_METHOD}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = (await response.json()) as RawTimingsResponse;
    if (data.code !== 200) return null;
    const { timings } = data.data;
    return {
      fajr: stripTimezoneSuffix(timings.Fajr),
      sunrise: stripTimezoneSuffix(timings.Sunrise),
      dhuhr: stripTimezoneSuffix(timings.Dhuhr),
      asr: stripTimezoneSuffix(timings.Asr),
      maghrib: stripTimezoneSuffix(timings.Maghrib),
      isha: stripTimezoneSuffix(timings.Isha),
      gregorianDate: data.data.date.readable,
    };
  } catch {
    return null;
  }
}
