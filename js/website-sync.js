// Website Synchronization Manager
class WebsiteSync {
  constructor() {
    this.syncInProgress = false;
  }

  async syncToWebsite() {
    if (this.syncInProgress) {
      AdminFirebaseManager.showNotification('Sync already in progress...', 'warning');
      return;
    }

    try {
      this.syncInProgress = true;
      console.log("🔄 Starting website synchronization...");
      
      // Get all data from Firebase
      const [vehicles, properties, enquiries, listings, newsletters] = await Promise.all([
        AdminFirebaseManager.getAllVehicles(),
        AdminFirebaseManager.getAllProperties(),
        AdminFirebaseManager.getAllEnquiries(),
        AdminFirebaseManager.getAllListings(),
        AdminFirebaseManager.getAllNewsletterSubscriptions()
      ]);

      // Filter only active items for public website
      const activeVehicles = vehicles.filter(v => v.status === 'active');
      const activeProperties = properties.filter(p => p.status === 'active');

      // Generate website data files
      await this.generateVehiclesData(activeVehicles);
      await this.generatePropertiesData(activeProperties);
      await this.generateGeneralData({
        totalVehicles: activeVehicles.length,
        totalProperties: activeProperties.length,
        lastUpdate: new Date().toISOString()
      });

      // Update sync timestamp
      const syncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', syncTime);
      
      console.log("✅ Website synchronization completed");
      AdminFirebaseManager.showNotification(`Website synced successfully! ${activeVehicles.length} vehicles, ${activeProperties.length} properties`, 'success');
      
      return { success: true };

    } catch (error) {
      console.error("❌ Website sync failed:", error);
      AdminFirebaseManager.showNotification('Website sync failed: ' + error.message, 'error');
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  async generateVehiclesData(vehicles) {
    console.log(`📄 Generating vehicles data file (${vehicles.length} vehicles)...`);
    
    const vehiclesData = {
      lastUpdate: new Date().toISOString(),
      totalCount: vehicles.length,
      vehicles: vehicles.map(vehicle => ({
        id: vehicle.id,
        vehicleId: vehicle.vehicleId,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        mileage: vehicle.mileage,
        fuelType: vehicle.fuelType,
        transmission: vehicle.transmission,
        condition: vehicle.condition,
        description: vehicle.description,
        images: vehicle.images,
        status: vehicle.status,
        createdAt: vehicle.createdAt?.toDate?.() || vehicle.createdAt,
        updatedAt: vehicle.updatedAt?.toDate?.() || vehicle.updatedAt
      }))
    };

    // Generate JavaScript file for website
    const jsContent = `// Auto-generated vehicles data - Last updated: ${new Date().toLocaleString()}
window.vehiclesData = ${JSON.stringify(vehiclesData, null, 2)};

// Helper function to get all vehicles
function getAllVehicles() {
  return window.vehiclesData.vehicles;
}

// Helper function to get vehicle by ID
function getVehicleById(id) {
  return window.vehiclesData.vehicles.find(v => v.id === id || v.vehicleId === id);
}

// Helper function to search vehicles
function searchVehicles(query) {
  const searchTerm = query.toLowerCase();
  return window.vehiclesData.vehicles.filter(vehicle => 
    vehicle.make.toLowerCase().includes(searchTerm) ||
    vehicle.model.toLowerCase().includes(searchTerm) ||
    vehicle.description.toLowerCase().includes(searchTerm)
  );
}

// Helper function to filter vehicles by criteria
function filterVehicles(filters) {
  let filtered = window.vehiclesData.vehicles;
  
  if (filters.minPrice) {
    filtered = filtered.filter(v => v.price >= filters.minPrice);
  }
  if (filters.maxPrice) {
    filtered = filtered.filter(v => v.price <= filters.maxPrice);
  }
  if (filters.make) {
    filtered = filtered.filter(v => v.make.toLowerCase() === filters.make.toLowerCase());
  }
  if (filters.fuelType) {
    filtered = filtered.filter(v => v.fuelType === filters.fuelType);
  }
  if (filters.transmission) {
    filtered = filtered.filter(v => v.transmission === filters.transmission);
  }
  
  return filtered;
}

console.log("🚗 Vehicles data loaded:", window.vehiclesData.totalCount, "vehicles");`;

    // Save to assets folder for website to use
    this.downloadFile(jsContent, 'vehicles-data.js', 'text/javascript');
    
    // Also save as JSON for other uses
    this.downloadFile(JSON.stringify(vehiclesData, null, 2), 'vehicles-data.json', 'application/json');
  }

  async generatePropertiesData(properties) {
    console.log(`🏠 Generating properties data file (${properties.length} properties)...`);
    
    const propertiesData = {
      lastUpdate: new Date().toISOString(),
      totalCount: properties.length,
      properties: properties.map(property => ({
        id: property.id,
        propertyId: property.propertyId,
        title: property.title,
        type: property.type,
        price: property.price,
        location: property.location,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        propertyStatus: property.propertyStatus,
        description: property.description,
        images: property.images,
        status: property.status,
        createdAt: property.createdAt?.toDate?.() || property.createdAt,
        updatedAt: property.updatedAt?.toDate?.() || property.updatedAt
      }))
    };

    const jsContent = `// Auto-generated properties data - Last updated: ${new Date().toLocaleString()}
window.propertiesData = ${JSON.stringify(propertiesData, null, 2)};

// Helper function to get all properties
function getAllProperties() {
  return window.propertiesData.properties;
}

// Helper function to get property by ID
function getPropertyById(id) {
  return window.propertiesData.properties.find(p => p.id === id || p.propertyId === id);
}

// Helper function to search properties
function searchProperties(query) {
  const searchTerm = query.toLowerCase();
  return window.propertiesData.properties.filter(property => 
    property.title.toLowerCase().includes(searchTerm) ||
    property.location.toLowerCase().includes(searchTerm) ||
    property.description.toLowerCase().includes(searchTerm)
  );
}

// Helper function to filter properties by criteria
function filterProperties(filters) {
  let filtered = window.propertiesData.properties;
  
  if (filters.minPrice) {
    filtered = filtered.filter(p => p.price >= filters.minPrice);
  }
  if (filters.maxPrice) {
    filtered = filtered.filter(p => p.price <= filters.maxPrice);
  }
  if (filters.type) {
    filtered = filtered.filter(p => p.type === filters.type);
  }
  if (filters.location) {
    filtered = filtered.filter(p => p.location.toLowerCase().includes(filters.location.toLowerCase()));
  }
  if (filters.minBedrooms) {
    filtered = filtered.filter(p => p.bedrooms >= filters.minBedrooms);
  }
  if (filters.propertyStatus) {
    filtered = filtered.filter(p => p.propertyStatus === filters.propertyStatus);
  }
  
  return filtered;
}

console.log("🏠 Properties data loaded:", window.propertiesData.totalCount, "properties");`;

    this.downloadFile(jsContent, 'properties-data.js', 'text/javascript');
    this.downloadFile(JSON.stringify(propertiesData, null, 2), 'properties-data.json', 'application/json');
  }

  async generateGeneralData(stats) {
    console.log("📊 Generating general website data...");
    
    const generalData = {
      lastUpdate: stats.lastUpdate,
      statistics: {
        totalVehicles: stats.totalVehicles,
        totalProperties: stats.totalProperties
      },
      metadata: {
        syncVersion: "1.0",
        syncTimestamp: Date.now()
      }
    };

    const jsContent = `// Auto-generated website data - Last updated: ${new Date().toLocaleString()}
window.websiteData = ${JSON.stringify(generalData, null, 2)};

console.log("📊 Website data loaded - Last sync:", new Date(window.websiteData.lastUpdate).toLocaleString());`;

    this.downloadFile(jsContent, 'website-data.js', 'text/javascript');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log(`💾 Generated file: ${filename}`);
  }

  // Generate a complete website integration package
  async generateIntegrationPackage() {
    console.log("📦 Generating complete website integration package...");
    
    try {
      const [vehicles, properties] = await Promise.all([
        AdminFirebaseManager.getAllVehicles(),
        AdminFirebaseManager.getAllProperties()
      ]);

      const activeVehicles = vehicles.filter(v => v.status === 'active');
      const activeProperties = properties.filter(p => p.status === 'active');

      // Generate comprehensive integration file
      const integrationContent = `// Open Road Market - Website Integration Package
// Generated: ${new Date().toLocaleString()}
// This file contains all data and helper functions for your main website

${await this.generateIntegrationJS(activeVehicles, activeProperties)}`;

      this.downloadFile(integrationContent, 'openroad-integration.js', 'text/javascript');
      
      // Generate HTML examples
      const htmlExamples = this.generateHTMLExamples();
      this.downloadFile(htmlExamples, 'integration-examples.html', 'text/html');
      
      AdminFirebaseManager.showNotification('Integration package generated! Check your downloads.', 'success');
      
    } catch (error) {
      console.error("Error generating integration package:", error);
      AdminFirebaseManager.showNotification('Error generating integration package', 'error');
    }
  }

  async generateIntegrationJS(vehicles, properties) {
    return `
// ========== DATA SECTION ==========
window.openRoadData = {
  vehicles: ${JSON.stringify(vehicles, null, 2)},
  properties: ${JSON.stringify(properties, null, 2)},
  lastUpdate: "${new Date().toISOString()}"
};

// ========== VEHICLE FUNCTIONS ==========
function getAllVehicles() {
  return window.openRoadData.vehicles;
}

function getVehicleById(id) {
  return window.openRoadData.vehicles.find(v => v.id === id || v.vehicleId === id);
}

function displayVehicles(containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const vehicles = limit ? window.openRoadData.vehicles.slice(0, limit) : window.openRoadData.vehicles;
  
  container.innerHTML = vehicles.map(vehicle => \`
    <div class="vehicle-card" data-id="\${vehicle.id}">
      <div class="vehicle-image">
        <img src="\${vehicle.images[0] || 'assets/images/placeholder-car.jpg'}" 
             alt="\${vehicle.make} \${vehicle.model}" loading="lazy">
      </div>
      <div class="vehicle-info">
        <h3>\${vehicle.make} \${vehicle.model}</h3>
        <p class="year">\${vehicle.year}</p>
        <p class="price">KES \${vehicle.price.toLocaleString()}</p>
        <p class="details">\${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' km' : ''} • \${vehicle.fuelType}</p>
        <button onclick="viewVehicle('\${vehicle.id}')">View Details</button>
      </div>
    </div>
  \`).join('');
}

// ========== PROPERTY FUNCTIONS ==========
function getAllProperties() {
  return window.openRoadData.properties;
}

function getPropertyById(id) {
  return window.openRoadData.properties.find(p => p.id === id || p.propertyId === id);
}

function displayProperties(containerId, limit = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const properties = limit ? window.openRoadData.properties.slice(0, limit) : window.openRoadData.properties;
  
  container.innerHTML = properties.map(property => \`
    <div class="property-card" data-id="\${property.id}">
      <div class="property-image">
        <img src="\${property.images[0] || 'assets/images/placeholder-property.jpg'}" 
             alt="\${property.title}" loading="lazy">
      </div>
      <div class="property-info">
        <h3>\${property.title}</h3>
        <p class="location">\${property.location}</p>
        <p class="price">KES \${property.price.toLocaleString()}</p>
        <p class="details">\${property.bedrooms} beds • \${property.bathrooms} baths</p>
        <button onclick="viewProperty('\${property.id}')">View Details</button>
      </div>
    </div>
  \`).join('');
}

// ========== SEARCH & FILTER FUNCTIONS ==========
function searchAll(query) {
  const searchTerm = query.toLowerCase();
  const vehicleResults = window.openRoadData.vehicles.filter(v => 
    v.make.toLowerCase().includes(searchTerm) || 
    v.model.toLowerCase().includes(searchTerm) ||
    v.description.toLowerCase().includes(searchTerm)
  );
  const propertyResults = window.openRoadData.properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm) || 
    p.location.toLowerCase().includes(searchTerm) ||
    p.description.toLowerCase().includes(searchTerm)
  );
  
  return { vehicles: vehicleResults, properties: propertyResults };
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚗 Open Road Data loaded:', window.openRoadData.vehicles.length, 'vehicles');
  console.log('🏠 Open Road Data loaded:', window.openRoadData.properties.length, 'properties');
  console.log('📅 Last update:', new Date(window.openRoadData.lastUpdate).toLocaleString());
  
  // Auto-display if containers exist
  if (document.getElementById('vehicles-container')) {
    displayVehicles('vehicles-container');
  }
  if (document.getElementById('properties-container')) {
    displayProperties('properties-container');
  }
});`;
  }

  generateHTMLExamples() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Open Road Market - Integration Examples</title>
    <style>
        .vehicle-card, .property-card {
            border: 1px solid #ddd;
            margin: 10px;
            padding: 15px;
            border-radius: 8px;
        }
        .vehicle-card img, .property-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>Open Road Market - Integration Examples</h1>
    
    <h2>Vehicles Section</h2>
    <div id="vehicles-container"></div>
    
    <h2>Properties Section</h2>
    <div id="properties-container"></div>
    
    <script>
        // Example of how to use the integration
        function viewVehicle(id) {
            const vehicle = getVehicleById(id);
            alert('Vehicle: ' + vehicle.make + ' ' + vehicle.model);
        }
        
        function viewProperty(id) {
            const property = getPropertyById(id);
            alert('Property: ' + property.title);
        }
    </script>
    
    <!-- Include the generated integration file -->
    <script src="openroad-integration.js"></script>
</body>
</html>`;
  }
}

// Initialize the website sync manager
const websiteSync = new WebsiteSync();

console.log("🔄 Website Sync Manager loaded");
