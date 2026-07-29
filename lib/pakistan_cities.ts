// All 30 Pakistani cities tracked by the model — single source of truth used by
// the landing-page hero map, the auth-layout side panel, and the dashboard
// heat map. Lat/lon are the canonical city coordinates, also matched in
// `ml/fetch_pakistan.py`.

export type PakistanCity = { name: string; lat: number; lon: number; size?: number };

export const PK_CITIES: PakistanCity[] = [
  { name: "Karachi", lat: 24.86, lon: 67.00, size: 5 },
  { name: "Lahore", lat: 31.55, lon: 74.34, size: 5 },
  { name: "Islamabad", lat: 33.68, lon: 73.05, size: 5 },
  { name: "Faisalabad", lat: 31.45, lon: 73.14, size: 4 },
  { name: "Multan", lat: 30.16, lon: 71.52, size: 4 },
  { name: "Quetta", lat: 30.18, lon: 66.98, size: 4 },
  { name: "Peshawar", lat: 34.02, lon: 71.52, size: 4 },
  { name: "Hyderabad", lat: 25.40, lon: 68.36 },
  { name: "Rawalpindi", lat: 33.57, lon: 73.02 },
  { name: "Gwadar", lat: 25.13, lon: 62.32 },
  { name: "Murree", lat: 33.91, lon: 73.39 },
  { name: "Sukkur", lat: 27.71, lon: 68.86 },
  { name: "Bahawalpur", lat: 29.40, lon: 71.67 },
  { name: "Sialkot", lat: 32.49, lon: 74.52 },
  { name: "Gujranwala", lat: 32.19, lon: 74.19 },
  { name: "Rahim Yar Khan", lat: 28.42, lon: 70.30 },
  { name: "Sargodha", lat: 32.08, lon: 72.67 },
  { name: "Gilgit", lat: 35.92, lon: 74.31 },
  { name: "Skardu", lat: 35.30, lon: 75.63 },
  { name: "Larkana", lat: 27.56, lon: 68.21 },
  { name: "Mardan", lat: 34.20, lon: 72.05 },
  { name: "Abbottabad", lat: 34.15, lon: 73.21 },
  { name: "Pasni", lat: 25.26, lon: 63.48 },
  { name: "Sheikhupura", lat: 31.72, lon: 73.99 },
  { name: "Jhang", lat: 31.27, lon: 72.33 },
  { name: "Sibi", lat: 29.54, lon: 67.88 },
  { name: "Khuzdar", lat: 27.81, lon: 66.61 },
  { name: "Zhob", lat: 31.34, lon: 69.45 },
  { name: "Nawabshah", lat: 26.24, lon: 68.41 },
  { name: "Muzaffarabad", lat: 34.36, lon: 73.48 },
];

// Project lat/lon to the simplemaps Pakistan SVG coordinate system
// (viewBox 0 0 1000 959). Coefficients fitted from the three calibration
// points the SVG itself ships with — x is linear in longitude, y follows a
// quadratic that matches the Mercator-style stretch at Pakistan's latitudes.
export const proj = (lat: number, lon: number) => ({
  x: 56.08 * lon - 3366.4,
  y: -0.336 * lat * lat - 44.78 * lat + 2164.92,
});
