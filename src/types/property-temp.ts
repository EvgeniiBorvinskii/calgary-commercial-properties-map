// Types for Calgary Open Data - Business Licenses
export interface CalgaryProperty {
  licencenumber: string;
  tradename: string;
  businesstype: string;
  businesssubtype?: string;
  address: string;
  city: string;
  province: string;
  postalcode: string;
  latitude: string;
  longitude: string;
  licencetypes: string;
  licencestatus: string;
  issueddate: string;
  expirydate?: string;
  communitydistrict?: string;
  ward?: string;
}

export interface PropertyMarker {
  id: string;
  name: string;
  type: string;
  subType?: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  status: 'active' | 'expired' | 'suspended' | 'pending' | 'in_progress';
  issuedDate: string;
  expiryDate?: string;
  community?: string;
  ward?: string;
  postalCode: string;
}

export interface PropertyFilters {
  businessType?: string;
  status?: string;
  community?: string;
  ward?: string;
  searchQuery?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
