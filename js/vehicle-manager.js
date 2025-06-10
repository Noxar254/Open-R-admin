// Vehicle Management Module
class VehicleManager {
  constructor() {
    this.vehicles = [];
    this.filteredVehicles = [];
    this.currentEditingVehicle = null;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    console.log("🚗 Initializing Vehicle Manager...");

    // Search functionality
    const searchInput = document.getElementById('vehicle-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterVehicles(e.target.value);
      });
    }

    // Filter dropdowns
    const statusFilter = document.getElementById('vehicle-status-filter');
    const typeFilter = document.getElementById('vehicle-type-filter');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }

    console.log("✅ Vehicle Manager event listeners initialized");
  }

  async loadVehicles() {
    try {
      console.log("📊 Loading vehicles...");
      
      // Show loading state
      this.showLoadingState();
      
      // Get vehicles from Firebase
      this.vehicles = await AdminFirebaseManager.getAllVehicles();
      this.filteredVehicles = [...this.vehicles];
      
      // Display vehicles
      this.displayVehicles();
      
      console.log(`✅ Loaded ${this.vehicles.length} vehicles`);
      
    } catch (error) {
      console.error("❌ Error loading vehicles:", error);
      AdminFirebaseManager.showNotification('Error loading vehicles', 'error');
    }
  }

  displayVehicles() {
    const grid = document.getElementById('vehicles-grid');
    if (!grid) return;

    // Hide loading state
    this.hideLoadingState();

    // Clear existing content
    grid.innerHTML = '';

    if (this.filteredVehicles.length === 0) {
      grid.innerHTML = `
        <div class="no-data">
          <i class="fas fa-car" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <h3>No vehicles found</h3>
          <p>No vehicles match your current filters.</p>
          <button class="btn btn-primary" onclick="adminPortal.showAddVehicleModal()">
            <i class="fas fa-plus"></i> Add First Vehicle
          </button>
        </div>
      `;
      return;
    }

    // Create vehicle cards
    this.filteredVehicles.forEach(vehicle => {
      const vehicleCard = this.createVehicleCard(vehicle);
      grid.appendChild(vehicleCard);
    });
  }

  createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'admin-item-card vehicle-card';
    card.dataset.vehicleId = vehicle.id;
    card.dataset.status = vehicle.status;
    card.dataset.type = vehicle.type || '';
    
    // Status styling
    const statusClass = this.getStatusClass(vehicle.status);
    const statusText = this.getStatusText(vehicle.status);
    
    // Date formatting
    const createdDate = vehicle.createdAt?.toDate?.() || new Date();
    const updatedDate = vehicle.updatedAt?.toDate?.() || new Date();
    
    card.innerHTML = `
      <div class="item-image">
        <img src="${vehicle.images?.[0] || 'assets/images/placeholder-car.jpg'}" 
             alt="${vehicle.make} ${vehicle.model}"
             loading="lazy"
             onerror="this.src='assets/images/placeholder-car.jpg'">
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="image-count">
          <i class="fas fa-images"></i> ${vehicle.images?.length || 0}
        </div>
      </div>
      
      <div class="item-info">
        <div class="vehicle-header">
          <h3>${vehicle.make} ${vehicle.model}</h3>
          <span class="vehicle-year">${vehicle.year}</span>
        </div>
        
        <div class="vehicle-price">
          <span class="currency">KES</span>
          <span class="amount">${this.formatPrice(vehicle.price)}</span>
        </div>
        
        <div class="vehicle-details">
          <div class="detail-item">
            <i class="fas fa-road"></i>
            <span>${vehicle.mileage ? this.formatNumber(vehicle.mileage) + ' km' : 'N/A'}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-gas-pump"></i>
            <span>${vehicle.fuelType || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <i class="fas fa-cogs"></i>
            <span>${vehicle.transmission || 'N/A'}</span>
          </div>
        </div>
        
        <div class="vehicle-meta">
          <div class="meta-item">
            <span class="label">ID:</span>
            <span class="value">${vehicle.vehicleId}</span>
          </div>
          <div class="meta-item">
            <span class="label">Added:</span>
            <span class="value">${this.formatDate(createdDate)}</span>
          </div>
        </div>
        
        <div class="vehicle-description">
          ${this.truncateText(vehicle.description || 'No description provided', 120)}
        </div>
      </div>
      
      <div class="item-actions">
        <button class="btn btn-sm btn-primary" 
                onclick="vehicleManager.editVehicle('${vehicle.id}')"
                title="Edit Vehicle">
          <i class="fas fa-edit"></i> Edit
        </button>
        
        <button class="btn btn-sm btn-info" 
                onclick="vehicleManager.viewVehicle('${vehicle.id}')"
                title="View Details">
          <i class="fas fa-eye"></i> View
        </button>
        
        <button class="btn btn-sm ${vehicle.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                onclick="vehicleManager.toggleStatus('${vehicle.id}', '${vehicle.status}')"
                title="${vehicle.status === 'active' ? 'Deactivate' : 'Activate'} Vehicle">
          <i class="fas fa-toggle-${vehicle.status === 'active' ? 'off' : 'on'}"></i>
          ${vehicle.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        
        <button class="btn btn-sm btn-danger" 
                onclick="vehicleManager.deleteVehicle('${vehicle.id}')"
                title="Delete Vehicle">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    return card;
  }

  getStatusClass(status) {
    switch (status) {
      case 'active': return 'success';
      case 'sold': return 'warning';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'active': return 'Active';
      case 'sold': return 'Sold';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  }

  formatPrice(price) {
    if (!price) return '0';
    return new Intl.NumberFormat().format(price);
  }

  formatNumber(number) {
    if (!number) return '0';
    return new Intl.NumberFormat().format(number);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  filterVehicles(searchTerm = '') {
    const searchLower = searchTerm.toLowerCase();
    
    this.filteredVehicles = this.vehicles.filter(vehicle => {
      const searchFields = [
        vehicle.make,
        vehicle.model,
        vehicle.vehicleId,
        vehicle.year?.toString(),
        vehicle.fuelType,
        vehicle.transmission,
        vehicle.description
      ].join(' ').toLowerCase();
      
      return searchFields.includes(searchLower);
    });
    
    this.applyFilters();
  }

  applyFilters() {
    const statusFilter = document.getElementById('vehicle-status-filter')?.value || 'all';
    const typeFilter = document.getElementById('vehicle-type-filter')?.value || 'all';
    
    let filtered = [...this.filteredVehicles];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.type === typeFilter);
    }
    
    this.filteredVehicles = filtered;
    this.displayVehicles();
    
    // Update filter counts
    this.updateFilterCounts();
  }

  updateFilterCounts() {
    const totalCount = this.vehicles.length;
    const filteredCount = this.filteredVehicles.length;
    
    // You can add count displays to your UI here
    console.log(`Showing ${filteredCount} of ${totalCount} vehicles`);
  }

  async editVehicle(vehicleId) {
    try {
      const vehicle = this.vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        AdminFirebaseManager.showNotification('Vehicle not found', 'error');
        return;
      }

      this.currentEditingVehicle = vehicle;
      
      // Populate form with vehicle data
      this.populateVehicleForm(vehicle);
      
      // Update modal title
      document.getElementById('vehicle-modal-title').textContent = 'Edit Vehicle';
      
      // Show modal
      document.getElementById('vehicle-modal').style.display = 'block';
      
    } catch (error) {
      console.error('Error editing vehicle:', error);
      AdminFirebaseManager.showNotification('Error loading vehicle for editing', 'error');
    }
  }

  populateVehicleForm(vehicle) {
    const form = document.getElementById('vehicle-form');
    if (!form) return;

    // Populate form fields
    const fields = [
      'make', 'model', 'year', 'price', 'mileage', 
      'fuelType', 'transmission', 'condition', 'description'
    ];

    fields.forEach(field => {
      const element = form.querySelector(`[name="${field}"]`);
      if (element && vehicle[field] !== undefined) {
        element.value = vehicle[field];
      }
    });

    // Handle existing images preview
    const previewContainer = document.getElementById('vehicle-image-preview');
    if (previewContainer && vehicle.images) {
      previewContainer.innerHTML = '';
      
      vehicle.images.forEach((imageUrl, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-preview-item existing-image';
        imageDiv.innerHTML = `
          <img src="${imageUrl}" alt="Vehicle Image ${index + 1}">
          <div class="image-info">
            <span>Existing Image ${index + 1}</span>
            <button type="button" class="btn btn-sm btn-danger" 
                    onclick="vehicleManager.removeExistingImage(${index})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
        previewContainer.appendChild(imageDiv);
      });
    }
  }

  removeExistingImage(index) {
    if (!this.currentEditingVehicle) return;
    
    if (confirm('Are you sure you want to remove this image?')) {
      this.currentEditingVehicle.images.splice(index, 1);
      this.populateVehicleForm(this.currentEditingVehicle);
    }
  }

  async viewVehicle(vehicleId) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
      AdminFirebaseManager.showNotification('Vehicle not found', 'error');
      return;
    }

    // Create and show vehicle details modal
    this.showVehicleDetailsModal(vehicle);
  }

  showVehicleDetailsModal(vehicle) {
    // Create modal content
    const modalHtml = `
      <div class="modal" id="vehicle-details-modal">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <h3>${vehicle.make} ${vehicle.model} (${vehicle.year})</h3>
            <span class="close" onclick="vehicleManager.closeDetailsModal()">&times;</span>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="vehicle-details-grid">
              <div class="vehicle-images">
                <div class="main-image">
                  <img src="${vehicle.images?.[0] || 'assets/images/placeholder-car.jpg'}" 
                       alt="${vehicle.make} ${vehicle.model}" id="main-vehicle-image">
                </div>
                <div class="image-thumbnails">
                  ${vehicle.images?.map((img, index) => `
                    <img src="${img}" alt="Image ${index + 1}" 
                         onclick="vehicleManager.changeMainImage('${img}')"
                         class="thumbnail ${index === 0 ? 'active' : ''}">
                  `).join('') || ''}
                </div>
              </div>
              <div class="vehicle-info-detailed">
                <div class="price-section">
                  <span class="price">KES ${this.formatPrice(vehicle.price)}</span>
                  <span class="status-badge ${this.getStatusClass(vehicle.status)}">${this.getStatusText(vehicle.status)}</span>
                </div>
                
                <div class="specs-grid">
                  <div class="spec-item">
                    <span class="label">Make:</span>
                    <span class="value">${vehicle.make}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Model:</span>
                    <span class="value">${vehicle.model}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Year:</span>
                    <span class="value">${vehicle.year}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Mileage:</span>
                    <span class="value">${vehicle.mileage ? this.formatNumber(vehicle.mileage) + ' km' : 'N/A'}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Fuel Type:</span>
                    <span class="value">${vehicle.fuelType || 'N/A'}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Transmission:</span>
                    <span class="value">${vehicle.transmission || 'N/A'}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Condition:</span>
                    <span class="value">${vehicle.condition || 'N/A'}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Vehicle ID:</span>
                    <span class="value">${vehicle.vehicleId}</span>
                  </div>
                </div>
                
                <div class="description-section">
                  <h4>Description</h4>
                  <p>${vehicle.description || 'No description provided'}</p>
                </div>
                
                <div class="meta-section">
                  <div class="meta-item">
                    <span class="label">Created:</span>
                    <span class="value">${this.formatDate(vehicle.createdAt?.toDate?.() || new Date())}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">Updated:</span>
                    <span class="value">${this.formatDate(vehicle.updatedAt?.toDate?.() || new Date())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    document.getElementById('vehicle-details-modal').style.display = 'block';
  }

  changeMainImage(imageUrl) {
    const mainImage = document.getElementById('main-vehicle-image');
    if (mainImage) {
      mainImage.src = imageUrl;
    }
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.classList.remove('active');
      if (thumb.src === imageUrl) {
        thumb.classList.add('active');
      }
    });
  }

  closeDetailsModal() {
    const modal = document.getElementById('vehicle-details-modal');
    if (modal) {
      modal.remove();
    }
  }

  async toggleStatus(vehicleId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this vehicle?`)) {
      const result = await AdminFirebaseManager.updateVehicleStatus(vehicleId, newStatus);
      
      if (result.success) {
        // Update local data
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          vehicle.status = newStatus;
        }
        
        // Refresh display
        this.applyFilters();
        
        // Refresh dashboard if admin portal is available
        if (window.adminPortal) {
          adminPortal.loadDashboardData();
        }
      }
    }
  }

  async deleteVehicle(vehicleId) {
    const vehicle = this.vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const confirmMessage = `Are you sure you want to delete "${vehicle.make} ${vehicle.model}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      const result = await AdminFirebaseManager.deleteVehicle(vehicleId);
      
      if (result.success) {
        // Remove from local data
        this.vehicles = this.vehicles.filter(v => v.id !== vehicleId);
        
        // Refresh display
        this.applyFilters();
        
        // Refresh dashboard if admin portal is available
        if (window.adminPortal) {
          adminPortal.loadDashboardData();
        }
      }
    }
  }

  showLoadingState() {
    const grid = document.getElementById('vehicles-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading vehicles...</span>
        </div>
      `;
    }
  }

  hideLoadingState() {
    // Loading state is hidden when content is displayed
  }

  // Export functionality
  exportVehicles() {
    try {
      const csvData = this.convertToCSV(this.vehicles);
      this.downloadCSV(csvData, 'vehicles-export.csv');
      AdminFirebaseManager.showNotification('Vehicles exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting vehicles:', error);
      AdminFirebaseManager.showNotification('Error exporting vehicles', 'error');
    }
  }

  convertToCSV(vehicles) {
    if (vehicles.length === 0) return '';
    
    const headers = [
      'Vehicle ID', 'Make', 'Model', 'Year', 'Price', 'Mileage', 
      'Fuel Type', 'Transmission', 'Condition', 'Status', 'Description', 'Created Date'
    ];
    
    const csvRows = [headers.join(',')];
    
    vehicles.forEach(vehicle => {
      const row = [
        vehicle.vehicleId || '',
        vehicle.make || '',
        vehicle.model || '',
        vehicle.year || '',
        vehicle.price || '',
        vehicle.mileage || '',
        vehicle.fuelType || '',
        vehicle.transmission || '',
        vehicle.condition || '',
        vehicle.status || '',
        `"${(vehicle.description || '').replace(/"/g, '""')}"`,
        vehicle.createdAt?.toDate?.().toLocaleDateString() || ''
      ];
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  downloadCSV(csvData, filename) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Statistics
  getVehicleStats() {
    const stats = {
      total: this.vehicles.length,
      active: this.vehicles.filter(v => v.status === 'active').length,
      sold: this.vehicles.filter(v => v.status === 'sold').length,
      inactive: this.vehicles.filter(v => v.status === 'inactive').length,
      averagePrice: 0,
      totalValue: 0
    };

    if (stats.total > 0) {
      const prices = this.vehicles
        .filter(v => v.price && v.status === 'active')
        .map(v => v.price);
      
      if (prices.length > 0) {
        stats.totalValue = prices.reduce((sum, price) => sum + price, 0);
        stats.averagePrice = stats.totalValue / prices.length;
      }
    }

    return stats;
  }
}

// Initialize Vehicle Manager
let vehicleManager;

document.addEventListener('DOMContentLoaded', function() {
  vehicleManager = new VehicleManager();
  console.log("✅ Vehicle Manager initialized");
});

console.log("🚗 Vehicle Manager script loaded");
