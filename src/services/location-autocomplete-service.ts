import { loadPersistedRecentClients } from "./local-storage-service";

export type GeographicLocationPreset = {
  namedLocationTitle: string; // Facility / Jobsite / Commercial Hub Name
  streetAddressLine?: string; // Standard street line
  city: string;
  region: string;
  postalCode: string;
  country: string;
  primaryZoneName: string;
};

// 100% Offline US Regional Contractor Hubs & Commercial Jobsites (Zero external network telemetry)
const COMMON_CONTRACTOR_LOCATION_PRESETS: GeographicLocationPreset[] = [
  // --- SOUTH & SOUTHWEST ---
  {
    namedLocationTitle: "Apex Commercial Center",
    streetAddressLine: "4520 West Braker Lane",
    city: "Austin",
    region: "TX",
    postalCode: "78759",
    country: "USA",
    primaryZoneName: "Braker Commercial Corridor",
  },
  {
    namedLocationTitle: "Austin South Industrial Park",
    streetAddressLine: "7200 South Congress Ave",
    city: "Austin",
    region: "TX",
    postalCode: "78745",
    country: "USA",
    primaryZoneName: "Austin South Logistics",
  },
  {
    namedLocationTitle: "Austin Metro Central Hub",
    streetAddressLine: "500 East 4th Street",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    country: "USA",
    primaryZoneName: "Austin Metro Central",
  },
  {
    namedLocationTitle: "Houston Downtown Commercial Tower",
    streetAddressLine: "1000 Louisiana Street",
    city: "Houston",
    region: "TX",
    postalCode: "77002",
    country: "USA",
    primaryZoneName: "Houston Commercial Core",
  },
  {
    namedLocationTitle: "Dallas Trade Mart & Metroplex Hub",
    streetAddressLine: "2100 North Stemmons Freeway",
    city: "Dallas",
    region: "TX",
    postalCode: "75207",
    country: "USA",
    primaryZoneName: "Dallas Metroplex Hub",
  },
  {
    namedLocationTitle: "Fort Worth Alliance Logistics Depot",
    streetAddressLine: "777 Main Street",
    city: "Fort Worth",
    region: "TX",
    postalCode: "76102",
    country: "USA",
    primaryZoneName: "Fort Worth Alliance Basin",
  },
  {
    namedLocationTitle: "San Antonio Commercial Trade Basin",
    streetAddressLine: "300 East Houston Street",
    city: "San Antonio",
    region: "TX",
    postalCode: "78205",
    country: "USA",
    primaryZoneName: "San Antonio Trade Zone",
  },
  {
    namedLocationTitle: "Phoenix Valley Commercial Depot",
    streetAddressLine: "201 West Washington Street",
    city: "Phoenix",
    region: "AZ",
    postalCode: "85003",
    country: "USA",
    primaryZoneName: "Phoenix Valley Commercial",
  },
  {
    namedLocationTitle: "Oklahoma City Trade Corridor",
    streetAddressLine: "100 North Broadway Ave",
    city: "Oklahoma City",
    region: "OK",
    postalCode: "73102",
    country: "USA",
    primaryZoneName: "OKC Central Trade District",
  },
  {
    namedLocationTitle: "Gulf Coast Logistics & Supply Terminal",
    streetAddressLine: "909 Poydras Street",
    city: "New Orleans",
    region: "LA",
    postalCode: "70112",
    country: "USA",
    primaryZoneName: "Gulf Coast Supply Hub",
  },

  // --- NORTHEAST ---
  {
    namedLocationTitle: "Hudson Yards Commercial Logistics",
    streetAddressLine: "500 West 33rd Street",
    city: "New York",
    region: "NY",
    postalCode: "10001",
    country: "USA",
    primaryZoneName: "New York Metro Commercial",
  },
  {
    namedLocationTitle: "Midtown Commercial Center",
    streetAddressLine: "350 5th Avenue",
    city: "New York",
    region: "NY",
    postalCode: "10118",
    country: "USA",
    primaryZoneName: "Manhattan Central",
  },
  {
    namedLocationTitle: "Boston Seaport Innovation Depot",
    streetAddressLine: "1 Marina Park Drive",
    city: "Boston",
    region: "MA",
    postalCode: "02210",
    country: "USA",
    primaryZoneName: "Boston Seaport District",
  },
  {
    namedLocationTitle: "Philadelphia Commercial Logistics Hub",
    streetAddressLine: "3000 Chestnut Street",
    city: "Philadelphia",
    region: "PA",
    postalCode: "19104",
    country: "USA",
    primaryZoneName: "Philadelphia Center City",
  },
  {
    namedLocationTitle: "Pittsburgh Steel City Trade Depot",
    streetAddressLine: "600 Grant Street",
    city: "Pittsburgh",
    region: "PA",
    postalCode: "15222",
    country: "USA",
    primaryZoneName: "Pittsburgh Industrial Basin",
  },
  {
    namedLocationTitle: "Newark Freight & Logistics Terminal",
    streetAddressLine: "100 Raymond Boulevard",
    city: "Newark",
    region: "NJ",
    postalCode: "07102",
    country: "USA",
    primaryZoneName: "Newark Port & Rail Basin",
  },

  // --- SOUTHEAST & MID-ATLANTIC ---
  {
    namedLocationTitle: "Atlanta Regional Trade Center",
    streetAddressLine: "285 Peachtree Center Ave",
    city: "Atlanta",
    region: "GA",
    postalCode: "30303",
    country: "USA",
    primaryZoneName: "Atlanta Regional Terminal",
  },
  {
    namedLocationTitle: "Charlotte Uptown Commercial Depot",
    streetAddressLine: "201 South College Street",
    city: "Charlotte",
    region: "NC",
    postalCode: "28202",
    country: "USA",
    primaryZoneName: "Charlotte Financial Corridor",
  },
  {
    namedLocationTitle: "Miami Dade Construction Terminal",
    streetAddressLine: "100 Southeast 2nd Street",
    city: "Miami",
    region: "FL",
    postalCode: "33131",
    country: "USA",
    primaryZoneName: "Miami Dade Construction Basin",
  },
  {
    namedLocationTitle: "Central Florida Construction Corridor",
    streetAddressLine: "200 South Orange Avenue",
    city: "Orlando",
    region: "FL",
    postalCode: "32801",
    country: "USA",
    primaryZoneName: "Orlando Metro Commercial",
  },
  {
    namedLocationTitle: "Tampa Bay Industrial Trade Basin",
    streetAddressLine: "100 North Tampa Street",
    city: "Tampa",
    region: "FL",
    postalCode: "33602",
    country: "USA",
    primaryZoneName: "Tampa Port Logistics",
  },
  {
    namedLocationTitle: "Nashville Commercial Development Basin",
    streetAddressLine: "150 4th Avenue North",
    city: "Nashville",
    region: "TN",
    postalCode: "37219",
    country: "USA",
    primaryZoneName: "Nashville Downtown Hub",
  },
  {
    namedLocationTitle: "Richmond Capital Commercial Center",
    streetAddressLine: "901 East Byrd Street",
    city: "Richmond",
    region: "VA",
    postalCode: "23219",
    country: "USA",
    primaryZoneName: "Richmond Trade Corridor",
  },
  {
    namedLocationTitle: "Baltimore Harbor Commercial Depot",
    streetAddressLine: "100 East Pratt Street",
    city: "Baltimore",
    region: "MD",
    postalCode: "21202",
    country: "USA",
    primaryZoneName: "Baltimore Harbor Logistics",
  },

  // --- MIDWEST ---
  {
    namedLocationTitle: "Chicago Industrial Logistics District",
    streetAddressLine: "233 South Wacker Drive",
    city: "Chicago",
    region: "IL",
    postalCode: "60606",
    country: "USA",
    primaryZoneName: "Chicago Industrial District",
  },
  {
    namedLocationTitle: "Detroit Motor City Trade Terminal",
    streetAddressLine: "500 Woodward Avenue",
    city: "Detroit",
    region: "MI",
    postalCode: "48226",
    country: "USA",
    primaryZoneName: "Detroit Industrial Core",
  },
  {
    namedLocationTitle: "Columbus Central Commercial Hub",
    streetAddressLine: "100 South High Street",
    city: "Columbus",
    region: "OH",
    postalCode: "43215",
    country: "USA",
    primaryZoneName: "Ohio Central Trade Hub",
  },
  {
    namedLocationTitle: "Cleveland Industrial Lakefront Depot",
    streetAddressLine: "200 Public Square",
    city: "Cleveland",
    region: "OH",
    postalCode: "44114",
    country: "USA",
    primaryZoneName: "Cleveland Lakefront Basin",
  },
  {
    namedLocationTitle: "Indianapolis Logistics Crossroads",
    streetAddressLine: "1 Monument Circle",
    city: "Indianapolis",
    region: "IN",
    postalCode: "46204",
    country: "USA",
    primaryZoneName: "Midwest Freight Crossroads",
  },
  {
    namedLocationTitle: "Twin Cities Commercial Terminal",
    streetAddressLine: "80 South 8th Street",
    city: "Minneapolis",
    region: "MN",
    postalCode: "55402",
    country: "USA",
    primaryZoneName: "Twin Cities Commercial Hub",
  },
  {
    namedLocationTitle: "Kansas City Regional Freight Depot",
    streetAddressLine: "1200 Main Street",
    city: "Kansas City",
    region: "MO",
    postalCode: "64105",
    country: "USA",
    primaryZoneName: "Kansas City Logistics Core",
  },
  {
    namedLocationTitle: "Milwaukee Manufacturing & Trade Center",
    streetAddressLine: "777 East Wisconsin Avenue",
    city: "Milwaukee",
    region: "WI",
    postalCode: "53202",
    country: "USA",
    primaryZoneName: "Milwaukee Industrial Basin",
  },

  // --- MOUNTAIN & WEST ---
  {
    namedLocationTitle: "Denver Front Range Logistics Hub",
    streetAddressLine: "1600 Broadway",
    city: "Denver",
    region: "CO",
    postalCode: "80202",
    country: "USA",
    primaryZoneName: "Denver Front Range",
  },
  {
    namedLocationTitle: "Wasatch Front Commercial Center",
    streetAddressLine: "222 South Main Street",
    city: "Salt Lake City",
    region: "UT",
    postalCode: "84101",
    country: "USA",
    primaryZoneName: "Wasatch Front Logistics",
  },
  {
    namedLocationTitle: "Las Vegas Valley Construction Hub",
    streetAddressLine: "300 South 4th Street",
    city: "Las Vegas",
    region: "NV",
    postalCode: "89101",
    country: "USA",
    primaryZoneName: "Las Vegas Commercial Basin",
  },
  {
    namedLocationTitle: "Treasure Valley Logistics Facility",
    streetAddressLine: "800 West Main Street",
    city: "Boise",
    region: "ID",
    postalCode: "83702",
    country: "USA",
    primaryZoneName: "Treasure Valley Commercial",
  },

  // --- PACIFIC COAST ---
  {
    namedLocationTitle: "Los Angeles Harbor Logistics Hub",
    streetAddressLine: "444 South Flower Street",
    city: "Los Angeles",
    region: "CA",
    postalCode: "90071",
    country: "USA",
    primaryZoneName: "Los Angeles Basin Commercial",
  },
  {
    namedLocationTitle: "San Francisco Bay Area Logistics",
    streetAddressLine: "415 Mission Street",
    city: "San Francisco",
    region: "CA",
    postalCode: "94105",
    country: "USA",
    primaryZoneName: "SF Bay Commercial Basin",
  },
  {
    namedLocationTitle: "San Diego Coastal Commercial Depot",
    streetAddressLine: "501 West Broadway",
    city: "San Diego",
    region: "CA",
    postalCode: "92101",
    country: "USA",
    primaryZoneName: "San Diego Border Logistics",
  },
  {
    namedLocationTitle: "Sacramento Valley Commercial Center",
    streetAddressLine: "980 9th Street",
    city: "Sacramento",
    region: "CA",
    postalCode: "95814",
    country: "USA",
    primaryZoneName: "Sacramento Central Basin",
  },
  {
    namedLocationTitle: "Seattle Puget Sound Commercial Facility",
    streetAddressLine: "1201 3rd Avenue",
    city: "Seattle",
    region: "WA",
    postalCode: "98101",
    country: "USA",
    primaryZoneName: "Seattle Puget Sound Commercial",
  },
  {
    namedLocationTitle: "Portland Columbia River Trade Depot",
    streetAddressLine: "111 Southwest 5th Avenue",
    city: "Portland",
    region: "OR",
    postalCode: "97204",
    country: "USA",
    primaryZoneName: "Portland Metro Logistics",
  },
];

