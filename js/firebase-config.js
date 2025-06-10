// Firebase Configuration for Admin Portal
const adminFirebaseConfig = {
  apiKey: "AIzaSyDjxz6hzgqeLkNtQFnSTbDkro4dsj2j-Tc",
  authDomain: "open-road-market.firebaseapp.com",
  projectId: "open-road-market",
  storageBucket: "open-road-market.firebasestorage.app",
  messagingSenderId: "6509034099",
  appId: "1:6509034099:web:bf09794b823f4187ffc806",
  measurementId: "G-WWBRN92Y32"
};

// Initialize Firebase
let adminDb, adminStorage, adminApp;

try {
  // Initialize Firebase app
  adminApp = firebase.initializeApp(adminFirebaseConfig);
  adminDb = firebase.firestore();
  adminStorage = firebase.storage();
  
  // Enable offline persistence
  adminDb.enablePersistence({ synchronizeTabs: true })
    .catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code == 'unimplemented') {
        console.warn('The current browser does not support all features required for persistence.');
      }
    });

  console.log("✅ Admin Firebase initialized successfully");
  
  // Update connection status
  setTimeout(() => {
    updateConnectionStatus('connected');
  }, 1000);
  
} catch (error) {
  console.error("❌ Error initializing Admin Firebase:", error);
  updateConnectionStatus('error');
}

// Connection status updater
function updateConnectionStatus(status) {
  const statusElement = document.getElementById('connection-status');
  const firebaseStatus = document.getElementById('firebase-status');
  
  if (statusElement) {
    switch(status) {
      case 'connected':
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> <span>Connected</span>';
        break;
      case 'connecting':
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: #FF9800;"></i> <span>Connecting...</span>';
        break;
      case 'error':
        statusElement.innerHTML = '<i class="fas fa-circle" style="color: #F44336;"></i> <span>Connection Error</span>';
        break;
    }
  }
  
  if (firebaseStatus) {
    switch(status) {
      case 'connected':
        firebaseStatus.innerHTML = '<i class="fas fa-circle" style="color: #4CAF50;"></i> <span>Firebase Connected</span>';
        break;
      case 'connecting':
        firebaseStatus.innerHTML = '<i class="fas fa-circle" style="color: #FF9800;"></i> <span>Connecting to Firebase...</span>';
        break;
      case 'error':
        firebaseStatus.innerHTML = '<i class="fas fa-circle" style="color: #F44336;"></i> <span>Firebase Connection Error</span>';
        break;
    }
  }
}

