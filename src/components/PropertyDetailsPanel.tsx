'use client';

import { useEffect, useState } from 'react';
import { PropertyHeavy } from '@/types/property-heavy';
import { X, MapPin, Calendar, Users, TrendingUp, Download } from 'lucide-react';

interface PropertyDetailsPanelProps {
  propertyId: string | null;
  onClose: () => void;
}

export default function PropertyDetailsPanel({ propertyId, onClose }: PropertyDetailsPanelProps) {
  const [property, setProperty] = useState<PropertyHeavy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setProperty(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/properties/${propertyId}/details`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setProperty(result.data);
        } else {
          throw new Error('Property data not found');
        }
      } catch (err: any) {
        console.error('[PropertyDetailsPanel] Error:', err);
        setError(err.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [propertyId]);

  if (!propertyId) return null;

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 border-green-300',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const handleExportCSV = () => {
    if (!property) return;

    const csv = [
      ['Field', 'Value'],
      ['License Number', property.fullDetails.licenseNumber],
      ['Name', property.fullDetails.name],
      ['Type', property.fullDetails.type],
      ['Status', property.fullDetails.status],
      ['Address', property.fullDetails.address],
      ['Community', property.fullDetails.community],
      ['Ward', property.fullDetails.ward || 'N/A'],
      ['Issued Date', new Date(property.fullDetails.issuedDate).toLocaleDateString()],
      ['Expiry Date', property.fullDetails.expiryDate ? new Date(property.fullDetails.expiryDate).toLocaleDateString() : 'N/A'],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-${propertyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300">
      <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Property Details</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Close panel"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-calgary-blue"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-semibold">Failed to load property details</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {property && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {property.fullDetails.name}
              </h3>
              <span
                className={`inline-block px-3 py-1 text-sm font-semibold rounded-full border ${
                  statusColors[property.fullDetails.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {property.fullDetails.status.toUpperCase()}
              </span>
            </div>

            {/* Main Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-gray-900">{property.fullDetails.address}</p>
                  <p className="text-sm text-gray-600">
                    {property.fullDetails.community}
                    {property.fullDetails.ward && ` • Ward ${property.fullDetails.ward}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-gray-700">Business Type</p>
                  <p className="text-sm text-gray-900">{property.fullDetails.type}</p>
                  {property.fullDetails.subType && (
                    <p className="text-sm text-gray-600">{property.fullDetails.subType}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-medium text-gray-700">Dates</p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Issued:</span>{' '}
                    {new Date(property.fullDetails.issuedDate).toLocaleDateString()}
                  </p>
                  {property.fullDetails.expiryDate && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Expires:</span>{' '}
                      {new Date(property.fullDetails.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* License Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">License Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">License Number</span>
                  <span className="font-mono font-medium">{property.fullDetails.licenseNumber}</span>
                </div>
                {property.fullDetails.approvalStatus && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approval Status</span>
                    <span className="font-medium">{property.fullDetails.approvalStatus}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Coordinates */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Geographic Coordinates</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Longitude</p>
                  <p className="font-mono font-medium">{property.fullDetails.longitude?.toFixed(6) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Latitude</p>
                  <p className="font-mono font-medium">{property.fullDetails.latitude?.toFixed(6) || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-calgary-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              <Download size={20} />
              Export to CSV
            </button>

            {/* Metadata */}
            <div className="text-xs text-gray-500 pt-4 border-t">
              <p>Property ID: {propertyId}</p>
              <p>Last Updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
