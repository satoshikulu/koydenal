# Design Document

## Overview

Bu design dokümanı, KöydenDirekt platformunun production-ready hale getirilmesi için gerekli üç kritik iyileştirmenin teknik tasarımını detaylandırır:

1. **Image Upload Entegrasyonu**: Supabase Storage ile gerçek resim yükleme
2. **Test Infrastructure**: Vitest + React Testing Library ile test altyapısı
3. **Production Optimizations**: Vite build optimizasyonları ve best practices

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │   Contexts   │      │
│  │              │  │              │  │              │      │
│  │ - CreateAd   │  │ - ImageUpload│  │ - AuthContext│      │
│  │ - Products   │  │ - ErrorBound │  │ - DataContext│      │
│  │ - Home       │  │ - LazyLoad   │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   Lib Layer     │                        │
│                  │                 │                        │
│                  │ - storage.js    │                        │
│                  │ - supabase.js   │                        │
│                  │ - utils.js      │                        │
│                  └────────┬────────┘                        │
└───────────────────────────┼─────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Supabase      │
                   │                 │
                   │ - Auth          │
                   │ - Database      │
                   │ - Storage       │
                   └─────────────────┘
```

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Test Suite                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Unit Tests   │  │ Component    │  │ Integration  │      │
│  │              │  │ Tests        │  │ Tests        │      │
│  │ - utils      │  │ - ImageUpload│  │ - Auth Flow  │      │
│  │ - storage    │  │ - CreateAd   │  │ - Listing    │      │
│  │ - validation │  │ - Products   │  │   Creation   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Test Utilities & Mocks                 │       │
│  │                                                  │       │
│  │  - Mock Supabase Client                         │       │
│  │  - Mock Auth Context                            │       │
│  │  - Test Data Factories                          │       │
│  │  - Custom Render Functions                      │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Image Upload System

#### ImageUpload Component Enhancement

**Current State:**
- Component exists but not integrated
- Has basic upload/delete functionality
- Uses temporary user ID

**New Design:**

```typescript
interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  existingImages?: string[];
  userId: string; // Real user ID from auth
  disabled?: boolean;
}

interface UploadedImage {
  url: string;
  path: string;
  size: number;
  uploadedAt: Date;
}

interface UploadProgress {
  [fileName: string]: number; // 0-100
}
```

**Key Features:**
- Real-time upload progress
- Image compression before upload
- Drag & drop support
- Preview with remove option
- Error handling with retry
- Optimistic UI updates

#### Storage Service Enhancement

**File:** `src/lib/storage.js`

**New Functions:**

```javascript
// Enhanced upload with compression
export const uploadListingImage = async (file, userId, options = {}) => {
  // 1. Validate file
  // 2. Compress image if needed
  // 3. Generate unique filename
  // 4. Upload to Supabase Storage
  // 5. Return public URL and metadata
}

// Batch upload for multiple images
export const uploadMultipleImages = async (files, userId, onProgress) => {
  // Upload images in parallel with progress tracking
}

// Image compression utility
export const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  // Use canvas API to compress
}

// Validate image content (not just extension)
export const validateImageContent = async (file) => {
  // Check file signature/magic bytes
}
```

#### CreateAd Integration

**Changes to CreateAd.jsx:**

1. Replace file input with ImageUpload component
2. Store uploaded image data in state
3. Submit image URLs with listing data
4. Handle upload errors gracefully
5. Show upload progress during submission

```javascript
// State management
const [uploadedImages, setUploadedImages] = useState([]);
const [uploadError, setUploadError] = useState(null);

// Handle image changes
const handleImagesChange = (images) => {
  setUploadedImages(images);
  setUploadError(null);
};

// Submit with real images
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate images
  if (uploadedImages.length === 0) {
    // Use placeholder or show warning
  }
  
  // Prepare listing data
  const listingData = {
    ...formData,
    images: uploadedImages.map(img => img.url),
    main_image: uploadedImages[0]?.url || null,
  };
  
  // Submit to Supabase
};
```

### 2. Test Infrastructure

#### Test Setup

**File Structure:**
```
tests/
├── setup.js                 # Test configuration
├── utils/
│   ├── test-utils.jsx      # Custom render, mocks
│   ├── factories.js        # Test data factories
│   └── mocks.js            # Mock implementations
├── unit/
│   ├── storage.test.js     # Storage functions
│   ├── validation.test.js  # Form validation
│   └── utils.test.js       # Utility functions
├── components/
│   ├── ImageUpload.test.jsx
│   ├── CreateAd.test.jsx
│   ├── Products.test.jsx
│   └── Navbar.test.jsx
└── integration/
    ├── auth-flow.test.jsx
    └── listing-creation.test.jsx
