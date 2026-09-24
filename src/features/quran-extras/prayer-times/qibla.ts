// Kaaba coordinates (Mecca, Saudi Arabia) — a fixed, widely-published constant.
const KAABA_LATITUDE = 21.4225;
const KAABA_LONGITUDE = 39.8262;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/** Initial great-circle bearing from the given point to the Kaaba, in degrees clockwise from true north. */
export function computeQiblaBearing(latitude: number, longitude: number): number {
  const φ1 = toRadians(latitude);
  const φ2 = toRadians(KAABA_LATITUDE);
  const Δλ = toRadians(KAABA_LONGITUDE - longitude);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = toDegrees(Math.atan2(y, x));

  return (bearing + 360) % 360;
}
