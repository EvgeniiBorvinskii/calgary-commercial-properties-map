const axios = require('axios');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function updateData() {
  try {
    console.log('[Update Script] Starting data update...');
    console.log('[Update Script] Time:', new Date().toISOString());

    const response = await axios.post(`${API_URL}/api/update`, {
      timeout: 60000,
    });

    if (response.data.success) {
      console.log('[Update Script] ✓ Data updated successfully');
      console.log('[Update Script] Updated properties:', response.data.updated);
      console.log('[Update Script] Timestamp:', response.data.timestamp);
    } else {
      console.error('[Update Script] ✗ Update failed:', response.data.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('[Update Script] ✗ Error during update:', error.message);
    process.exit(1);
  }
}

// Run the update
updateData();