```

#### Test Utilities

**File:** `tests/utils/test-utils.jsx`

```javascript
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';

// Custom render with providers
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
  
  return render(ui, { wrapper: Wrapper, ...options });
};

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } }
    })),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      remove: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
});
```

#### Test Examples

**Unit Test Example:**

```javascript
// tests/unit/storage.test.js
import { describe, it, expect, vi } from 'vitest';
import { uploadListingImage, validateImageContent } from '../../src/lib/storage';

describe('Storage Functions', () => {
  it('should validate image file type', async () => {
    const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
    const result = await validateImageContent(validFile);
    expect(result.valid).toBe(true);
  });
  
  it('should reject files larger than 50MB', async () => {
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.jpg');
    const result = await uploadListingImage(largeFile, 'user-id');
    expect(result.success).toBe(false);
    expect(result.error).toContain('50MB');
  });
});
```

**Component Test Example:**

```javascript
// tests/components/ImageUpload.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import ImageUpload from '../../src/components/ImageUpload';

describe('ImageUpload Component', () => {
  it('should upload and display image preview', async () => {
    const onImagesChange = vi.fn();
    const user = userEvent.setup();
    
    renderWithProviders(
      <ImageUpload 
        onImagesChange={onImagesChange}
        userId="test-user"
      />
    );
    
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload/i);
    
    await user.upload(input, file);
    
    await waitFor(() => {
      expect(screen.getByAltText(/test.jpg/i)).toBeInTheDocument();
    });
    
    expect(onImagesChange).toHaveBeenCalled();
  });
});
```

**Integration Test Example:**

```javascript
// tests/integration/listing-creation.test.jsx
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import CreateAd from '../../src/pages/CreateAd';

