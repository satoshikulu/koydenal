import React, { useState, useRef } from 'react';
import { uploadListingImage, deleteListingImage } from '../lib/storage';

const ImageUpload = ({ onImagesChange, maxImages = 5, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);

    if (images.length + files.length > maxImages) {
      alert(`En fazla ${maxImages} resim yükleyebilirsiniz`);
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file, index) => {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        const result = await uploadListingImage(file, 'temp'); // You might want to use actual user ID

        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          return result.url;
        } else {
          console.error(`Upload failed for ${file.name}:`, result.error);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);

      if (validUrls.length > 0) {
        const newImages = [...images, ...validUrls];
        setImages(newImages);
        onImagesChange(newImages);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Resim yüklenirken hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress({});
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageUrl, index) => {
    try {
      // Extract file path from URL (this is a simplified approach)
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderName = urlParts[urlParts.length - 2];

      if (folderName && fileName) {
        await deleteListingImage(`${folderName}/${fileName}`);
      }

      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      onImagesChange(newImages);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Resim silinirken hata oluştu');
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#2c3e50'
      }}>
        Ürün Resimleri ({images.length}/{maxImages})
      </label>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          {images.map((image, index) => (
            <div key={index} style={{
              position: 'relative',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              aspectRatio: '1'
            }}>
              <img
                src={image}
                alt={`Ürün ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(image, index)}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Resmi Sil"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={openFileDialog}
        style={{
          border: '2px dashed #cbd5e0',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: uploading ? '#f7fafc' : '#ffffff',
          transition: 'all 0.3s ease'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploading ? (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #4299e1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Resimler yükleniyor...</p>
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: '2rem',
              marginBottom: '0.5rem'
            }}>
              📷
            </div>
            <p style={{ marginBottom: '0.5rem', color: '#4a5568' }}>
              Resim eklemek için tıklayın
            </p>
            <p style={{
              fontSize: '0.875rem',
              color: '#718096'
            }}>
              JPEG, PNG, WebP, GIF • Max {maxImages} resim • 50MB limit
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ImageUpload;
