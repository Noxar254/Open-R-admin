// Property Management Module
class PropertyManager {
  constructor() {
    this.properties = [];
    this.filteredProperties = [];
    this.currentEditingProperty = null;
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    console.log("🏠 Initializing Property Manager...");

    // Search functionality
    const searchInput = document.getElementById('property-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterProperties(e.target.value);
      });
    }

    // Filter dropdowns
    const statusFilter = document.getElementById('property-status-filter');
    const typeFilter = document.getElementById('property-type-filter');
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }

    console.log("✅ Property Manager event listeners initialized");
  }

  async loadProperties() {
    try {
      console.log("📊 Loading properties...");
      
      // Show loading state
      this.showLoadingState();
      
      // Get properties from Firebase
      this.properties = await AdminFirebaseManager.getAllProperties();
      this.filteredProperties = [...this.properties];
      
      // Display properties
      this.displayProperties();
      
      console.log(`✅ Loaded ${this.properties.length} properties`);
      
    } catch (error) {
      console.error("❌ Error loading properties:", error);
      AdminFirebaseManager.showNotification('Error loading properties', 'error');
    }
  }

  displayProperties() {
    const grid = document.getElementById('properties-grid');
    if (!grid) return;

    // Hide loading state
    this.hideLoadingState();

    // Clear existing content
    grid.innerHTML = '';

    if (this.filteredProperties.length === 0) {
      grid.innerHTML = `
        <div class="no-data">
          <i class="fas fa-home" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <h3>No properties found</h3>
          <p>No properties match your current filters.</p>
          <button class="btn btn-primary" onclick="adminPortal.showAddPropertyModal()">
            <i class="fas fa-plus"></i> Add First Property
          </button>
        </div>
      `;
      return;
    }

    // Create property cards
    this.filteredProperties.forEach(property => {
      const propertyCard = this.createPropertyCard(property);
      grid.appendChild(propertyCard);
    });
  }

  createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'admin-item-card property-card';
    card.dataset.propertyId = property.id;
    card.dataset.status = property.status;
    card.dataset.type = property.type || '';
    
    // Status styling
    const statusClass = this.getStatusClass(property.status);
    const statusText = this.getStatusText(property.status);
    
    // Date formatting
    const createdDate = property.createdAt?.toDate?.() || new Date();
    
    card.innerHTML = `
      <div class="item-image">
        <img src="${property.images?.[0] || 'assets/images/placeholder-property.jpg'}" 
             alt="${property.title}"
             loading="lazy"
             onerror="this.src='assets/images/placeholder-property.jpg'">
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="image-count">
          <i class="fas fa-images"></i> ${property.images?.length || 0}
        </div>
        <div class="property-type-badge">${this.formatPropertyType(property.type)}</div>
      </div>
      
      <div class="item-info">
        <div class="property-header">
          <h3>${property.title}</h3>
          <span class="property-status-text">${property.propertyStatus || 'For Sale'}</span>
        </div>
        
        <div class="property-location">
          <i class="fas fa-map-marker-alt"></i>
          <span>${property.location}</span>
        </div>
        
        <div class="property-price">
          <span class="currency">KES</span>
          <span class="amount">${this.formatPrice(property.price)}</span>
          <span class="price-type">${this.getPriceType(property.propertyStatus)}</span>
        </div>
        
        <div class="property-features">
          ${property.bedrooms ? `
            <div class="feature-item">
              <i class="fas fa-bed"></i>
              <span>${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
          ${property.bathrooms ? `
            <div class="feature-item">
              <i class="fas fa-bath"></i>
              <span>${property.bathrooms} bath${property.bathrooms > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
          ${property.area ? `
            <div class="feature-item">
              <i class="fas fa-expand"></i>
              <span>${this.formatNumber(property.area)} sq ft</span>
            </div>
          ` : ''}
        </div>
        
        <div class="property-meta">
          <div class="meta-item">
            <span class="label">ID:</span>
            <span class="value">${property.propertyId}</span>
          </div>
          <div class="meta-item">
            <span class="label">Added:</span>
            <span class="value">${this.formatDate(createdDate)}</span>
          </div>
        </div>
        
        <div class="property-description">
          ${this.truncateText(property.description || 'No description provided', 120)}
        </div>
      </div>
      
      <div class="item-actions">
        <button class="btn btn-sm btn-primary" 
                onclick="propertyManager.editProperty('${property.id}')"
                title="Edit Property">
          <i class="fas fa-edit"></i> Edit
        </button>
        
        <button class="btn btn-sm btn-info" 
                onclick="propertyManager.viewProperty('${property.id}')"
                title="View Details">
          <i class="fas fa-eye"></i> View
        </button>
        
        <button class="btn btn-sm ${property.status === 'active' ? 'btn-warning' : 'btn-success'}" 
                onclick="propertyManager.toggleStatus('${property.id}', '${property.status}')"
                title="${property.status === 'active' ? 'Deactivate' : 'Activate'} Property">
          <i class="fas fa-toggle-${property.status === 'active' ? 'off' : 'on'}"></i>
          ${property.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        
        <button class="btn btn-sm btn-danger" 
                onclick="propertyManager.deleteProperty('${property.id}')"
                title="Delete Property">
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
      case 'rented': return 'info';
      case 'inactive': return 'secondary';
      default: return 'secondary';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'active': return 'Active';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      case 'inactive': return 'Inactive';
      default: return 'Unknown';
    }
  }

  formatPropertyType(type) {
    if (!type) return 'Property';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  getPriceType(propertyStatus) {
    switch (propertyStatus) {
      case 'for-rent': return '/month';
      case 'for-sale': return '';
      default: return '';
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

  filterProperties(searchTerm = '') {
    const searchLower = searchTerm.toLowerCase();
    
    this.filteredProperties = this.properties.filter(property => {
      const searchFields = [
        property.title,
        property.propertyId,
        property.location,
        property.type,
        property.propertyStatus,
        property.description
      ].join(' ').toLowerCase();
      
      return searchFields.includes(searchLower);
    });
    
    this.applyFilters();
  }

  applyFilters() {
    const statusFilter = document.getElementById('property-status-filter')?.value || 'all';
    const typeFilter = document.getElementById('property-type-filter')?.value || 'all';
    
    let filtered = [...this.filteredProperties];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(property => property.propertyStatus === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(property => property.type === typeFilter);
    }
    
    this.filteredProperties = filtered;
    this.displayProperties();
    
    // Update filter counts
    this.updateFilterCounts();
  }

  updateFilterCounts() {
    const totalCount = this.properties.length;
    const filteredCount = this.filteredProperties.length;
    
    console.log(`Showing ${filteredCount} of ${totalCount} properties`);
  }

  async editProperty(propertyId) {
    try {
      const property = this.properties.find(p => p.id === propertyId);
      if (!property) {
        AdminFirebaseManager.showNotification('Property not found', 'error');
        return;
      }

      this.currentEditingProperty = property;
      
      // Populate form with property data
      this.populatePropertyForm(property);
      
      // Update modal title
      document.getElementById('property-modal-title').textContent = 'Edit Property';
      
      // Show modal
      document.getElementById('property-modal').style.display = 'block';
      
    } catch (error) {
      console.error('Error editing property:', error);
      AdminFirebaseManager.showNotification('Error loading property for editing', 'error');
    }
  }

  populatePropertyForm(property) {
    const form = document.getElementById('property-form');
    if (!form) return;

    // Populate form fields
    const fields = [
      'title', 'type', 'price', 'location', 'bedrooms', 
      'bathrooms', 'area', 'propertyStatus', 'description'
    ];

    fields.forEach(field => {
      const element = form.querySelector(`[name="${field}"]`);
      if (element && property[field] !== undefined) {
        element.value = property[field];
      }
    });

    // Handle existing images preview
    const previewContainer = document.getElementById('property-image-preview');
    if (previewContainer && property.images) {
      previewContainer.innerHTML = '';
      
      property.images.forEach((imageUrl, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'image-preview-item existing-image';
        imageDiv.innerHTML = `
          <img src="${imageUrl}" alt="Property Image ${index + 1}">
          <div class="image-info">
            <span>Existing Image ${index + 1}</span>
            <button type="button" class="btn btn-sm btn-danger" 
                    onclick="propertyManager.removeExistingImage(${index})">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `;
        previewContainer.appendChild(imageDiv);
      });
    }
  }

  removeExistingImage(index) {
    if (!this.currentEditingProperty) return;
    
    if (confirm('Are you sure you want to remove this image?')) {
      this.currentEditingProperty.images.splice(index, 1);
      this.populatePropertyForm(this.currentEditingProperty);
    }
  }

  async viewProperty(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (!property) {
      AdminFirebaseManager.showNotification('Property not found', 'error');
      return;
    }

    // Create and show property details modal
    this.showPropertyDetailsModal(property);
  }

  showPropertyDetailsModal(property) {
    // Create modal content
    const modalHtml = `
      <div class="modal" id="property-details-modal">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <h3>${property.title}</h3>
            <span class="close" onclick="propertyManager.closeDetailsModal()">&times;</span>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="property-details-grid">
              <div class="property-images">
                <div class="main-image">
                  <img src="${property.images?.[0] || 'assets/images/placeholder-property.jpg'}" 
                       alt="${property.title}" id="main-property-image">
                </div>
                <div class="image-thumbnails">
                  ${property.images?.map((img, index) => `
                    <img src="${img}" alt="Image ${index + 1}" 
                         onclick="propertyManager.changeMainImage('${img}')"
                         class="thumbnail ${index === 0 ? 'active' : ''}">
                  `).join('') || ''}
                </div>
              </div>
              <div class="property-info-detailed">
                <div class="price-section">
                  <span class="price">KES ${this.formatPrice(property.price)}${this.getPriceType(property.propertyStatus)}</span>
                  <span class="status-badge ${this.getStatusClass(property.status)}">${this.getStatusText(property.status)}</span>
                </div>
                
                <div class="location-section">
                  <h4><i class="fas fa-map-marker-alt"></i> ${property.location}</h4>
                </div>
                
                <div class="specs-grid">
                  <div class="spec-item">
                    <span class="label">Type:</span>
                    <span class="value">${this.formatPropertyType(property.type)}</span>
                  </div>
                  <div class="spec-item">
                    <span class="label">Status:</span>
                    <span class="value">${property.propertyStatus || 'For Sale'}</span>
                  </div>
                  ${property.bedrooms ? `
                    <div class="spec-item">
                      <span class="label">Bedrooms:</span>
                      <span class="value">${property.bedrooms}</span>
                    </div>
                  ` : ''}
                  ${property.bathrooms ? `
                    <div class="spec-item">
                      <span class="label">Bathrooms:</span>
                      <span class="value">${property.bathrooms}</span>
                    </div>
                  ` : ''}
                  ${property.area ? `
                    <div class="spec-item">
                      <span class="label">Area:</span>
                      <span class="value">${this.formatNumber(property.area)} sq ft</span>
                    </div>
                  ` : ''}
                  <div class="spec-item">
                    <span class="label">Property ID:</span>
                    <span class="value">${property.propertyId}</span>
                  </div>
                </div>
                
                <div class="description-section">
                  <h4>Description</h4>
                  <p>${property.description || 'No description provided'}</p>
                </div>
                
                <div class="meta-section">
                  <div class="meta-item">
                    <span class="label">Created:</span>
                    <span class="value">${this.formatDate(property.createdAt?.toDate?.() || new Date())}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">Updated:</span>
                    <span class="value">${this.formatDate(property.updatedAt?.toDate?.() || new Date())}</span>
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
    document.getElementById('property-details-modal').style.display = 'block';
  }

  changeMainImage(imageUrl) {
    const mainImage = document.getElementById('main-property-image');
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
    const modal = document.getElementById('property-details-modal');
    if (modal) {
      modal.remove();
    }
  }

  async toggleStatus(propertyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this property?`)) {
      const result = await AdminFirebaseManager.updatePropertyStatus(propertyId, newStatus);
      
      if (result.success) {
        // Update local data
        const property = this.properties.find(p => p.id === propertyId);
        if (property) {
          property.status = newStatus;
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

  async deleteProperty(propertyId) {
    const property = this.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const confirmMessage = `Are you sure you want to delete "${property.title}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      try {
        // Update status to deleted instead of permanent deletion
        await adminDb.collection('properties').doc(propertyId).update({
          status: 'deleted',
          deletedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Remove from local data
        this.properties = this.properties.filter(p => p.id !== propertyId);
        
        // Refresh display
        this.applyFilters();
        
        // Refresh dashboard if admin portal is available
        if (window.adminPortal) {
          adminPortal.loadDashboardData();
        }
        
        AdminFirebaseManager.showNotification('Property deleted successfully!', 'success');
        
      } catch (error) {
        console.error('Error deleting property:', error);
        AdminFirebaseManager.showNotification('Error deleting property: ' + error.message, 'error');
      }
    }
  }

  showLoadingState() {
    const grid = document.getElementById('properties-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading properties...</span>
        </div>
      `;
    }
  }

  hideLoadingState() {
    // Loading state is hidden when content is displayed
  }

  // Export functionality
  exportProperties() {
    try {
      const csvData = this.convertToCSV(this.properties);
      this.downloadCSV(csvData, 'properties-export.csv');
      AdminFirebaseManager.showNotification('Properties exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting properties:', error);
      AdminFirebaseManager.showNotification('Error exporting properties', 'error');
    }
  }

  convertToCSV(properties) {
    if (properties.length === 0) return '';
    
    const headers = [
      'Property ID', 'Title', 'Type', 'Location', 'Price', 'Status', 
      'Bedrooms', 'Bathrooms', 'Area', 'Description', 'Created Date'
    ];
    
    const csvRows = [headers.join(',')];
    
    properties.forEach(property => {
      const row = [
        property.propertyId || '',
        `"${(property.title || '').replace(/"/g, '""')}"`,
        property.type || '',
        `"${(property.location || '').replace(/"/g, '""')}"`,
        property.price || '',
        property.propertyStatus || '',
        property.bedrooms || '',
        property.bathrooms || '',
        property.area || '',
        `"${(property.description || '').replace(/"/g, '""')}"`,
        property.createdAt?.toDate?.().toLocaleDateString() || ''
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
  getPropertyStats() {
    const stats = {
      total: this.properties.length,
      active: this.properties.filter(p => p.status === 'active').length,
      forSale: this.properties.filter(p => p.propertyStatus === 'for-sale').length,
      forRent: this.properties.filter(p => p.propertyStatus === 'for-rent').length,
      sold: this.properties.filter(p => p.propertyStatus === 'sold').length,
      rented: this.properties.filter(p => p.propertyStatus === 'rented').length,
      averagePrice: 0,
      totalValue: 0
    };

    if (stats.total > 0) {
      const prices = this.properties
        .filter(p => p.price && p.status === 'active')
        .map(p => p.price);
      
      if (prices.length > 0) {
        stats.totalValue = prices.reduce((sum, price) => sum + price, 0);
        stats.averagePrice = stats.totalValue / prices.length;
      }
    }

    return stats;
  }
}

// Initialize Property Manager
let propertyManager;

document.addEventListener('DOMContentLoaded', function() {
  propertyManager = new PropertyManager();
  console.log("✅ Property Manager initialized");
});

console.log("🏠 Property Manager script loaded");