describe('Listing Creation Flow', () => {
  it('should create a listing with images', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<CreateAd />);
    
    // Fill form
    await user.type(screen.getByLabelText(/başlık/i), 'Test Product');
    await user.selectOptions(screen.getByLabelText(/kategori/i), 'besi');
    await user.type(screen.getByLabelText(/fiyat/i), '100');
    
    // Upload image
    const file = new File(['image'], 'product.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/görsel/i), file);
    
    // Submit
    await user.click(screen.getByRole('button', { name: /oluştur/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/başarıyla/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Production Optimizations

#### Build Configuration

**File:** `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
}));
```

#### Lazy Loading Implementation

**File:** `src/App.jsx`

```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Eager load critical components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';

// Lazy load non-critical pages
const Products = lazy(() => import('./pages/Products'));
const CreateAd = lazy(() => import('./pages/CreateAd'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

// Loading component
const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner-border text-success" role="status">
      <span className="visually-hidden">Yükleniyor...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/urunler" element={<Products />} />
                <Route path="/ilan-ver" element={<CreateAd />} />
                <Route path="/ilan-detay/:id" element={<ProductDetail />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}
```

#### Error Boundary

**File:** `src/components/ErrorBoundary.jsx`

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service (e.g., Sentry)
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // logErrorToService(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Bir şeyler yanlış gitti</h2>
          <p>Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.</p>
          <button onClick={() => window.location.reload()}>
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Environment Validation

**File:** `src/lib/env.js`

```javascript
/**
 * Validate required environment variables
 */
export const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join('\n')}\n\n` +
      'Please check your .env file.'
    );
  }
  
  // Validate URL format
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL must start with https://');
  }
  
  return true;
};

// Call on app initialization
validateEnv();
```

#### Performance Monitoring

**File:** `src/lib/performance.js`

```javascript
/**
 * Web Vitals monitoring
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Usage in main.jsx
reportWebVitals(console.log);
```

## Data Models

### UploadedImage Model

```typescript
interface UploadedImage {
  url: string;           // Public URL from Supabase
  path: string;          // Storage path (userId/filename)
  size: number;          // File size in bytes
  uploadedAt: Date;      // Upload timestamp
  fileName: string;      // Original filename
  mimeType: string;      // MIME type
}
```

### Test Data Factory

```javascript
// tests/utils/factories.js
export const createMockListing = (overrides = {}) => ({
  id: 'test-listing-id',
  title: 'Test Product',
  description: 'Test description',
  price: 100,
  currency: 'TRY',
  location: 'Test Location',
  category_id: 'test-category-id',
  status: 'pending',
  user_id: 'test-user-id',
  images: [],
  main_image: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  ...overrides,
});
```

## Error Handling

### Error Types

```javascript
// src/lib/errors.js
export class ImageUploadError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
  }
}

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError';
    this.statusCode = statusCode;
  }
}
```

### Error Handling Strategy

1. **User-Facing Errors**: Show friendly messages in UI
2. **Developer Errors**: Log to console in development
3. **Production Errors**: Send to monitoring service
4. **Network Errors**: Implement retry logic
5. **Validation Errors**: Show inline form errors

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │ Integration │  (20%)
        │   Tests     │
        ├─────────────┤
        │  Component  │  (30%)
        │   Tests     │
        ├─────────────┤
        │    Unit     │  (50%)
        │   Tests     │
        └─────────────┘
```

### Coverage Goals

- **Overall**: 60%+
- **Critical Paths**: 80%+
  - Authentication flow
  - Listing creation
  - Image upload
  - Admin approval
- **Utility Functions**: 90%+
- **UI Components**: 50%+

### Test Execution

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- ImageUpload.test.jsx

# Run integration tests only
npm test -- tests/integration
```

## Security Considerations

### 1. Admin Authentication Improvement

**Current Problem**: Plain text password in .env

**Solution**: Use Supabase Auth with admin role

```javascript
// Remove VITE_ADMIN_PASSWORD from .env
// Use role-based authentication instead

const loginAsAdmin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) return { success: false, error: error.message };
  
  // Check if user has admin role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    await supabase.auth.signOut();
    return { success: false, error: 'Unauthorized' };
  }
  
  return { success: true };
};
```

### 2. File Upload Security

```javascript
// Validate file content, not just extension
const validateImageContent = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      
      // Check magic bytes for common image formats
      const validHeaders = {
        '89504e47': 'image/png',
        'ffd8ffe0': 'image/jpeg',
        'ffd8ffe1': 'image/jpeg',
        '47494638': 'image/gif',
      };
      
      resolve({
        valid: header in validHeaders,
        mimeType: validHeaders[header]
      });
    };
    
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};
```

### 3. Input Sanitization

```javascript
// src/lib/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};

export const sanitizeFormData = (formData) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(formData)) {
    sanitized[key] = typeof value === 'string' 
      ? sanitizeInput(value) 
      : value;
  }
  return sanitized;
};
```

## Performance Optimizations

### 1. Image Optimization

```javascript
// Compress images before upload
const compressImage = async (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: file.type })),
          file.type,
          quality
        );
      };
    };
  });
};
```

### 2. Memoization

```javascript
// Use React.memo for expensive components
import { memo } from 'react';

const ProductCard = memo(({ product }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id;
});
```

### 3. Debouncing

```javascript
// Debounce search input
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query) => {
    // Perform search
  }, 300),
  []
);
```

## Deployment Checklist

- [ ] All tests passing
- [ ] Test coverage >60%
- [ ] Build succeeds without warnings
- [ ] Environment variables configured
- [ ] Lighthouse score >80
- [ ] Bundle size <500KB
- [ ] Error boundaries in place
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Monitoring/logging configured
- [ ] README updated
- [ ] API documentation complete

## Monitoring and Logging

### Error Tracking

```javascript
// src/lib/monitoring.js
export const logError = (error, context = {}) => {
  if (import.meta.env.DEV) {
    console.error('Error:', error, context);
    return;
  }
  
  // In production, send to monitoring service
  // Example: Sentry, LogRocket, etc.
  // Sentry.captureException(error, { extra: context });
};

export const logEvent = (eventName, properties = {}) => {
  if (import.meta.env.DEV) {
    console.log('Event:', eventName, properties);
    return;
  }
  
  // In production, send to analytics
  // Example: Google Analytics, Mixpanel, etc.
  // analytics.track(eventName, properties);
};
```

## Documentation Requirements

### README Updates

```markdown
# KöydenDirekt

## Setup

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Configure Supabase credentials
5. Run development server: `npm run dev`

## Testing

- Run tests: `npm test`
- Run with coverage: `npm run test:coverage`
- Run in watch mode: `npm run test:watch`

## Building

- Development build: `npm run build`
- Production build: `npm run build -- --mode production`
- Analyze bundle: `npm run build -- --mode analyze`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.
```

## Success Criteria

✅ **Image Upload**
- Users can upload real images
- Upload success rate >95%
- Images are compressed automatically
- Progress indicator shows during upload

✅ **Testing**
- Test coverage >60%
- All critical paths tested
- CI/CD pipeline runs tests
- Tests run in <30 seconds

✅ **Performance**
- Lighthouse score >80
- Bundle size <500KB
- Time to Interactive <3s
- First Contentful Paint <1.5s

✅ **Security**
- No plain text passwords
- Input sanitization implemented
- File content validation
- Error messages don't expose sensitive data

✅ **Developer Experience**
- Clear documentation
- Easy setup process
- Fast test execution
- Helpful error messages
