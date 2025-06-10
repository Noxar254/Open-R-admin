// Image Upload Manager
class ImageUploader {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.maxFiles = {
      vehicle: 10,
      property: 15
    };
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    console.log("📸 Initializing Image Uploader...");

    // Vehicle image upload
    const vehicleImageInput = document.getElementById('vehicle-images');
    if (vehicleImageInput) {
      vehicleImageInput.addEventListener('change', (e) => {
        this.handleImageUpload(e, 'vehicle', 'vehicle-image-preview');
      });
    }

    // Property image upload
    const propertyImageInput = document.getElementById('property-images');
    if (propertyImageInput) {
      propertyImageInput.addEventListener('change', (e) => {
        this.handleImageUpload(e, 'property', 'property-image-preview');
      });
    }

    // Drag and drop handlers
    this.setupDragAndDrop();

    console.log("✅ Image Uploader event listeners initialized");
  }

  setupDragAndDrop() {
    const dropZones = [
      { input: 'vehicle-images', preview: 'vehicle-image-preview', type: 'vehicle' },
      { input: 'property-images', preview: 'property-image-preview', type: 'property' }
    ];

    dropZones.forEach(zone => {
      const input = document.getElementById(zone.input);
      if (!input) return;

      const container = input.closest('.form-group');
      if (!container) return;

      // Add drag and drop styling
      container.classList.add('drag-drop-zone');

      // Prevent default drag behaviors
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, this.preventDefaults, false);
        document.body.addEventListener(eventName, this.preventDefaults, false);
      });

      // Highlight drop zone when item is dragged over it
      ['dragenter', 'dragover'].forEach(eventName => {
        container.addEventListener(eventName, () => this.highlight(container), false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        container.addEventListener(eventName, () => this.unhighlight(container), false);
      });

      // Handle dropped files
      container.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        this.handleDroppedFiles(files, zone.type, zone.preview, input);
      }, false);
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  highlight(element) {
    element.classList.add('drag-over');
  }

  unhighlight(element) {
    element.classList.remove('drag-over');
  }

  handleDroppedFiles(files, type, previewContainerId, inputElement) {
    console.log(`📸 Handling ${files.length} dropped files for ${type}`);
    
    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = this.validateFiles(fileArray, type);
    
    if (validFiles.length > 0) {
      // Update the input element
      this.updateInputFiles(inputElement, validFiles);
      
      // Preview images
      this.previewImages(validFiles, previewContainerId, type);
    }
  }

  updateInputFiles(inputElement, files) {
    // Create a new FileList-like object
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    inputElement.files = dt.files;
  }

  handleImageUpload(event, type, previewContainerId) {
    const files = Array.from(event.target.files);
    console.log(`📸 Handling ${files.length} selected files for ${type}`);
    
    // Validate files
    const validFiles = this.validateFiles(files, type);
    
    if (validFiles.length > 0) {
      this.previewImages(validFiles, previewContainerId, type);
    }
  }

  validateFiles(files, type) {
    const maxFiles = this.maxFiles[type] || 10;
    const validFiles = [];
    const errors = [];

    // Check file count
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed for ${type}`);
      files = files.slice(0, maxFiles);
    }

    files.forEach((file, index) => {
      // Check file type
      if (!this.allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPG, PNG, and WebP are allowed.`);
        return;
      }

      // Check file size
      if (file.size > this.maxFileSize) {
        errors.push(`File ${index + 1}: File too large. Maximum size is 5MB.`);
        return;
      }

      // Check for duplicate names
      if (validFiles.some(f => f.name === file.name)) {
        errors.push(`File ${index + 1}: Duplicate file name detected.`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      AdminFirebaseManager.showNotification(
        `Upload Issues:\n${errors.join('\n')}`,
        'warning'
      );
    }

    // Show success message
    if (validFiles.length > 0) {
      AdminFirebaseManager.showNotification(
        `${validFiles.length} file(s) ready for upload`,
        'success'
      );
    }

    return validFiles;
  }

  previewImages(files, previewContainerId, type) {
    const previewContainer = document.getElementById(previewContainerId);
    if (!previewContainer) return;

    // Clear existing previews (except existing images)
    const existingImages = previewContainer.querySelectorAll('.existing-image');
    previewContainer.innerHTML = '';
    
    // Re-add existing images
    existingImages.forEach(img => previewContainer.appendChild(img));

    // Create new previews
    files.forEach((file, index) => {
      this.createImagePreview(file, index, previewContainer, type);
    });

    // Update upload info
    this.updateUploadInfo(files, type);
  }

  createImagePreview(file, index, container, type) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageDiv = document.createElement('div');
      imageDiv.className = 'image-preview-item new-image';
      imageDiv.dataset.index = index;
      
      imageDiv.innerHTML = `
        <div class="image-container">
          <img src="${e.target.result}" alt="Preview ${index + 1}" loading="lazy">
          <div class="image-overlay">
            <button type="button" class="btn btn-sm btn-danger remove-image" 
                    onclick="imageUploader.removePreviewImage(${index}, '${type}')">
              <i class="fas fa-times"></i>
            </button>
            <button type="button" class="btn btn-sm btn-primary set-main" 
                    onclick="imageUploader.setMainImage(${index}, '${type}')"
                    title="Set as main image">
              <i class="fas fa-star"></i>
            </button>
          </div>
        </div>
        <div class="image-info">
          <div class="file-name">${this.truncateFileName(file.name, 20)}</div>
          <div class="file-details">
            <span class="file-size">${this.formatFileSize(file.size)}</span>
            <span class="file-type">${file.type.split('/')[1].toUpperCase()}</span>
          </div>
          ${index === 0 ? '<div class="main-badge">Main Image</div>' : ''}
        </div>
      `;
      
      container.appendChild(imageDiv);
      
      // Add animation
      setTimeout(() => {
        imageDiv.classList.add('preview-loaded');
      }, 100);
    };

    reader.readAsDataURL(file);
  }

  removePreviewImage(index, type) {
    // Remove from preview
    const previewItem = document.querySelector(`[data-index="${index}"]`);
    if (previewItem) {
      previewItem.remove();
    }

    // Update file input
    const inputId = type === 'vehicle' ? 'vehicle-images' : 'property-images';
    const input = document.getElementById(inputId);
    
    if (input && input.files) {
      const dt = new DataTransfer();
      const files = Array.from(input.files);
      
      files.forEach((file, i) => {
        if (i !== index) {
          dt.items.add(file);
        }
      });
      
      input.files = dt.files;
      
      // Re-index remaining previews
      this.reindexPreviews(type);
    }
  }

  setMainImage(index, type) {
    // Remove main badge from all images
    const container = document.getElementById(
      type === 'vehicle' ? 'vehicle-image-preview' : 'property-image-preview'
    );
    
    if (container) {
      container.querySelectorAll('.main-badge').forEach(badge => badge.remove());
      container.querySelectorAll('.image-preview-item').forEach((item, i) => {
        item.dataset.isMain = i === index ? 'true' : 'false';
      });
      
      // Add main badge to selected image
      const selectedImage = container.querySelector(`[data-index="${index}"]`);
      if (selectedImage) {
        const mainBadge = document.createElement('div');
        mainBadge.className = 'main-badge';
        mainBadge.textContent = 'Main Image';
        selectedImage.querySelector('.image-info').appendChild(mainBadge);
      }
    }

    // Reorder files in input to put main image first
    this.reorderFiles(index, type);
  }

  reorderFiles(mainIndex, type) {
    const inputId = type === 'vehicle' ? 'vehicle-images' : 'property-images';
    const input = document.getElementById(inputId);
    
    if (input && input.files) {
      const dt = new DataTransfer();
      const files = Array.from(input.files);
      
      // Add main image first
      if (files[mainIndex]) {
        dt.items.add(files[mainIndex]);
      }
      
      // Add other images
      files.forEach((file, i) => {
        if (i !== mainIndex) {
          dt.items.add(file);
        }
      });
      
      input.files = dt.files;
    }
  }

  reindexPreviews(type) {
    const containerId = type === 'vehicle' ? 'vehicle-image-preview' : 'property-image-preview';
    const container = document.getElementById(containerId);
    
    if (container) {
      const previews = container.querySelectorAll('.image-preview-item.new-image');
      previews.forEach((preview, index) => {
        preview.dataset.index = index;
        
        // Update remove button
        const removeBtn = preview.querySelector('.remove-image');
        if (removeBtn) {
          removeBtn.setAttribute('onclick', `imageUploader.removePreviewImage(${index}, '${type}')`);
        }
        
        // Update main image button
        const mainBtn = preview.querySelector('.set-main');
        if (mainBtn) {
          mainBtn.setAttribute('onclick', `imageUploader.setMainImage(${index}, '${type}')`);
        }
      });
    }
  }

  updateUploadInfo(files, type) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalSizeFormatted = this.formatFileSize(totalSize);
    
    console.log(`📊 Upload info: ${files.length} files, ${totalSizeFormatted} total`);
    
    // Update any info displays
    const infoElements = document.querySelectorAll('.file-upload-info');
    infoElements.forEach(element => {
      if (element.closest(`#${type}-form`)) {
        element.innerHTML = `
          <small>
            ${files.length} file(s) selected (${totalSizeFormatted} total)
            <br>Maximum ${this.maxFiles[type]} images, 5MB each
          </small>
        `;
      }
    });
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  truncateFileName(fileName, maxLength) {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
    
    return truncatedName + '.' + extension;
  }

  // Utility method to compress images if needed
  async compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.9) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Batch upload progress tracking
  trackUploadProgress(files, onProgress) {
    let completedUploads = 0;
    const totalUploads = files.length;
    
    return (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      
      if (progress === 100) {
        completedUploads++;
      }
      
      const overallProgress = (completedUploads / totalUploads) * 100;
      
      if (onProgress) {
        onProgress({
          fileProgress: progress,
          overallProgress: overallProgress,
          completed: completedUploads,
          total: totalUploads
        });
      }
    };
  }

  // Create upload progress modal
  showUploadProgress(files) {
    const modalHtml = `
      <div class="modal" id="upload-progress-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <h3>Uploading Images</h3>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="upload-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="upload-progress-fill"></div>
              </div>
              <div class="progress-text" id="upload-progress-text">
                Preparing upload...
              </div>
              <div class="file-list" id="uploading-files">
                ${files.map((file, index) => `
                  <div class="file-item" id="file-${index}">
                    <span class="file-name">${this.truncateFileName(file.name, 30)}</span>
                    <span class="file-status">Waiting...</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('upload-progress-modal').style.display = 'block';
  }

  updateUploadProgress(progress) {
    const progressFill = document.getElementById('upload-progress-fill');
    const progressText = document.getElementById('upload-progress-text');
    
    if (progressFill) {
      progressFill.style.width = `${progress.overallProgress}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${progress.completed} of ${progress.total} files uploaded (${Math.round(progress.overallProgress)}%)`;
    }
  }

  hideUploadProgress() {
    const modal = document.getElementById('upload-progress-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Image optimization suggestions
  analyzeImages(files) {
    const analysis = {
      totalSize: 0,
      largeFiles: [],
      recommendations: []
    };
    
    files.forEach((file, index) => {
      analysis.totalSize += file.size;
      
      if (file.size > 2 * 1024 * 1024) { // 2MB
        analysis.largeFiles.push({ index, name: file.name, size: file.size });
      }
    });
    
    if (analysis.largeFiles.length > 0) {
      analysis.recommendations.push('Consider compressing large images to improve upload speed');
    }
    
    if (files.length > 8) {
      analysis.recommendations.push('Many images selected - consider selecting only the best quality photos');
    }
    
    return analysis;
  }
}

// Initialize Image Uploader
let imageUploader;

document.addEventListener('DOMContentLoaded', function() {
  imageUploader = new ImageUploader();
  console.log("✅ Image Uploader initialized");
});

// Add CSS for drag and drop styling
const dragDropStyles = `
  <style>
    .drag-drop-zone {
      transition: all 0.3s ease;
      border-radius: 0.5rem;
    }
    
    .drag-drop-zone.drag-over {
      background-color: rgba(37, 99, 235, 0.1);
      border: 2px dashed var(--primary-color);
    }
    
    .image-preview-item {
      position: relative;
      transition: all 0.3s ease;
      opacity: 0;
      transform: translateY(20px);
    }
    
    .image-preview-item.preview-loaded {
      opacity: 1;
      transform: translateY(0);
    }
    
    .image-container {
      position: relative;
      overflow: hidden;
      border-radius: 0.5rem;
    }
    
    .image-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .image-container:hover .image-overlay {
      opacity: 1;
    }
    
    .main-badge {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    
    .file-details {
      display: flex;
      gap: 0.5rem;
      font-size: 0.7rem;
      color: var(--text-secondary);
    }
    
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), var(--success-color));
      width: 0%;
      transition: width 0.3s ease;
    }
    
    .file-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    
    .file-item:last-child {
      border-bottom: none;
    }
  </style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', dragDropStyles);

console.log("📸 Image Uploader script loaded");