export function searchLocationSuggestions(searchQueryText: string): GeographicLocationPreset[] {
  const normalizedQuery = searchQueryText.trim().toLowerCase();
  if (normalizedQuery.length < 2) {
    return [];
  }

  // 1. Scan recent client memory first (personalized suggestions with names, US locations only)
  const recentSavedClients = loadPersistedRecentClients();
  const recentClientLocations: GeographicLocationPreset[] = recentSavedClients
    .filter((clientRecord) => {
      if (!clientRecord.city || !clientRecord.region) return false;
      // Strictly maintain US regions only
      if (clientRecord.country && clientRecord.country !== "USA") return false;
      const lowerCity = clientRecord.city.toLowerCase();
      if (lowerCity === "kolkata" || lowerCity === "mumbai") return false;
      return true;
    })
    .map((clientRecord) => ({
      namedLocationTitle: clientRecord.companyName || clientRecord.name || "Recent Client Site",
      streetAddressLine: clientRecord.addressLines[0] || "",
      city: clientRecord.city || "",
      region: clientRecord.region || "",
      postalCode: clientRecord.postalCode || "",
      country: "USA",
      primaryZoneName: clientRecord.companyName ? `Client: ${clientRecord.companyName}` : `Client: ${clientRecord.name}`,
    }));

  const candidatePool = [...recentClientLocations, ...COMMON_CONTRACTOR_LOCATION_PRESETS];

  const matchedSuggestions: GeographicLocationPreset[] = [];
  const seenLocationCompositeKeys = new Set<string>();

  for (const candidatePreset of candidatePool) {
    const compositeKey = `${candidatePreset.namedLocationTitle.toLowerCase()}-${candidatePreset.city.toLowerCase()}-${candidatePreset.postalCode.toLowerCase()}`;
    if (seenLocationCompositeKeys.has(compositeKey)) continue;

    const matchesName = candidatePreset.namedLocationTitle.toLowerCase().includes(normalizedQuery);
    const matchesStreet = (candidatePreset.streetAddressLine || "").toLowerCase().includes(normalizedQuery);
    const matchesCity = candidatePreset.city.toLowerCase().includes(normalizedQuery);
    const matchesRegion = candidatePreset.region.toLowerCase().includes(normalizedQuery);
    const matchesPostal = candidatePreset.postalCode.toLowerCase().includes(normalizedQuery);
    const matchesZone = candidatePreset.primaryZoneName.toLowerCase().includes(normalizedQuery);

    if (matchesName || matchesStreet || matchesCity || matchesRegion || matchesPostal || matchesZone) {
      seenLocationCompositeKeys.add(compositeKey);
      matchedSuggestions.push(candidatePreset);
    }

    if (matchedSuggestions.length >= 6) break;
  }

  return matchedSuggestions;
}
