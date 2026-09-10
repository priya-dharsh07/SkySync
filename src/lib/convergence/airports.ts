export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timezoneOffset: number; // in hours from UTC
  hubTier: "tier1" | "tier2" | "regional";
}

export const AIRPORTS: Airport[] = [
  // North America
  { code: "JFK", name: "John F. Kennedy International", city: "New York", country: "United States", lat: 40.6413, lng: -73.7781, timezoneOffset: -5, hubTier: "tier1" },
  { code: "SFO", name: "San Francisco International", city: "San Francisco", country: "United States", lat: 37.6213, lng: -122.3790, timezoneOffset: -8, hubTier: "tier1" },
  { code: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "United States", lat: 33.9416, lng: -118.4085, timezoneOffset: -8, hubTier: "tier1" },
  { code: "ORD", name: "O'Hare International", city: "Chicago", country: "United States", lat: 41.9742, lng: -87.9073, timezoneOffset: -6, hubTier: "tier1" },
  { code: "MIA", name: "Miami International", city: "Miami", country: "United States", lat: 25.7959, lng: -80.2870, timezoneOffset: -5, hubTier: "tier2" },
  { code: "YYZ", name: "Toronto Pearson International", city: "Toronto", country: "Canada", lat: 43.6777, lng: -79.6248, timezoneOffset: -5, hubTier: "tier1" },

  // Europe
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom", lat: 51.4700, lng: -0.4543, timezoneOffset: 0, hubTier: "tier1" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", lat: 49.0097, lng: 2.5479, timezoneOffset: 1, hubTier: "tier1" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", lat: 52.3105, lng: 4.7683, timezoneOffset: 1, hubTier: "tier1" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", lat: 50.0379, lng: 8.5622, timezoneOffset: 1, hubTier: "tier1" },
  { code: "MAD", name: "Adolfo Suárez Madrid-Barajas", city: "Madrid", country: "Spain", lat: 40.4839, lng: -3.5680, timezoneOffset: 1, hubTier: "tier2" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino", city: "Rome", country: "Italy", lat: 41.8003, lng: 12.2389, timezoneOffset: 1, hubTier: "tier2" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", lat: 47.4582, lng: 8.5555, timezoneOffset: 1, hubTier: "tier2" },

  // Middle East & Mediterranean
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", lat: 25.2532, lng: 55.3657, timezoneOffset: 4, hubTier: "tier1" },
  { code: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", lat: 25.2731, lng: 51.6081, timezoneOffset: 3, hubTier: "tier1" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", lat: 41.2753, lng: 28.7519, timezoneOffset: 3, hubTier: "tier1" },

  // Asia-Pacific
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", lat: 1.3644, lng: 103.9915, timezoneOffset: 8, hubTier: "tier1" },
  { code: "HND", name: "Tokyo Haneda Airport", city: "Tokyo", country: "Japan", lat: 35.5494, lng: 139.7798, timezoneOffset: 9, hubTier: "tier1" },
  { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", lat: 35.7720, lng: 140.3929, timezoneOffset: 9, hubTier: "tier2" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", lat: 22.3080, lng: 113.9185, timezoneOffset: 8, hubTier: "tier1" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", lat: 37.4602, lng: 126.4407, timezoneOffset: 9, hubTier: "tier1" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", lat: 13.6900, lng: 100.7501, timezoneOffset: 7, hubTier: "tier1" },
  { code: "DPS", name: "Ngurah Rai International", city: "Bali", country: "Indonesia", lat: -8.7482, lng: 115.1672, timezoneOffset: 8, hubTier: "tier2" },
  { code: "SYD", name: "Sydney Kingsford Smith", city: "Sydney", country: "Australia", lat: -33.9399, lng: 151.1753, timezoneOffset: 10, hubTier: "tier1" },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", lat: -37.6690, lng: 144.8410, timezoneOffset: 10, hubTier: "tier2" },

  // South Asia
  { code: "DEL", name: "Indira Gandhi International", city: "New Delhi", country: "India", lat: 28.5562, lng: 77.1000, timezoneOffset: 5.5, hubTier: "tier1" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj", city: "Mumbai", country: "India", lat: 19.0896, lng: 72.8656, timezoneOffset: 5.5, hubTier: "tier1" },
  { code: "BLR", name: "Kempegowda International", city: "Bengaluru", country: "India", lat: 13.1986, lng: 77.7066, timezoneOffset: 5.5, hubTier: "tier1" },
  { code: "MAA", name: "Chennai International", city: "Chennai", country: "India", lat: 12.9941, lng: 80.1709, timezoneOffset: 5.5, hubTier: "tier2" },
  { code: "HYD", name: "Rajiv Gandhi International", city: "Hyderabad", country: "India", lat: 17.2403, lng: 78.4294, timezoneOffset: 5.5, hubTier: "tier2" },
  { code: "CCU", name: "Netaji Subhash Chandra Bose", city: "Kolkata", country: "India", lat: 22.6547, lng: 88.4467, timezoneOffset: 5.5, hubTier: "tier2" },
  { code: "COK", name: "Cochin International", city: "Kochi", country: "India", lat: 10.1518, lng: 76.3930, timezoneOffset: 5.5, hubTier: "tier2" },
  { code: "GOI", name: "Dabolim Airport", city: "Goa", country: "India", lat: 15.3808, lng: 73.8314, timezoneOffset: 5.5, hubTier: "tier2" },

  // Africa & South America
  { code: "CPT", name: "Cape Town International", city: "Cape Town", country: "South Africa", lat: -33.9715, lng: 18.6021, timezoneOffset: 2, hubTier: "tier2" },
  { code: "GRU", name: "São Paulo/Guarulhos", city: "São Paulo", country: "Brazil", lat: -23.4356, lng: -46.4731, timezoneOffset: -3, hubTier: "tier1" },
];

export function getAirportByCode(code: string): Airport | undefined {
  return AIRPORTS.find(a => a.code.toUpperCase() === code.trim().toUpperCase());
}

export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, 8);
  return AIRPORTS.filter(a => 
    a.code.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q) ||
    a.country.toLowerCase().includes(q) ||
    a.name.toLowerCase().includes(q)
  ).slice(0, 10);
}

// Great-circle distance between two airports using the Haversine formula (in km)
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
