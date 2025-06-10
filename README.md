# Open Road Market - Admin Portal

A comprehensive admin portal for managing vehicles, properties, and customer enquiries for the Open Road Market website.

## 🚀 Features

### Real-Time Management
- **Live Dashboard** with real-time statistics and enquiry notifications
- **Vehicle Management** - Add, edit, delete, and manage vehicle listings
- **Property Management** - Complete property portfolio management
- **Enquiry Tracking** - Real-time customer enquiry management
- **Firebase Integration** - Seamless real-time synchronization with main website

### Key Capabilities
- ✅ **Real-time updates** between admin portal and main website
- ✅ **Image upload** with Firebase Storage integration
- ✅ **Advanced search and filtering** for vehicles and properties
- ✅ **Status management** (Active/Inactive/Sold)
- ✅ **Live enquiry notifications**
- ✅ **Responsive design** for desktop and mobile
- ✅ **Data export** functionality
- ✅ **Professional UI** with modern design

## 🛠️ Setup Instructions

### Prerequisites
- Web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Access to Firebase project

### Quick Start
1. **Open the admin portal**
   ```
   Double-click: index.html
   ```
   Or serve with Live Server in VS Code

2. **Firebase Connection**
   - The portal automatically connects to your Firebase project
   - Check connection status in the top-right corner
   - Green = Connected, Red = Connection Error

3. **First Login**
   - No authentication required (can be added later)
   - Dashboard loads automatically with real-time data

## 📋 How to Use

### Dashboard Overview
- **Statistics Cards** - View total vehicles, properties, and enquiries
- **Recent Enquiries** - Live feed of customer enquiries
- **Quick Actions** - Fast access to add vehicles/properties
- **Connection Status** - Real-time Firebase connection indicator

### Vehicle Management

#### Adding a New Vehicle
1. Click **"Add New Vehicle"** button
2. Fill in vehicle details:
   - Make, Model, Year (required)
   - Price in KES (required)
   - Mileage, Fuel Type, Transmission
   - Condition, Description
3. **Upload Images** (at least 1 required)
   - Supports multiple images (max 10)
   - Max 5MB per image
   - Automatic optimization
4. Click **"Save Vehicle"**
5. Vehicle appears on main website instantly

#### Managing Vehicles
- **Edit** - Modify vehicle details and images
- **View** - See complete vehicle information
- **Activate/Deactivate** - Control visibility on main website
- **Delete** - Remove vehicle (soft delete)
- **Search** - Find vehicles by make, model, ID, etc.
- **Filter** - By status, type, year, etc.

### Property Management

#### Adding a New Property
1. Click **"Add New Property"** button
2. Fill in property details:
   - Title, Type, Location (required)
   - Price in KES (required)
   - Bedrooms, Bathrooms, Area
   - Status (For Sale/Rent), Description
3. **Upload Images** (at least 1 required)
   - Supports multiple images (max 15)
   - High-quality property photos
4. Click **"Save Property"**
5. Property appears on main website instantly

#### Managing Properties
- **Edit** - Update property information
- **View** - Complete property details
- **Status Control** - Manage availability
- **Search & Filter** - Find properties easily

### Enquiry Management

#### Real-Time Enquiries
- **Live Notifications** - New enquiries appear instantly
- **Enquiry Types** - Vehicle, Property, General
- **Customer Details** - Name, email, phone, message
- **Response Tracking** - Mark as contacted/closed
- **Export Options** - Download enquiry data

#### Managing Enquiries
1. **View New Enquiries** - Dashboard shows recent enquiries
2. **Full Enquiry Details** - Click "View" for complete information
3. **Mark as Contacted** - Track follow-up status
4. **Filter by Type** - Vehicle/Property/General enquiries
5. **Date Filtering** - Find enquiries by date range

## 🔥 Real-Time Features

### Website Synchronization
When you make changes in the admin portal:

1. **Add Vehicle** → Appears on main website instantly
2. **Update Status** → Website reflects changes immediately
3. **Delete Item** → Removed from website in real-time
4. **Customer Enquiry** → Shows in admin portal immediately

