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
  // Simplified lifecycle derived from Calgary Open Data `jobstatusdesc`.
  // Current dataset mainly contains renewal workflow states (no explicit "Suspended" / "Expired").
  status: 'active' | 'pending' | 'in_progress';
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