// Firebase Data Manager for Admin Operations
const AdminFirebaseManager = {
  
  // Vehicle Management
  async addVehicle(vehicleData, imageFiles) {
    try {
      console.log("🚗 Adding new vehicle...");
      
      // Upload images first
      const imageUrls = await this.uploadImages(imageFiles, 'vehicles');
      
      // Create vehicle document
      const vehicleDoc = {
        ...vehicleData,
        images: imageUrls,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        vehicleId: 'VEH-' + Date.now().toString().substr(-6).toUpperCase()
      };
      
      // Add to Firestore
      const docRef = await adminDb.collection('vehicles').add(vehicleDoc);
      
      console.log("✅ Vehicle added successfully:", docRef.id);
      
      // Show success notification
      this.showNotification('Vehicle added successfully!', 'success');
      
      return { success: true, id: docRef.id, vehicleId: vehicleDoc.vehicleId };
      
    } catch (error) {
      console.error("❌ Error adding vehicle:", error);
      this.showNotification('Error adding vehicle: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  async updateVehicle(docId, vehicleData, newImageFiles = []) {
    try {
      console.log("🔄 Updating vehicle:", docId);
      
      let updateData = {
        ...vehicleData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Upload new images if provided
      if (newImageFiles.length > 0) {
        const newImageUrls = await this.uploadImages(newImageFiles, 'vehicles');
        updateData.images = [...(vehicleData.existingImages || []), ...newImageUrls];
      }

      await adminDb.collection('vehicles').doc(docId).update(updateData);
      
      console.log("✅ Vehicle updated successfully");
      this.showNotification('Vehicle updated successfully!', 'success');
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error updating vehicle:", error);
      this.showNotification('Error updating vehicle: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  async deleteVehicle(docId) {
    try {
      await adminDb.collection('vehicles').doc(docId).update({
        status: 'deleted',
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log("✅ Vehicle deleted successfully");
      this.showNotification('Vehicle deleted successfully!', 'success');
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error deleting vehicle:", error);
      this.showNotification('Error deleting vehicle: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  // Property Management
  async addProperty(propertyData, imageFiles) {
    try {
      console.log("🏠 Adding new property...");
      
      // Upload images first
      const imageUrls = await this.uploadImages(imageFiles, 'properties');
      
      // Create property document
      const propertyDoc = {
        ...propertyData,
        images: imageUrls,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        propertyId: 'PROP-' + Date.now().toString().substr(-6).toUpperCase()
      };
      
      // Add to Firestore
      const docRef = await adminDb.collection('properties').add(propertyDoc);
      
      console.log("✅ Property added successfully:", docRef.id);
      this.showNotification('Property added successfully!', 'success');
      
      return { success: true, id: docRef.id, propertyId: propertyDoc.propertyId };
      
    } catch (error) {
      console.error("❌ Error adding property:", error);
      this.showNotification('Error adding property: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  async updateProperty(docId, propertyData, newImageFiles = []) {
    try {
      console.log("🔄 Updating property:", docId);
      
      let updateData = {
        ...propertyData,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // Upload new images if provided
      if (newImageFiles.length > 0) {
        const newImageUrls = await this.uploadImages(newImageFiles, 'properties');
        updateData.images = [...(propertyData.existingImages || []), ...newImageUrls];
      }

      await adminDb.collection('properties').doc(docId).update(updateData);
      
      console.log("✅ Property updated successfully");
      this.showNotification('Property updated successfully!', 'success');
      
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error updating property:", error);
      this.showNotification('Error updating property: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  // Image Upload Manager
  async uploadImages(files, folder) {
    try {
      console.log(`📸 Uploading ${files.length} images to ${folder}...`);
      
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`Image ${file.name} is too large. Maximum size is 5MB.`);
        }
        
        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substr(2, 9);
        const fileExtension = file.name.split('.').pop();
        const filename = `${folder}/${timestamp}_${index}_${randomString}.${fileExtension}`;
        
        // Upload to Firebase Storage
        const storageRef = adminStorage.ref().child(filename);
        const uploadTask = storageRef.put(file);
        
        // Monitor upload progress
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload ${index + 1} is ${progress.toFixed(1)}% done`);
          },
          (error) => {
            console.error('Upload error:', error);
          }
        );
        
        // Wait for upload completion and get download URL
        const snapshot = await uploadTask;
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        console.log(`✅ Image ${index + 1} uploaded:`, downloadURL);
        return downloadURL;
      });
      
      const imageUrls = await Promise.all(uploadPromises);
      console.log(`✅ All ${imageUrls.length} images uploaded successfully`);
      
      return imageUrls;
      
    } catch (error) {
      console.error("❌ Error uploading images:", error);
      throw error;
    }
  },
  // Data Retrieval
  async getAllVehicles() {
    try {
      const snapshot = await adminDb.collection('vehicles')
        .where('status', '!=', 'deleted')
        .orderBy('status')
        .orderBy('createdAt', 'desc')
        .get();
      
      const vehicles = [];
      snapshot.forEach((doc) => {
        vehicles.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📊 Retrieved ${vehicles.length} vehicles`);
      return vehicles;
      
    } catch (error) {
      console.error("❌ Error getting vehicles:", error);
      return [];
    }
  },

  async getAllProperties() {
    try {
      const snapshot = await adminDb.collection('properties')
        .where('status', '!=', 'deleted')
        .orderBy('status')
        .orderBy('createdAt', 'desc')
        .get();
      
      const properties = [];
      snapshot.forEach((doc) => {
        properties.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📊 Retrieved ${properties.length} properties`);
      return properties;
      
    } catch (error) {
      console.error("❌ Error getting properties:", error);
      return [];
    }
  },

  async getAllListings() {
    try {
      const snapshot = await adminDb.collection('listings')
        .orderBy('timestamp', 'desc')
        .get();
      
      const listings = [];
      snapshot.forEach((doc) => {
        listings.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📊 Retrieved ${listings.length} sell listings`);
      return listings;
      
    } catch (error) {
      console.error("❌ Error getting listings:", error);
      return [];
    }
  },

  async getAllNewsletterSubscriptions() {
    try {
      const snapshot = await adminDb.collection('newsletters')
        .orderBy('timestamp', 'desc')
        .get();
      
      const newsletters = [];
      snapshot.forEach((doc) => {
        newsletters.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`📊 Retrieved ${newsletters.length} newsletter subscriptions`);
      return newsletters;
      
    } catch (error) {
      console.error("❌ Error getting newsletter subscriptions:", error);
      return [];
    }
  },
  // Real-time Enquiry Listener
  listenToEnquiries(callback) {
    console.log("👂 Setting up real-time enquiry listener...");
    
    return adminDb.collection('enquiries')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const enquiries = [];
        let newEnquiries = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const enquiry = { id: change.doc.id, ...change.doc.data() };
            newEnquiries.push(enquiry);
          }
        });
        
        snapshot.forEach((doc) => {
          enquiries.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`📨 Received ${enquiries.length} enquiries (${newEnquiries.length} new)`);
        
        // Notify about new enquiries
        if (newEnquiries.length > 0) {
          newEnquiries.forEach(enquiry => {
            this.showNewEnquiryNotification(enquiry);
          });
        }
        
        callback(enquiries);
      }, (error) => {
        console.error("❌ Error listening to enquiries:", error);
        this.showNotification('Error connecting to enquiries feed', 'error');
      });
  },

  // Real-time Listings Listener
  listenToListings(callback) {
    console.log("👂 Setting up real-time listings listener...");
    
    return adminDb.collection('listings')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const listings = [];
        let newListings = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const listing = { id: change.doc.id, ...change.doc.data() };
            newListings.push(listing);
          }
        });
        
        snapshot.forEach((doc) => {
          listings.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`📝 Received ${listings.length} listings (${newListings.length} new)`);
        
        // Notify about new listings
        if (newListings.length > 0) {
          newListings.forEach(listing => {
            this.showNewListingNotification(listing);
          });
        }
        
        callback(listings);
      }, (error) => {
        console.error("❌ Error listening to listings:", error);
        this.showNotification('Error connecting to listings feed', 'error');
      });
  },

  // Real-time Newsletter Listener
  listenToNewsletters(callback) {
    console.log("👂 Setting up real-time newsletter listener...");
    
    return adminDb.collection('newsletters')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const newsletters = [];
        let newNewsletters = [];
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newsletter = { id: change.doc.id, ...change.doc.data() };
            newNewsletters.push(newsletter);
          }
        });
        
        snapshot.forEach((doc) => {
          newsletters.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`📧 Received ${newsletters.length} newsletter subscriptions (${newNewsletters.length} new)`);
        
        // Notify about new subscriptions
        if (newNewsletters.length > 0) {
          newNewsletters.forEach(newsletter => {
            this.showNewNewsletterNotification(newsletter);
          });
        }
        
        callback(newsletters);
      }, (error) => {
        console.error("❌ Error listening to newsletters:", error);
        this.showNotification('Error connecting to newsletter feed', 'error');
      });
  },

  // Status Updates
  async updateVehicleStatus(docId, newStatus) {
    try {
      await adminDb.collection('vehicles').doc(docId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showNotification(`Vehicle status updated to ${newStatus}`, 'success');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error updating vehicle status:", error);
      this.showNotification('Error updating vehicle status: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },
  async updatePropertyStatus(docId, newStatus) {
    try {
      await adminDb.collection('properties').doc(docId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showNotification(`Property status updated to ${newStatus}`, 'success');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error updating property status:", error);
      this.showNotification('Error updating property status: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  // Listing Management
  async updateListingStatus(docId, newStatus) {
    try {
      await adminDb.collection('listings').doc(docId).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showNotification(`Listing status updated to ${newStatus}`, 'success');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error updating listing status:", error);
      this.showNotification('Error updating listing status: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  async deleteListing(docId) {
    try {
      await adminDb.collection('listings').doc(docId).update({
        status: 'deleted',
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      this.showNotification('Listing deleted successfully!', 'success');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error deleting listing:", error);
      this.showNotification('Error deleting listing: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  // Newsletter Management
  async deleteNewsletterSubscription(docId) {
    try {
      await adminDb.collection('newsletters').doc(docId).delete();
      
      this.showNotification('Newsletter subscription deleted successfully!', 'success');
      return { success: true };
      
    } catch (error) {
      console.error("❌ Error deleting newsletter subscription:", error);
      this.showNotification('Error deleting subscription: ' + error.message, 'error');
      return { success: false, error: error.message };
    }
  },

  // Notification System
  showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 
                 type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  },
  showNewEnquiryNotification(enquiry) {
    if (!enquiry || enquiry.notified) return;

    // Play notification sound (optional)
    // new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAA...').play();

    this.showNotification(
      `🔔 New enquiry from ${enquiry.name} - ${enquiry.type || 'General'}`,
      'info'
    );

    // Mark as notified to prevent duplicate notifications
    adminDb.collection('enquiries').doc(enquiry.id).update({
      notified: true
    }).catch(err => console.log('Could not mark as notified:', err));
  },

  showNewListingNotification(listing) {
    if (!listing || listing.notified) return;

    const listingType = listing.type || 'item';
    const itemName = listing.vehicleMake || listing.title || 'New item';
    
    this.showNotification(
      `📝 New ${listingType} listing: ${itemName} - ${listing.sellerName}`,
      'info'
    );

    // Mark as notified to prevent duplicate notifications
    adminDb.collection('listings').doc(listing.id).update({
      notified: true
    }).catch(err => console.log('Could not mark as notified:', err));
  },

  showNewNewsletterNotification(newsletter) {
    if (!newsletter || newsletter.notified) return;

    this.showNotification(
      `📧 New newsletter subscription: ${newsletter.email}`,
      'success'
    );

    // Mark as notified to prevent duplicate notifications
    adminDb.collection('newsletters').doc(newsletter.id).update({
      notified: true
    }).catch(err => console.log('Could not mark as notified:', err));
  },

  // Test Connection
  async testConnection() {
    try {
      updateConnectionStatus('connecting');
      
      // Test Firestore connection
      await adminDb.collection('_test').add({ test: true, timestamp: new Date() });
      
      // Test Storage connection  
      const testRef = adminStorage.ref().child('_test/connection-test.txt');
      await testRef.putString('Connection test successful');
      
      // Clean up test data
      await testRef.delete();
      
      updateConnectionStatus('connected');
      this.showNotification('Firebase connection test successful!', 'success');
      
      return true;
      
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      updateConnectionStatus('error');
      this.showNotification('Firebase connection test failed: ' + error.message, 'error');
      
      return false;
    }
  }
};

// Initialize connection status
document.addEventListener('DOMContentLoaded', function() {
  updateConnectionStatus('connecting');
  
  // Test connection after page load
  setTimeout(() => {
    AdminFirebaseManager.testConnection();
  }, 2000);
});

console.log("🚀 Admin Firebase Manager loaded successfully");
