// Enquiry Management Module
class EnquiryManager {
  constructor() {
    this.enquiries = [];
    this.filteredEnquiries = [];
    this.enquiryListener = null;
    
    this.initializeEventListeners();
    this.setupRealTimeListener();
  }

  initializeEventListeners() {
    console.log("📨 Initializing Enquiry Manager...");

    // Filter dropdowns
    const typeFilter = document.getElementById('enquiry-type-filter');
    const statusFilter = document.getElementById('enquiry-status-filter');
    const dateFilter = document.getElementById('enquiry-date-filter');
    
    if (typeFilter) {
      typeFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (dateFilter) {
      dateFilter.addEventListener('change', () => this.applyFilters());
    }

    console.log("✅ Enquiry Manager event listeners initialized");
  }

  setupRealTimeListener() {
    console.log("🔴 Setting up real-time enquiry listener...");
    
    if (this.enquiryListener) {
      this.enquiryListener(); // Unsubscribe previous listener
    }

    this.enquiryListener = AdminFirebaseManager.listenToEnquiries((enquiries) => {
      this.handleRealTimeEnquiries(enquiries);
    });
  }

  handleRealTimeEnquiries(enquiries) {
    console.log(`📨 Received ${enquiries.length} enquiries`);
    
    // Update local enquiries
    this.enquiries = enquiries;
    this.filteredEnquiries = [...enquiries];
    
    // Apply current filters
    this.applyFilters();
    
    // Update dashboard if we're on enquiries page
    if (document.getElementById('enquiries-content')?.classList.contains('active')) {
      this.displayEnquiriesTable();
    }
  }

  async loadEnquiries() {
    try {
      console.log("📊 Loading enquiries...");
      
      // Show loading state
      this.showLoadingState();
      
      // Get enquiries from Firebase (fallback if real-time doesn't work)
      const snapshot = await adminDb.collection('enquiries')
        .orderBy('timestamp', 'desc')
        .get();
      
      this.enquiries = [];
      snapshot.forEach((doc) => {
        this.enquiries.push({ id: doc.id, ...doc.data() });
      });
      
      this.filteredEnquiries = [...this.enquiries];
      
      // Display enquiries
      this.displayEnquiriesTable();
      
      console.log(`✅ Loaded ${this.enquiries.length} enquiries`);
      
    } catch (error) {
      console.error("❌ Error loading enquiries:", error);
      AdminFirebaseManager.showNotification('Error loading enquiries', 'error');
    }
  }

  displayEnquiriesTable() {
    const container = document.getElementById('enquiries-table-container');
    if (!container) return;

    // Hide loading state
    this.hideLoadingState();

    // Clear existing content
    container.innerHTML = '';

    if (this.filteredEnquiries.length === 0) {
      container.innerHTML = `
        <div class="no-data">
          <i class="fas fa-envelope-open" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
          <h3>No enquiries found</h3>
          <p>No enquiries match your current filters.</p>
          <button class="btn btn-primary" onclick="enquiryManager.clearFilters()">
            <i class="fas fa-filter"></i> Clear Filters
          </button>
        </div>
      `;
      return;
    }

    // Create enquiries table
    const table = this.createEnquiriesTable();
    container.appendChild(table);
  }

  createEnquiriesTable() {
    const tableContainer = document.createElement('div');
    tableContainer.className = 'enquiries-table-wrapper';
    
    tableContainer.innerHTML = `
      <table class="enquiries-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredEnquiries.map(enquiry => this.createEnquiryRow(enquiry)).join('')}
        </tbody>
      </table>
    `;
    
    return tableContainer;
  }

  createEnquiryRow(enquiry) {
    const date = enquiry.timestamp?.toDate?.() || new Date();
    const timeAgo = this.getTimeAgo(date);
    const statusClass = this.getEnquiryStatusClass(enquiry.status || 'new');
    const typeClass = this.getEnquiryTypeClass(enquiry.type || 'general');
    
    return `
      <tr class="enquiry-row ${enquiry.status || 'new'}" data-enquiry-id="${enquiry.id}">
        <td class="enquiry-date">
          <div class="date-info">
            <span class="date">${date.toLocaleDateString()}</span>
            <span class="time">${timeAgo}</span>
          </div>
        </td>
        <td class="enquiry-name">
          <div class="name-info">
            <strong>${enquiry.name}</strong>
            ${enquiry.company ? `<small>${enquiry.company}</small>` : ''}
          </div>
        </td>
        <td class="enquiry-contact">
          <div class="contact-info">
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <a href="mailto:${enquiry.email}">${enquiry.email}</a>
            </div>
            ${enquiry.phone ? `
              <div class="contact-item">
                <i class="fas fa-phone"></i>
                <a href="tel:${enquiry.phone}">${enquiry.phone}</a>
              </div>
            ` : ''}
          </div>
        </td>
        <td class="enquiry-type">
          <span class="type-badge ${typeClass}">${this.formatEnquiryType(enquiry.type || 'general')}</span>
        </td>
        <td class="enquiry-subject">
          <div class="subject-info">
            <div class="subject">${enquiry.subject || enquiry.vehicleId || enquiry.propertyId || 'General Enquiry'}</div>
            <div class="message-preview">${this.truncateText(enquiry.message || '', 60)}</div>
          </div>
        </td>
        <td class="enquiry-status">
          <select class="status-select ${statusClass}" onchange="enquiryManager.updateEnquiryStatus('${enquiry.id}', this.value)">
            <option value="new" ${(enquiry.status || 'new') === 'new' ? 'selected' : ''}>New</option>
            <option value="contacted" ${enquiry.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="in-progress" ${enquiry.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
            <option value="closed" ${enquiry.status === 'closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td class="enquiry-actions">
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="enquiryManager.viewEnquiry('${enquiry.id}')" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-success" onclick="enquiryManager.replyToEnquiry('${enquiry.id}')" title="Reply">
              <i class="fas fa-reply"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="enquiryManager.markAsRead('${enquiry.id}')" title="Mark as Read">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="enquiryManager.deleteEnquiry('${enquiry.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  getEnquiryStatusClass(status) {
    switch (status) {
      case 'new': return 'status-new';
      case 'contacted': return 'status-contacted';
      case 'in-progress': return 'status-progress';
      case 'closed': return 'status-closed';
      default: return 'status-new';
    }
  }

  getEnquiryTypeClass(type) {
    switch (type) {
      case 'vehicle': return 'type-vehicle';
      case 'property': return 'type-property';
      case 'general': return 'type-general';
      default: return 'type-general';
    }
  }

  formatEnquiryType(type) {
    switch (type) {
      case 'vehicle': return 'Vehicle';
      case 'property': return 'Property';
      case 'general': return 'General';
      default: return 'General';
    }
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

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  applyFilters() {
    const typeFilter = document.getElementById('enquiry-type-filter')?.value || 'all';
    const statusFilter = document.getElementById('enquiry-status-filter')?.value || 'all';
    const dateFilter = document.getElementById('enquiry-date-filter')?.value || '';
    
    let filtered = [...this.enquiries];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(enquiry => (enquiry.type || 'general') === typeFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(enquiry => (enquiry.status || 'new') === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(enquiry => {
        const enquiryDate = enquiry.timestamp?.toDate?.() || new Date();
        return enquiryDate.toDateString() === filterDate.toDateString();
      });
    }
    
    this.filteredEnquiries = filtered;
    this.displayEnquiriesTable();
    
    // Update filter counts
    this.updateFilterCounts();
  }

  updateFilterCounts() {
    const totalCount = this.enquiries.length;
    const filteredCount = this.filteredEnquiries.length;
    
    console.log(`Showing ${filteredCount} of ${totalCount} enquiries`);
  }

  clearFilters() {
    // Reset all filters
    const typeFilter = document.getElementById('enquiry-type-filter');
    const statusFilter = document.getElementById('enquiry-status-filter');
    const dateFilter = document.getElementById('enquiry-date-filter');
    
    if (typeFilter) typeFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (dateFilter) dateFilter.value = '';
    
    // Reapply filters
    this.applyFilters();
  }

  async updateEnquiryStatus(enquiryId, newStatus) {
    try {
      await adminDb.collection('enquiries').doc(enquiryId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Update local data
      const enquiry = this.enquiries.find(e => e.id === enquiryId);
      if (enquiry) {
        enquiry.status = newStatus;
      }
      
      AdminFirebaseManager.showNotification(`Enquiry status updated to ${newStatus}`, 'success');
      
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      AdminFirebaseManager.showNotification('Error updating enquiry status', 'error');
    }
  }

  viewEnquiry(enquiryId) {
    const enquiry = this.enquiries.find(e => e.id === enquiryId);
    if (!enquiry) {
      AdminFirebaseManager.showNotification('Enquiry not found', 'error');
      return;
    }

    this.showEnquiryDetailsModal(enquiry);
  }

  showEnquiryDetailsModal(enquiry) {
    const date = enquiry.timestamp?.toDate?.() || new Date();
    
    const modalHtml = `
      <div class="modal" id="enquiry-details-modal">
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3>Enquiry Details</h3>
            <span class="close" onclick="enquiryManager.closeDetailsModal()">&times;</span>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="enquiry-details-grid">
              <div class="enquiry-header-info">
                <div class="enquiry-meta">
                  <span class="type-badge ${this.getEnquiryTypeClass(enquiry.type || 'general')}">
                    ${this.formatEnquiryType(enquiry.type || 'general')}
                  </span>
                  <span class="status-badge ${this.getEnquiryStatusClass(enquiry.status || 'new')}">
                    ${enquiry.status || 'new'}
                  </span>
                  <span class="date">${date.toLocaleDateString()} at ${date.toLocaleTimeString()}</span>
                </div>
              </div>
              
              <div class="customer-info">
                <h4>Customer Information</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Name:</span>
                    <span class="value">${enquiry.name}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Email:</span>
                    <span class="value">
                      <a href="mailto:${enquiry.email}">${enquiry.email}</a>
                    </span>
                  </div>
                  ${enquiry.phone ? `
                    <div class="info-item">
                      <span class="label">Phone:</span>
                      <span class="value">
                        <a href="tel:${enquiry.phone}">${enquiry.phone}</a>
                      </span>
                    </div>
                  ` : ''}
                  ${enquiry.company ? `
                    <div class="info-item">
                      <span class="label">Company:</span>
                      <span class="value">${enquiry.company}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="enquiry-content">
                <h4>Enquiry Details</h4>
                ${enquiry.subject ? `
                  <div class="content-item">
                    <span class="label">Subject:</span>
                    <span class="value">${enquiry.subject}</span>
                  </div>
                ` : ''}
                ${enquiry.vehicleId ? `
                  <div class="content-item">
                    <span class="label">Vehicle ID:</span>
                    <span class="value">${enquiry.vehicleId}</span>
                  </div>
                ` : ''}
                ${enquiry.propertyId ? `
                  <div class="content-item">
                    <span class="label">Property ID:</span>
                    <span class="value">${enquiry.propertyId}</span>
                  </div>
                ` : ''}
                <div class="content-item">
                  <span class="label">Message:</span>
                  <div class="message-content">${enquiry.message || 'No message provided'}</div>
                </div>
              </div>
              
              <div class="enquiry-actions-detailed">
                <h4>Actions</h4>
                <div class="action-buttons">
                  <button class="btn btn-primary" onclick="enquiryManager.replyToEnquiry('${enquiry.id}')">
                    <i class="fas fa-reply"></i> Reply via Email
                  </button>
                  <button class="btn btn-success" onclick="enquiryManager.markAsContacted('${enquiry.id}')">
                    <i class="fas fa-phone"></i> Mark as Contacted
                  </button>
                  <button class="btn btn-warning" onclick="enquiryManager.addNotes('${enquiry.id}')">
                    <i class="fas fa-note-sticky"></i> Add Notes
                  </button>
                  <button class="btn btn-info" onclick="enquiryManager.exportEnquiry('${enquiry.id}')">
                    <i class="fas fa-download"></i> Export
                  </button>
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
    document.getElementById('enquiry-details-modal').style.display = 'block';
  }

  closeDetailsModal() {
    const modal = document.getElementById('enquiry-details-modal');
    if (modal) {
      modal.remove();
    }
  }

  replyToEnquiry(enquiryId) {
    const enquiry = this.enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;

    // Create mailto link with pre-filled content
    const subject = `Re: ${enquiry.subject || 'Your enquiry about our services'}`;
    const body = `Dear ${enquiry.name},\n\nThank you for your enquiry. \n\n\nBest regards,\nOpen Road Market Team`;
    
    const mailtoLink = `mailto:${enquiry.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Mark as contacted
    this.markAsContacted(enquiryId);
  }

  async markAsContacted(enquiryId) {
    await this.updateEnquiryStatus(enquiryId, 'contacted');
  }

  async markAsRead(enquiryId) {
    try {
      await adminDb.collection('enquiries').doc(enquiryId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      AdminFirebaseManager.showNotification('Enquiry marked as read', 'success');
      
    } catch (error) {
      console.error('Error marking enquiry as read:', error);
      AdminFirebaseManager.showNotification('Error marking enquiry as read', 'error');
    }
  }

  addNotes(enquiryId) {
    const notes = prompt('Add notes for this enquiry:');
    if (notes) {
      this.updateEnquiryNotes(enquiryId, notes);
    }
  }

  async updateEnquiryNotes(enquiryId, notes) {
    try {
      await adminDb.collection('enquiries').doc(enquiryId).update({
        notes: notes,
        notesUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      AdminFirebaseManager.showNotification('Notes added successfully', 'success');
      
    } catch (error) {
      console.error('Error adding notes:', error);
      AdminFirebaseManager.showNotification('Error adding notes', 'error');
    }
  }

  exportEnquiry(enquiryId) {
    const enquiry = this.enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;

    const csvData = this.convertEnquiryToCSV([enquiry]);
    this.downloadCSV(csvData, `enquiry-${enquiryId}.csv`);
  }

  async deleteEnquiry(enquiryId) {
    const enquiry = this.enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;
    
    if (confirm(`Are you sure you want to delete enquiry from ${enquiry.name}?\n\nThis action cannot be undone.`)) {
      try {
        await adminDb.collection('enquiries').doc(enquiryId).delete();
        
        // Remove from local data
        this.enquiries = this.enquiries.filter(e => e.id !== enquiryId);
        
        // Refresh display
        this.applyFilters();
        
        AdminFirebaseManager.showNotification('Enquiry deleted successfully', 'success');
        
      } catch (error) {
        console.error('Error deleting enquiry:', error);
        AdminFirebaseManager.showNotification('Error deleting enquiry', 'error');
      }
    }
  }

  async markAllAsRead() {
    if (confirm('Mark all enquiries as read?')) {
      try {
        const batch = adminDb.batch();
        
        this.enquiries.forEach(enquiry => {
          if (!enquiry.read) {
            const enquiryRef = adminDb.collection('enquiries').doc(enquiry.id);
            batch.update(enquiryRef, {
              read: true,
              readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        });
        
        await batch.commit();
        
        AdminFirebaseManager.showNotification('All enquiries marked as read', 'success');
        
      } catch (error) {
        console.error('Error marking all as read:', error);
        AdminFirebaseManager.showNotification('Error marking all as read', 'error');
      }
    }
  }

  exportEnquiries() {
    try {
      const csvData = this.convertEnquiryToCSV(this.filteredEnquiries);
      this.downloadCSV(csvData, 'enquiries-export.csv');
      AdminFirebaseManager.showNotification('Enquiries exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting enquiries:', error);
      AdminFirebaseManager.showNotification('Error exporting enquiries', 'error');
    }
  }

  convertEnquiryToCSV(enquiries) {
    if (enquiries.length === 0) return '';
    
    const headers = [
      'Date', 'Name', 'Email', 'Phone', 'Company', 'Type', 'Subject', 
      'Vehicle ID', 'Property ID', 'Message', 'Status', 'Notes'
    ];
    
    const csvRows = [headers.join(',')];
    
    enquiries.forEach(enquiry => {
      const date = enquiry.timestamp?.toDate?.() || new Date();
      const row = [
        date.toLocaleDateString(),
        `"${(enquiry.name || '').replace(/"/g, '""')}"`,
        enquiry.email || '',
        enquiry.phone || '',
        `"${(enquiry.company || '').replace(/"/g, '""')}"`,
        enquiry.type || 'general',
        `"${(enquiry.subject || '').replace(/"/g, '""')}"`,
        enquiry.vehicleId || '',
        enquiry.propertyId || '',
        `"${(enquiry.message || '').replace(/"/g, '""')}"`,
        enquiry.status || 'new',
        `"${(enquiry.notes || '').replace(/"/g, '""')}"`
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

  showLoadingState() {
    const container = document.getElementById('enquiries-table-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading enquiries...</span>
        </div>
      `;
    }
  }

  hideLoadingState() {
    // Loading state is hidden when content is displayed
  }

  // Statistics
  getEnquiryStats() {
    const stats = {
      total: this.enquiries.length,
      new: this.enquiries.filter(e => (e.status || 'new') === 'new').length,
      contacted: this.enquiries.filter(e => e.status === 'contacted').length,
      inProgress: this.enquiries.filter(e => e.status === 'in-progress').length,
      closed: this.enquiries.filter(e => e.status === 'closed').length,
      vehicle: this.enquiries.filter(e => e.type === 'vehicle').length,
      property: this.enquiries.filter(e => e.type === 'property').length,
      general: this.enquiries.filter(e => (e.type || 'general') === 'general').length,
      today: this.enquiries.filter(e => {
        const enquiryDate = e.timestamp?.toDate?.() || new Date();
        const today = new Date();
        return enquiryDate.toDateString() === today.toDateString();
      }).length
    };

    return stats;
  }
}

// Initialize Enquiry Manager
let enquiryManager;

document.addEventListener('DOMContentLoaded', function() {
  enquiryManager = new EnquiryManager();
  console.log("✅ Enquiry Manager initialized");
});

console.log("📨 Enquiry Manager script loaded");
