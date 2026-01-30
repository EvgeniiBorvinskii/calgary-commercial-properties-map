import axios from 'axios';
import { CalgaryProperty } from '@/types/property';

// Calgary Open Data API endpoints
const CALGARY_API_BASE = 'https://data.calgary.ca/resource';

// Business Licenses dataset (vdjc-pybd) - January 18, 2026 update
// https://data.calgary.ca/Business-and-Economic-Activity/Calgary-Business-Licenses/vdjc-pybd
const BUSINESS_LICENSES_ENDPOINT = '/vdjc-pybd.json';

// API client configuration
const api = axios.create({
  baseURL: CALGARY_API_BASE,
  timeout: 60000,
  headers: {
    'Accept': 'application/json',
  },
});

// Transform raw API response to CalgaryProperty format
function transformApiData(rawData: any[]): CalgaryProperty[] {
  return rawData
    .filter(item => item.point?.coordinates && item.tradename)
    .map(item => ({
      licencenumber: item.getbusid || '',
      tradename: item.tradename || '',
      businesstype: item.licencetypes?.split(',')[0]?.trim() || 'Business',
      businesssubtype: item.licencetypes?.split('\n')[1]?.trim(),
      address: item.address || '',
      city: 'Calgary',
      province: 'AB',
      postalcode: '',
      latitude: String(item.point.coordinates[1]),
      longitude: String(item.point.coordinates[0]),
      licencetypes: item.licencetypes || '',
      licencestatus: item.jobstatusdesc || 'Unknown',
      issueddate: item.first_iss_dt || '',
      expirydate: item.exp_dt,
      communitydistrict: item.comdistnm || '',
      ward: item.comdistcd || '',
    }));
}

export async function fetchCalgaryProperties(): Promise<CalgaryProperty[]> {
  try {
    console.log('Fetching Calgary business licenses from real API...');

    // NOTE:
    // Previously we limited to 1000 and filtered to active-only. That made Expired/Suspended show as 0.
    // For realtor-grade accuracy, fetch *all* records (paginated) and let the UI filter.

    const pageSize = 5000;
    const hardCap = 50000; // safety cap to avoid runaway load; can be increased if needed
    let offset = 0;
    const all: any[] = [];

    while (all.length < hardCap) {
      const response = await api.get(BUSINESS_LICENSES_ENDPOINT, {
        params: {
          $limit: pageSize,
          $offset: offset,
          $order: 'first_iss_dt DESC',
        },
      });

      const batch: any[] = response.data || [];
      all.push(...batch);
      console.log(`Fetched batch: ${batch.length}, total: ${all.length}`);

      if (batch.length < pageSize) break;
      offset += pageSize;
    }

    if (all.length >= hardCap) {
      console.warn(`Reached hard cap (${hardCap}). Consider increasing cap or adding server-side caching.`);
    }

    const properties = transformApiData(all);
    console.log(`Transformed to ${properties.length} valid properties with coordinates`);
    return properties;
  } catch (error: any) {
    console.error('Error fetching Calgary properties:', error.response?.data || error.message);
    throw error; // Let React handle the error with SWR
  }
}

export async function searchPropertiesByAddress(address: string): Promise<CalgaryProperty[]> {
  try {
    const response = await api.get(BUSINESS_LICENSES_ENDPOINT, {
      params: {
        $limit: 500,
        $q: address, // Socrata full-text search
      },
    });
    
    return transformApiData(response.data);
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

export async function getPropertyById(licenseNumber: string): Promise<CalgaryProperty | null> {
  try {
    const response = await api.get(BUSINESS_LICENSES_ENDPOINT, {
      params: {
        getbusid: licenseNumber, // Use correct field name from API
      },
    });
    
    const properties = transformApiData(response.data);
    return properties[0] || null;
  } catch (error) {
    console.error('Error fetching property by ID:', error);
    return null;
  }
}
