// Main Admin Portal Controller
class AdminPortal {
  constructor() {
    this.currentPage = 'dashboard';
    this.enquiryListener = null;
    this.currentEditingItem = null;
    
    this.initializeEventListeners();
    this.loadDashboardData();
    this.setupRealTimeFeatures();
    this.populateFormOptions();
  }

  initializeEventListeners() {
    console.log("🎯 Initializing Admin Portal...");

    // Navigation
    document.querySelectorAll('.menu-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchPage(link.dataset.page);
      });
    });    // Sync button
    const syncBtn = document.getElementById('sync-website');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => this.syncWithWebsite());
    }    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Keyboard shortcut for theme toggle (Ctrl+Shift+T)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // Initialize theme from localStorage
    this.initializeTheme();

    // Modal triggers
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    if (addVehicleBtn) {
      addVehicleBtn.addEventListener('click', () => this.showAddVehicleModal());
    }

    const addPropertyBtn = document.getElementById('add-property-btn');
    if (addPropertyBtn) {
      addPropertyBtn.addEventListener('click', () => this.showAddPropertyModal());
    }

    // Form submissions
    const vehicleForm = document.getElementById('vehicle-form');
    if (vehicleForm) {
      vehicleForm.addEventListener('submit', (e) => this.handleVehicleSubmit(e));
    }

    const propertyForm = document.getElementById('property-form');
    if (propertyForm) {
      propertyForm.addEventListener('submit', (e) => this.handlePropertySubmit(e));
    }

    // Image preview handlers
    const vehicleImages = document.getElementById('vehicle-images');
    if (vehicleImages) {
      vehicleImages.addEventListener('change', (e) => this.previewImages(e, 'vehicle-image-preview'));
    }

    const propertyImages = document.getElementById('property-images');
    if (propertyImages) {
      propertyImages.addEventListener('change', (e) => this.previewImages(e, 'property-image-preview'));
    }

    // Search and filter handlers
    this.setupSearchAndFilters();

    console.log("✅ Event listeners initialized");
  }

  setupSearchAndFilters() {
    // Vehicle search
    const vehicleSearch = document.getElementById('vehicle-search');
    if (vehicleSearch) {
      vehicleSearch.addEventListener('input', (e) => this.filterVehicles());
    }

    // Vehicle filters
    const vehicleFilters = ['vehicle-status-filter', 'vehicle-type-filter'];
    vehicleFilters.forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', () => this.filterVehicles());
      }
    });

    // Property search and filters
    const propertySearch = document.getElementById('property-search');
    if (propertySearch) {
      propertySearch.addEventListener('input', (e) => this.filterProperties());
    }

    const propertyFilters = ['property-status-filter', 'property-type-filter'];
    propertyFilters.forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', () => this.filterProperties());
      }
    });
  }

  populateFormOptions() {
    // Populate year options
    const yearSelect = document.getElementById('vehicle-year');
    if (yearSelect) {
      const currentYear = new Date().getFullYear();
      yearSelect.innerHTML = '<option value="">Select Year</option>';
      
      for (let year = currentYear + 1; year >= 1990; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      }
    }
  }
  async loadDashboardData() {
    try {
      console.log("📊 Loading dashboard data...");

      // Show loading states
      this.showLoadingState();

      // Load data
      const [vehicles, properties, enquiries, listings, newsletters] = await Promise.all([
        AdminFirebaseManager.getAllVehicles(),
        AdminFirebaseManager.getAllProperties(),
        this.getRecentEnquiries(),
        AdminFirebaseManager.getAllListings(),
        AdminFirebaseManager.getAllNewsletterSubscriptions()
      ]);

      // Update statistics
      this.updateStatistics(vehicles, properties, enquiries, listings, newsletters);

      // Load recent enquiries
      this.displayRecentEnquiries(enquiries.slice(0, 5));

      console.log("✅ Dashboard data loaded successfully");

    } catch (error) {
      console.error("❌ Error loading dashboard data:", error);
      AdminFirebaseManager.showNotification('Error loading dashboard data', 'error');
    }
  }
  updateStatistics(vehicles, properties, enquiries, listings, newsletters) {
    // Update stat cards
    const totalVehicles = document.getElementById('total-vehicles');
    const totalProperties = document.getElementById('total-properties');
    const totalEnquiries = document.getElementById('total-enquiries');
    const totalListings = document.getElementById('total-listings');
    const totalSubscribers = document.getElementById('total-subscribers');

    if (totalVehicles) {
      totalVehicles.textContent = vehicles.filter(v => v.status === 'active').length;
    }
    if (totalProperties) {
      totalProperties.textContent = properties.filter(p => p.status === 'active').length;
    }
    if (totalEnquiries) {
      totalEnquiries.textContent = enquiries.length;
    }
    if (totalListings) {
      totalListings.textContent = listings ? listings.filter(l => l.status === 'pending').length : 0;
    }
    if (totalSubscribers) {
      totalSubscribers.textContent = newsletters ? newsletters.length : 0;
    }

    // Update website views (placeholder)
    const websiteViews = document.getElementById('website-views');
    if (websiteViews) {
      websiteViews.textContent = Math.floor(Math.random() * 1000) + 500; // Placeholder
    }
  }

  showLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-spinner');
    loadingElements.forEach(element => {
      element.style.display = 'flex';
    });
  }

  hideLoadingState() {
    const loadingElements = document.querySelectorAll('.loading-spinner');
    loadingElements.forEach(element => {
      element.style.display = 'none';
    });
  }

  setupRealTimeFeatures() {
    console.log("🔴 Setting up real-time features...");

    // Set up enquiry listener
    if (this.enquiryListener) {
      this.enquiryListener(); // Unsubscribe previous listener
    }

    this.enquiryListener = AdminFirebaseManager.listenToEnquiries((enquiries) => {
      this.handleRealTimeEnquiries(enquiries);
    });
  }

  handleRealTimeEnquiries(enquiries) {
    // Update dashboard enquiries
    this.displayRecentEnquiries(enquiries.slice(0, 5));
    
    // Update enquiry count
    const totalEnquiries = document.getElementById('total-enquiries');
    if (totalEnquiries) {
      totalEnquiries.textContent = enquiries.filter(e => e.status !== 'closed').length;
    }

    // Update enquiries page if active
    if (this.currentPage === 'enquiries') {
      this.displayEnquiriesTable(enquiries);
    }
  }

  async getRecentEnquiries() {
    try {
      const snapshot = await adminDb.collection('enquiries')
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();
      
      const enquiries = [];
      snapshot.forEach((doc) => {
        enquiries.push({ id: doc.id, ...doc.data() });
      });
      
      return enquiries;
    } catch (error) {
      console.error("❌ Error getting enquiries:", error);
      return [];
    }
  }

  displayRecentEnquiries(enquiries) {
    const container = document.getElementById('recent-enquiries');
    if (!container) return;

    // Hide loading
    this.hideLoadingState();

    if (enquiries.length === 0) {
      container.innerHTML = '<div class="no-data">No recent enquiries</div>';
      return;
    }

    container.innerHTML = '';

    enquiries.forEach(enquiry => {
      const enquiryCard = document.createElement('div');
      enquiryCard.className = 'enquiry-card';
      
      const enquiryDate = enquiry.timestamp?.toDate?.() || new Date();
      const timeAgo = this.getTimeAgo(enquiryDate);
      
      enquiryCard.innerHTML = `
        <div class="enquiry-header">
          <div class="enquiry-info">
            <h4>${enquiry.name}</h4>
            <span class="enquiry-type">${enquiry.type || 'General'}</span>
          </div>
          <span class="enquiry-time">${timeAgo}</span>
        </div>
        <div class="enquiry-details">
          <p><strong>Email:</strong> ${enquiry.email}</p>
          <p><strong>Phone:</strong> ${enquiry.phone || 'Not provided'}</p>
          ${enquiry.subject ? `<p><strong>Subject:</strong> ${enquiry.subject}</p>` : ''}
          <p class="enquiry-message">${(enquiry.message || '').substring(0, 100)}${(enquiry.message || '').length > 100 ? '...' : ''}</p>
        </div>
        <div class="enquiry-actions">
          <button class="btn btn-sm btn-primary" onclick="adminPortal.viewEnquiry('${enquiry.id}')">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="btn btn-sm btn-secondary" onclick="adminPortal.markAsContacted('${enquiry.id}')">
            <i class="fas fa-phone"></i> Mark Contacted
          </button>
        </div>
      `;
      
      container.appendChild(enquiryCard);
    });
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  }

  switchPage(page) {
    console.log(`📄 Switching to page: ${page}`);

    // Update navigation
    document.querySelectorAll('.menu-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    // Switch content
    document.querySelectorAll('.content-page').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${page}-content`)?.classList.add('active');

    // Update page title
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);
    }

    // Store current page
    this.currentPage = page;

    // Load page-specific data
    this.loadPageData(page);
  }
  async loadPageData(page) {
    try {
      switch (page) {
        case 'vehicles':
          await this.loadVehiclesPage();
          break;
        case 'properties':
          await this.loadPropertiesPage();
          break;
        case 'enquiries':
          await this.loadEnquiriesPage();
          break;
        case 'listings':
          await this.loadListingsPage();
          break;
        case 'newsletters':
          await this.loadNewslettersPage();
          break;
        case 'settings':
          this.loadSettingsPage();
          break;
      }
    } catch (error) {
      console.error(`❌ Error loading ${page} page:`, error);
    }
  }

  async loadVehiclesPage() {
    console.log("🚗 Loading vehicles page...");
    
    const vehicles = await AdminFirebaseManager.getAllVehicles();
    this.displayVehicles(vehicles);
  }

  async loadPropertiesPage() {
    console.log("🏠 Loading properties page...");
    
    const properties = await AdminFirebaseManager.getAllProperties();
    this.displayProperties(properties);
  }
  async loadEnquiriesPage() {
    console.log("📨 Loading enquiries page...");
    
    const enquiries = await this.getRecentEnquiries();
    this.displayEnquiriesTable(enquiries);
  }

  async loadListingsPage() {
    console.log("📝 Loading listings page...");
    
    const listings = await AdminFirebaseManager.getAllListings();
    this.displayListingsTable(listings);
  }

  async loadNewslettersPage() {
    console.log("📧 Loading newsletters page...");
    
    const newsletters = await AdminFirebaseManager.getAllNewsletterSubscriptions();
    this.displayNewslettersTable(newsletters);
  }

  loadSettingsPage() {
    console.log("⚙️ Loading settings page...");
    
    // Update last sync time
    const lastSyncElement = document.getElementById('last-sync-time');
    if (lastSyncElement) {
      const lastSync = localStorage.getItem('lastSyncTime');
      lastSyncElement.textContent = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
    }
  }

  displayVehicles(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    if (!grid) return;

    this.hideLoadingState();

    if (vehicles.length === 0) {
      grid.innerHTML = '<div class="no-data">No vehicles found</div>';
      return;
    }

    grid.innerHTML = '';

    vehicles.forEach(vehicle => {
      const vehicleCard = this.createVehicleCard(vehicle);
      grid.appendChild(vehicleCard);
    });
  }

  createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'admin-item-card vehicle-card';
    card.dataset.status = vehicle.status;
    card.dataset.type = vehicle.type || '';
    
    const statusClass = vehicle.status === 'active' ? 'success' : 
                       vehicle.status === 'sold' ? 'warning' : 'secondary';
    
    card.innerHTML = `
      <div class="item-image">
        <img src="${vehicle.images?.[0] || 'assets/images/placeholder-car.jpg'}" 
             alt="${vehicle.make} ${vehicle.model}" 
             onerror="this.src='assets/images/placeholder-car.jpg'">
        <div class="status-badge ${statusClass}">${vehicle.status}</div>
      </div>
      <div class="item-info">
        <h3>${vehicle.make} ${vehicle.model}</h3>
        <p class="item-details">
          <span><i class="fas fa-calendar"></i> ${vehicle.year}</span>
          <span><i class="fas fa-tag"></i> KES ${vehicle.price?.toLocaleString()}</span>
        </p>
        <p class="item-id">ID: ${vehicle.vehicleId}</p>
        <p class="item-description">${(vehicle.description || '').substring(0, 100)}...</p>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-primary" onclick="adminPortal.editVehicle('${vehicle.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-warning" onclick="adminPortal.toggleVehicleStatus('${vehicle.id}', '${vehicle.status}')">
          <i class="fas fa-toggle-${vehicle.status === 'active' ? 'off' : 'on'}"></i>
          ${vehicle.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="adminPortal.deleteVehicle('${vehicle.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    return card;
  }

  displayProperties(properties) {
    const grid = document.getElementById('properties-grid');
    if (!grid) return;

    this.hideLoadingState();

    if (properties.length === 0) {
      grid.innerHTML = '<div class="no-data">No properties found</div>';
      return;
    }

    grid.innerHTML = '';

    properties.forEach(property => {
      const propertyCard = this.createPropertyCard(property);
      grid.appendChild(propertyCard);
    });
  }

  createPropertyCard(property) {
    const card = document.createElement('div');
    card.className = 'admin-item-card property-card';
    card.dataset.status = property.propertyStatus;
    card.dataset.type = property.type || '';
    
    const statusClass = property.status === 'active' ? 'success' : 'secondary';
    
    card.innerHTML = `
      <div class="item-image">
        <img src="${property.images?.[0] || 'assets/images/placeholder-property.jpg'}" 
             alt="${property.title}" 
             onerror="this.src='assets/images/placeholder-property.jpg'">
        <div class="status-badge ${statusClass}">${property.status}</div>
      </div>
      <div class="item-info">
        <h3>${property.title}</h3>
        <p class="item-details">
          <span><i class="fas fa-map-marker-alt"></i> ${property.location}</span>
          <span><i class="fas fa-tag"></i> KES ${property.price?.toLocaleString()}</span>
        </p>
        <p class="item-id">ID: ${property.propertyId}</p>
        <div class="property-features">
          ${property.bedrooms ? `<span><i class="fas fa-bed"></i> ${property.bedrooms} beds</span>` : ''}
          ${property.bathrooms ? `<span><i class="fas fa-bath"></i> ${property.bathrooms} baths</span>` : ''}
          ${property.area ? `<span><i class="fas fa-expand"></i> ${property.area} sq ft</span>` : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn btn-sm btn-primary" onclick="adminPortal.editProperty('${property.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-warning" onclick="adminPortal.togglePropertyStatus('${property.id}', '${property.status}')">
          <i class="fas fa-toggle-${property.status === 'active' ? 'off' : 'on'}"></i>
          ${property.status === 'active' ? 'Deactivate' : 'Activate'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="adminPortal.deleteProperty('${property.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    return card;
  }

  // Modal Management
  showAddVehicleModal() {
    this.currentEditingItem = null;
    document.getElementById('vehicle-modal-title').textContent = 'Add New Vehicle';
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-image-preview').innerHTML = '';
    document.getElementById('vehicle-modal').style.display = 'block';
  }

  showAddPropertyModal() {
    this.currentEditingItem = null;
    document.getElementById('property-modal-title').textContent = 'Add New Property';
    document.getElementById('property-form').reset();
    document.getElementById('property-image-preview').innerHTML = '';
    document.getElementById('property-modal').style.display = 'block';
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    this.currentEditingItem = null;
  }

  // Form Handlers
  async handleVehicleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const imageFiles = formData.getAll('images');
    
    // Validate images
    if (imageFiles.length === 0 || !imageFiles[0].name) {
      AdminFirebaseManager.showNotification('Please select at least one image', 'error');
      return;
    }

    // Show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
      const vehicleData = {
        make: formData.get('make'),
        model: formData.get('model'),
        year: parseInt(formData.get('year')),
        price: parseFloat(formData.get('price')),
        mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : null,
        fuelType: formData.get('fuelType'),
        transmission: formData.get('transmission'),
        condition: formData.get('condition'),
        description: formData.get('description')
      };

      let result;
      if (this.currentEditingItem) {
        result = await AdminFirebaseManager.updateVehicle(this.currentEditingItem.id, vehicleData, imageFiles);
      } else {
        result = await AdminFirebaseManager.addVehicle(vehicleData, imageFiles);
      }

      if (result.success) {
        this.closeModal('vehicle-modal');
        this.loadVehiclesPage(); // Refresh the vehicles page
        this.loadDashboardData(); // Refresh dashboard stats
      }

    } catch (error) {
      console.error('Error submitting vehicle:', error);
      AdminFirebaseManager.showNotification('Error saving vehicle: ' + error.message, 'error');
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async handlePropertySubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const imageFiles = formData.getAll('images');
    
    // Validate images
    if (imageFiles.length === 0 || !imageFiles[0].name) {
      AdminFirebaseManager.showNotification('Please select at least one image', 'error');
      return;
    }

    // Show loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    try {
      const propertyData = {
        title: formData.get('title'),
        type: formData.get('type'),
        price: parseFloat(formData.get('price')),
        location: formData.get('location'),
        bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms')) : null,
        bathrooms: formData.get('bathrooms') ? parseInt(formData.get('bathrooms')) : null,
        area: formData.get('area') ? parseInt(formData.get('area')) : null,
        propertyStatus: formData.get('propertyStatus'),
        description: formData.get('description')
      };

      let result;
      if (this.currentEditingItem) {
        result = await AdminFirebaseManager.updateProperty(this.currentEditingItem.id, propertyData, imageFiles);
      } else {
        result = await AdminFirebaseManager.addProperty(propertyData, imageFiles);
      }

      if (result.success) {
        this.closeModal('property-modal');
        this.loadPropertiesPage(); // Refresh the properties page
        this.loadDashboardData(); // Refresh dashboard stats
      }

    } catch (error) {
      console.error('Error submitting property:', error);
      AdminFirebaseManager.showNotification('Error saving property: ' + error.message, 'error');
    } finally {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  previewImages(event, previewContainerId) {
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById(previewContainerId);
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageDiv = document.createElement('div');
          imageDiv.className = 'image-preview-item';
          imageDiv.innerHTML = `
            <img src="${e.target.result}" alt="Preview ${index + 1}">
            <div class="image-info">
              <span>${file.name}</span>
              <span>${(file.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          `;
          previewContainer.appendChild(imageDiv);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  async syncWithWebsite() {
    try {
      const syncBtn = document.getElementById('sync-website');
      syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
      syncBtn.disabled = true;

      // Force refresh data
      await this.loadDashboardData();
      
      // Update sync time
      const syncTime = new Date().toISOString();
      localStorage.setItem('lastSyncTime', syncTime);

      // Reset button
      syncBtn.innerHTML = '<i class="fas fa-sync"></i> Sync Website';
      syncBtn.disabled = false;

      AdminFirebaseManager.showNotification('Website synced successfully!', 'success');
      
    } catch (error) {
      console.error('Error syncing website:', error);
      AdminFirebaseManager.showNotification('Sync failed. Please try again.', 'error');
    }
  }

  // Quick Actions
  exportData() {
    AdminFirebaseManager.showNotification('Export feature coming soon!', 'info');
  }

  viewAnalytics() {
    AdminFirebaseManager.showNotification('Analytics feature coming soon!', 'info');
  }

  async testFirebaseConnection() {
    const result = await AdminFirebaseManager.testConnection();
    if (result) {
      AdminFirebaseManager.showNotification('Firebase connection successful!', 'success');
    }
  }

  forceSync() {
    this.syncWithWebsite();
  }

  backupData() {
    AdminFirebaseManager.showNotification('Backup feature coming soon!', 'info');
  }

  clearCache() {
    localStorage.clear();
    AdminFirebaseManager.showNotification('Cache cleared successfully!', 'success');
  }

  // Placeholder methods for buttons
  async toggleVehicleStatus(docId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await AdminFirebaseManager.updateVehicleStatus(docId, newStatus);
    
    if (result.success) {
      this.loadVehiclesPage();
      this.loadDashboardData();
    }
  }

  async deleteVehicle(docId) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      const result = await AdminFirebaseManager.deleteVehicle(docId);
      
      if (result.success) {
        this.loadVehiclesPage();
        this.loadDashboardData();
      }
    }
  }

  editVehicle(docId) {
    AdminFirebaseManager.showNotification('Edit feature coming soon!', 'info');
  }

  async togglePropertyStatus(docId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const result = await AdminFirebaseManager.updatePropertyStatus(docId, newStatus);
    
    if (result.success) {
      this.loadPropertiesPage();
      this.loadDashboardData();
    }
  }

  deleteProperty(docId) {
    AdminFirebaseManager.showNotification('Delete property feature coming soon!', 'info');
  }

  editProperty(docId) {
    AdminFirebaseManager.showNotification('Edit property feature coming soon!', 'info');
  }

  viewEnquiry(enquiryId) {
    AdminFirebaseManager.showNotification('View enquiry feature coming soon!', 'info');
  }

  markAsContacted(enquiryId) {
    AdminFirebaseManager.showNotification('Mark as contacted feature coming soon!', 'info');
  }

  filterVehicles() {
    // Placeholder for vehicle filtering
    console.log('Filtering vehicles...');
  }

  filterProperties() {
    // Placeholder for property filtering
    console.log('Filtering properties...');
  }
  displayEnquiriesTable(enquiries) {
    // Placeholder for enquiries table
    console.log('Displaying enquiries table...');
  }

  displayListingsTable(listings) {
    const container = document.getElementById('listings-content');
    if (!container) return;

    if (listings.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-inbox"></i>
          <h3>No Sell Listings</h3>
          <p>No sell listings submitted yet</p>
        </div>
      `;
      return;
    }

    const tableHTML = `
      <div class="data-table-container">
        <div class="table-header">
          <h3>Sell Listings Management</h3>
          <div class="table-actions">
            <input type="text" id="listing-search" placeholder="Search listings..." class="search-input">
            <select id="listing-filter" class="filter-select">
              <option value="">All Types</option>
              <option value="vehicle">Vehicles</option>
              <option value="property">Properties</option>
            </select>
            <select id="listing-status-filter" class="filter-select">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>Contact</th>
                <th>Price</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="listings-table-body">
              ${listings.map(listing => this.createListingRow(listing)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = tableHTML;

    // Add event listeners
    this.setupListingTableEvents();
  }

  createListingRow(listing) {
    const date = listing.timestamp ? new Date(listing.timestamp.toDate()).toLocaleDateString() : 'N/A';
    const status = listing.status || 'pending';
    const statusClass = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
    
    return `
      <tr data-listing-id="${listing.id}">
        <td>
          <span class="listing-type ${listing.type}">
            <i class="fas fa-${listing.type === 'vehicle' ? 'car' : 'home'}"></i>
            ${listing.type || 'N/A'}
          </span>
        </td>
        <td>
          <div class="listing-title">
            <strong>${listing.title || listing.make + ' ' + listing.model || 'N/A'}</strong>
            <small>${listing.description ? listing.description.substring(0, 50) + '...' : ''}</small>
          </div>
        </td>
        <td>
          <div class="contact-info">
            <div>${listing.name || 'N/A'}</div>
            <small>${listing.email || 'N/A'}</small>
            <small>${listing.phone || 'N/A'}</small>
          </div>
        </td>
        <td>
          <span class="price">${listing.price ? '$' + parseInt(listing.price).toLocaleString() : 'N/A'}</span>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${status}</span>
        </td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="adminPortal.viewListingDetails('${listing.id}')">
              <i class="fas fa-eye"></i>
            </button>
            ${status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="adminPortal.approveListing('${listing.id}')">
                <i class="fas fa-check"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="adminPortal.rejectListing('${listing.id}')">
                <i class="fas fa-times"></i>
              </button>
            ` : ''}
            <button class="btn btn-sm btn-danger" onclick="adminPortal.deleteListing('${listing.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  displayNewslettersTable(newsletters) {
    const container = document.getElementById('newsletters-content');
    if (!container) return;

    if (newsletters.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-envelope"></i>
          <h3>No Newsletter Subscriptions</h3>
          <p>No newsletter subscriptions yet</p>
        </div>
      `;
      return;
    }

    const tableHTML = `
      <div class="data-table-container">
        <div class="table-header">
          <h3>Newsletter Subscriptions</h3>
          <div class="table-actions">
            <input type="text" id="newsletter-search" placeholder="Search subscribers..." class="search-input">
            <select id="newsletter-status-filter" class="filter-select">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <button class="btn btn-secondary" onclick="adminPortal.exportNewsletters()">
              <i class="fas fa-download"></i> Export
            </button>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Status</th>
                <th>Subscribed Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="newsletters-table-body">
              ${newsletters.map(newsletter => this.createNewsletterRow(newsletter)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    container.innerHTML = tableHTML;

    // Add event listeners
    this.setupNewsletterTableEvents();
  }

  createNewsletterRow(newsletter) {
    const date = newsletter.timestamp ? new Date(newsletter.timestamp.toDate()).toLocaleDateString() : 'N/A';
    const status = newsletter.status || 'active';
    const statusClass = status === 'active' ? 'success' : 'danger';
    
    return `
      <tr data-newsletter-id="${newsletter.id}">
        <td>
          <div class="email-info">
            <strong>${newsletter.email || 'N/A'}</strong>
          </div>
        </td>
        <td>${newsletter.name || 'N/A'}</td>
        <td>
          <span class="status-badge ${statusClass}">${status}</span>
        </td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            ${status === 'active' ? `
              <button class="btn btn-sm btn-warning" onclick="adminPortal.unsubscribeUser('${newsletter.id}')">
                <i class="fas fa-user-times"></i> Unsubscribe
              </button>
            ` : `
              <button class="btn btn-sm btn-success" onclick="adminPortal.resubscribeUser('${newsletter.id}')">
                <i class="fas fa-user-check"></i> Resubscribe
              </button>
            `}
            <button class="btn btn-sm btn-danger" onclick="adminPortal.deleteSubscriber('${newsletter.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  markAllAsRead() {
    AdminFirebaseManager.showNotification('Mark all as read feature coming soon!', 'info');
  }
  exportEnquiries() {
    AdminFirebaseManager.showNotification('Export enquiries feature coming soon!', 'info');
  }

  // Listing management functions
  setupListingTableEvents() {
    const searchInput = document.getElementById('listing-search');
    const typeFilter = document.getElementById('listing-filter');
    const statusFilter = document.getElementById('listing-status-filter');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterListingsTable());
    }
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.filterListingsTable());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterListingsTable());
    }
  }

  filterListingsTable() {
    const search = document.getElementById('listing-search')?.value.toLowerCase() || '';
    const typeFilter = document.getElementById('listing-filter')?.value || '';
    const statusFilter = document.getElementById('listing-status-filter')?.value || '';
    const tableBody = document.getElementById('listings-table-body');
    
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const type = row.querySelector('.listing-type')?.textContent.toLowerCase() || '';
      const status = row.querySelector('.status-badge')?.textContent.toLowerCase() || '';
      
      const matchesSearch = text.includes(search);
      const matchesType = !typeFilter || type.includes(typeFilter);
      const matchesStatus = !statusFilter || status.includes(statusFilter);
      
      row.style.display = matchesSearch && matchesType && matchesStatus ? '' : 'none';
    });
  }

  async viewListingDetails(listingId) {
    try {
      const listing = await AdminFirebaseManager.getListingById(listingId);
      if (!listing) {
        AdminFirebaseManager.showNotification('Listing not found', 'error');
        return;
      }

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Listing Details</h3>
            <span class="close">&times;</span>
          </div>
          <div class="modal-body">
            <div class="listing-details">
              <div class="detail-row">
                <label>Type:</label>
                <span>${listing.type || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Title:</label>
                <span>${listing.title || listing.make + ' ' + listing.model || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Description:</label>
                <span>${listing.description || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Price:</label>
                <span>${listing.price ? '$' + parseInt(listing.price).toLocaleString() : 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Contact Name:</label>
                <span>${listing.name || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Email:</label>
                <span>${listing.email || 'N/A'}</span>
              </div>
              <div class="detail-row">
                <label>Phone:</label>
                <span>${listing.phone || 'N/A'}</span>
              </div>
              ${listing.type === 'vehicle' ? `
                <div class="detail-row">
                  <label>Make:</label>
                  <span>${listing.make || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Model:</label>
                  <span>${listing.model || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Year:</label>
                  <span>${listing.year || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Mileage:</label>
                  <span>${listing.mileage || 'N/A'}</span>
                </div>
              ` : ''}
              ${listing.type === 'property' ? `
                <div class="detail-row">
                  <label>Property Type:</label>
                  <span>${listing.propertyType || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Bedrooms:</label>
                  <span>${listing.bedrooms || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Bathrooms:</label>
                  <span>${listing.bathrooms || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <label>Location:</label>
                  <span>${listing.location || 'N/A'}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.style.display = 'block';

      // Close modal events
      modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });

    } catch (error) {
      console.error('Error viewing listing details:', error);
      AdminFirebaseManager.showNotification('Error loading listing details', 'error');
    }
  }

  async approveListing(listingId) {
    if (!confirm('Are you sure you want to approve this listing?')) return;

    try {
      await AdminFirebaseManager.updateListingStatus(listingId, 'approved');
      AdminFirebaseManager.showNotification('Listing approved successfully', 'success');
      
      // Reload listings
      if (this.currentPage === 'listings') {
        this.loadListingsPage();
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      AdminFirebaseManager.showNotification('Error approving listing', 'error');
    }
  }

  async rejectListing(listingId) {
    if (!confirm('Are you sure you want to reject this listing?')) return;

    try {
      await AdminFirebaseManager.updateListingStatus(listingId, 'rejected');
      AdminFirebaseManager.showNotification('Listing rejected successfully', 'success');
      
      // Reload listings
      if (this.currentPage === 'listings') {
        this.loadListingsPage();
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      AdminFirebaseManager.showNotification('Error rejecting listing', 'error');
    }
  }

  async deleteListing(listingId) {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return;

    try {
      await AdminFirebaseManager.deleteListing(listingId);
      AdminFirebaseManager.showNotification('Listing deleted successfully', 'success');
      
      // Reload listings
      if (this.currentPage === 'listings') {
        this.loadListingsPage();
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      AdminFirebaseManager.showNotification('Error deleting listing', 'error');
    }
  }

  // Newsletter management functions
  setupNewsletterTableEvents() {
    const searchInput = document.getElementById('newsletter-search');
    const statusFilter = document.getElementById('newsletter-status-filter');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.filterNewslettersTable());
    }
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterNewslettersTable());
    }
  }

  filterNewslettersTable() {
    const search = document.getElementById('newsletter-search')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('newsletter-status-filter')?.value || '';
    const tableBody = document.getElementById('newsletters-table-body');
    
    if (!tableBody) return;

    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const status = row.querySelector('.status-badge')?.textContent.toLowerCase() || '';
      
      const matchesSearch = text.includes(search);
      const matchesStatus = !statusFilter || status.includes(statusFilter);
      
      row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
  }

  async unsubscribeUser(subscriberId) {
    if (!confirm('Are you sure you want to unsubscribe this user?')) return;

    try {
      await AdminFirebaseManager.updateSubscriptionStatus(subscriberId, 'unsubscribed');
      AdminFirebaseManager.showNotification('User unsubscribed successfully', 'success');
      
      // Reload newsletters
      if (this.currentPage === 'newsletters') {
        this.loadNewslettersPage();
      }
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      AdminFirebaseManager.showNotification('Error unsubscribing user', 'error');
    }
  }

  async resubscribeUser(subscriberId) {
    if (!confirm('Are you sure you want to resubscribe this user?')) return;

    try {
      await AdminFirebaseManager.updateSubscriptionStatus(subscriberId, 'active');
      AdminFirebaseManager.showNotification('User resubscribed successfully', 'success');
      
      // Reload newsletters
      if (this.currentPage === 'newsletters') {
        this.loadNewslettersPage();
      }
    } catch (error) {
      console.error('Error resubscribing user:', error);
      AdminFirebaseManager.showNotification('Error resubscribing user', 'error');
    }
  }

  async deleteSubscriber(subscriberId) {
    if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) return;

    try {
      await AdminFirebaseManager.deleteSubscription(subscriberId);
      AdminFirebaseManager.showNotification('Subscriber deleted successfully', 'success');
      
      // Reload newsletters
      if (this.currentPage === 'newsletters') {
        this.loadNewslettersPage();
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      AdminFirebaseManager.showNotification('Error deleting subscriber', 'error');
    }
  }

  exportNewsletters() {
    try {
      const tableBody = document.getElementById('newsletters-table-body');
      if (!tableBody) return;

      const rows = Array.from(tableBody.querySelectorAll('tr'));
      const csvData = ['Email,Name,Status,Subscribed Date'];
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const email = cells[0].textContent.trim();
          const name = cells[1].textContent.trim();
          const status = cells[2].textContent.trim();
          const date = cells[3].textContent.trim();
          csvData.push(`"${email}","${name}","${status}","${date}"`);
        }
      });

      const csvContent = csvData.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      AdminFirebaseManager.showNotification('Newsletter subscribers exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting newsletters:', error);      AdminFirebaseManager.showNotification('Error exporting newsletters', 'error');
    }
  }
  // Theme Management Methods
  initializeTheme() {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('admin-theme');
    let initialTheme;

    if (savedTheme) {
      initialTheme = savedTheme;
    } else {
      // Detect system preference
      initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }    this.setTheme(initialTheme);
    
    // Update theme display on settings page
    setTimeout(() => this.updateThemeDisplay(), 100);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('admin-theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
    
    // Update theme toggle icon
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle?.querySelector('i');    if (icon) {
      if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggle.title = 'Switch to Light Mode (Ctrl+Shift+T)';
      } else {
        icon.className = 'fas fa-moon';
        themeToggle.title = 'Switch to Dark Mode (Ctrl+Shift+T)';
      }
    }

    // Show theme change notification
    if (typeof AdminFirebaseManager !== 'undefined') {
      AdminFirebaseManager.showNotification(
        `Switched to ${theme} mode`, 
        'success'
      );
    }    console.log(`🎨 Theme switched to: ${theme}`);
  }

  handleThemePreferenceChange(preference) {
    if (preference === 'system') {
      localStorage.removeItem('admin-theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      this.setTheme(systemTheme);
      AdminFirebaseManager.showNotification('Theme will now follow system preference', 'success');
    } else {
      this.setTheme(preference);
    }
    this.updateThemeDisplay();
  }

  updateThemeDisplay() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const themeDisplay = document.getElementById('current-theme-display');
    const themeSelect = document.getElementById('theme-preference');
    
    if (themeDisplay) {
      themeDisplay.textContent = currentTheme.charAt(0).toUpperCase() + currentTheme.slice(1);
    }
    
    if (themeSelect) {
      const savedTheme = localStorage.getItem('admin-theme');
      themeSelect.value = savedTheme || 'system';
    }
  }
}

// Initialize Admin Portal
let adminPortal;

document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Initializing Admin Portal...");
  
  // Wait for Firebase to initialize
  setTimeout(() => {
    adminPortal = new AdminPortal();
    console.log("✅ Admin Portal initialized successfully");
  }, 1000);
});

// Close modals when clicking outside
window.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
  }
});

console.log("📋 Admin Portal script loaded");