### Live Indicators
- 🔴 **LIVE** indicators show real-time sections
- **Connection Status** in header shows Firebase connectivity
- **Auto-refresh** when data changes

## 📊 Data Management

### Firebase Structure
```
vehicles/
├── vehicleId: "VEH-123456"
├── make: "Toyota"
├── model: "Camry"
├── year: 2020
├── price: 2500000
├── images: ["url1", "url2"]
├── status: "active"
└── createdAt: timestamp

properties/
├── propertyId: "PROP-123456"
├── title: "Modern Apartment"
├── type: "apartment"
├── price: 15000000
├── location: "Nairobi"
├── images: ["url1", "url2"]
└── status: "for-sale"

enquiries/
├── name: "John Doe"
├── email: "john@example.com"
├── type: "vehicle"
├── message: "Interested in Toyota Camry"
└── timestamp: timestamp
```

### Status Management
- **Active** - Visible on main website
- **Inactive** - Hidden from main website
- **Sold/Rented** - Marked as unavailable
- **Deleted** - Soft deleted (not permanently removed)

## 🎯 Best Practices

### Image Management
- **High Quality** - Use clear, well-lit photos
- **Multiple Angles** - Show different views
- **Consistent Size** - Maintain aspect ratios
- **File Size** - Keep under 5MB each
- **Format** - JPG, PNG, WebP supported

### Data Entry
- **Complete Information** - Fill all relevant fields
- **Accurate Pricing** - Use current market values
- **Detailed Descriptions** - Help customers understand features
- **Regular Updates** - Keep listings current

### Enquiry Response
- **Quick Response** - Reply to enquiries promptly
- **Track Status** - Mark enquiries as contacted
- **Follow Up** - Use contact information effectively

## 🔧 Troubleshooting

### Connection Issues
1. **Check Internet** - Ensure stable connection
2. **Refresh Page** - Reload if connection lost
3. **Clear Cache** - Use Settings → Clear Cache
4. **Firebase Status** - Check Settings → Firebase Configuration

### Upload Problems
1. **File Size** - Ensure images under 5MB
2. **File Format** - Use JPG, PNG, or WebP
3. **Connection** - Check Firebase connection
4. **Try Again** - Retry upload after a moment

### Data Not Syncing
1. **Force Sync** - Click "Sync Website" button
2. **Check Status** - Verify Firebase connection
3. **Refresh** - Reload both admin and main website
4. **Test Connection** - Use Settings → Test Connection

## 📱 Mobile Support

The admin portal is fully responsive and works on:
- **Desktop** - Full functionality
- **Tablet** - Optimized layout
- **Mobile** - Essential features available

## 🔒 Security Notes

- **Firebase Rules** - Ensure proper security rules
- **Admin Access** - Restrict to authorized users only
- **Data Backup** - Regular Firebase backups
- **Monitor Usage** - Track admin activities

## 📈 Future Enhancements

Planned features:
- **User Authentication** - Admin login system
- **Analytics Dashboard** - Detailed statistics
- **Bulk Operations** - Mass editing capabilities
- **Advanced Filtering** - More search options
- **Email Integration** - Direct enquiry responses
- **Report Generation** - Automated reports

## 🆘 Support

For technical support:
1. **Check Console** - Browser developer tools for errors
2. **Firebase Console** - Check Firebase dashboard
3. **Documentation** - Refer to this README
4. **Logs** - Check browser console for error messages

## 📋 File Structure

```
Open-Road-Admin-Portal/
├── index.html              # Main admin dashboard
├── css/
│   ├── admin-styles.css     # Main styling
│   └── dashboard.css        # Dashboard specific styles
├── js/
│   ├── firebase-config.js   # Firebase configuration
│   ├── admin-portal.js      # Main portal logic
│   ├── vehicle-manager.js   # Vehicle management
│   ├── property-manager.js  # Property management
│   ├── enquiry-manager.js   # Enquiry handling
│   └── image-uploader.js    # Image upload logic
├── assets/
│   ├── images/              # Admin portal images
│   └── uploads/             # Temporary uploads
└── README.md               # This documentation
```

---

**Open Road Market Admin Portal** - Professional vehicle and property management system with real-time Firebase integration.
