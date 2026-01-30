import { CalgaryProperty, PropertyMarker } from '@/types/property';

export function transformCalgaryData(data: CalgaryProperty[]): PropertyMarker[] {
  return data
    .filter(item => item.latitude && item.longitude)
    .map(item => ({
      id: item.licencenumber,
      name: item.tradename || 'Unnamed Business',
      type: item.businesstype,
      subType: item.businesssubtype,
      address: `${item.address}, ${item.city}, ${item.province} ${item.postalcode}`,
      coordinates: [parseFloat(item.longitude), parseFloat(item.latitude)],
      status: normalizeStatus(item.licencestatus),
      issuedDate: item.issueddate,
      expiryDate: item.expirydate,
      community: item.communitydistrict,
      ward: item.ward,
      postalCode: item.postalcode,
    }));
}

function normalizeStatus(status: string): 'active' | 'pending' | 'in_progress' {
  const normalized = status?.toLowerCase() || '';

  // Calgary Open Data jobstatusdesc values currently observed (2026-01-19):
  // - Renewal Licensed
  // - Licensed
  // - Pending Renewal
  // - Renewal Invoiced
  // - Move in Progress
  // - Close in Progress
  // - Renewal Notification Sent
  // These are renewal workflow states, not classic "expired/suspended".

  if (normalized.includes('move in progress') || normalized.includes('close in progress')) {
    return 'in_progress';
  }

  if (
    normalized.includes('pending renewal') ||
    normalized.includes('renewal invoiced') ||
    normalized.includes('renewal notification sent')
  ) {
    return 'pending';
  }

  // Treat licensed states as active
  if (normalized.includes('licensed')) return 'active';

  // Conservative default
  return 'active';
}

export function filterProperties(
  properties: PropertyMarker[],
  filters: {
    businessType?: string;
    status?: string;
    community?: string;
    searchQuery?: string;
  }
): PropertyMarker[] {
  return properties.filter(property => {
    if (filters.businessType && property.type !== filters.businessType) {
      return false;
    }
    if (filters.status && property.status !== filters.status) {
      return false;
    }
    if (filters.community && property.community !== filters.community) {
      return false;
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        property.name.toLowerCase().includes(query) ||
        property.address.toLowerCase().includes(query) ||
        property.type.toLowerCase().includes(query)
      );
    }
    return true;
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
