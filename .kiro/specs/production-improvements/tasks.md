# Implementation Plan

## Overview

Bu implementation plan, production-improvements feature'ının adım adım kodlanması için hazırlanmıştır. Her task, test-driven development yaklaşımıyla, incremental olarak ilerleyecek şekilde tasarlanmıştır.

---

## Tasks

- [ ] 1. Setup Test Infrastructure
  - Install testing dependencies (Vitest, React Testing Library, @testing-library/user-event)
  - Create test configuration file (vitest.config.js)
  - Setup test utilities and mock helpers (tests/utils/test-utils.jsx)
  - Create mock Supabase client factory
  - Add test scripts to package.json
  - _Requirements: 2.1, 2.2, 2.10_

- [ ] 1.1 Install testing dependencies
  - Run: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
  - Run: `npm install -D @vitest/ui` for test UI
  - _Requirements: 2.1, 2.10_

- [ ] 1.2 Create vitest.config.js
  - Configure test environment (jsdom)
  - Setup test globals
  - Configure coverage settings (60% threshold)
  - Add test file patterns
  - _Requirements: 2.5, 2.6_

- [ ] 1.3 Create test utilities
  - Create tests/utils/test-utils.jsx with custom render function
  - Create tests/utils/mocks.js with mock Supabase client
  - Create tests/utils/factories.js with test data factories
  - _Requirements: 2.8, 2.9_

- [ ] 1.4 Add test scripts to package.json
  - Add "test" script
  - Add "test:coverage" script
  - Add "test:watch" script
  - Add "test:ui" script
  - _Requirements: 2.1, 2.6_

- [ ] 2. Enhance Storage Service with Image Compression
  - Add image compression utility function
  - Add file content validation (magic bytes check)
  - Enhance uploadListingImage with compression
  - Add batch upload function for multiple images
  - Add progress callback support
  - _Requirements: 1.2, 1.3, 1.4, 1.10_

- [ ] 2.1 Create image compression utility
  - Create src/lib/imageUtils.js
  - Implement compressImage function using Canvas API
  - Add max width (1920px) and quality (0.8) parameters
  - Handle different image formats (JPEG, PNG, WebP)
  - _Requirements: 1.3_

- [ ] 2.2 Add file content validation
  - Implement validateImageContent function
  - Check magic bytes for JPEG, PNG, GIF, WebP
  - Return validation result with detected MIME type
  - _Requirements: 1.2_

- [ ] 2.3 Enhance uploadListingImage function
  - Add compression before upload
  - Add content validation before upload
  - Improve error messages
  - Add retry logic for failed uploads
  - Return metadata (size, uploadedAt, path)
  - _Requirements: 1.1, 1.4, 1.5, 1.7_

- [ ] 2.4 Create batch upload function
  - Implement uploadMultipleImages function
  - Upload images in parallel with Promise.all
  - Add progress tracking callback
  - Handle partial failures gracefully
  - _Requirements: 1.1, 1.10_

- [ ]* 2.5 Write unit tests for storage functions
  - Test compressImage with different sizes
  - Test validateImageContent with valid/invalid files
  - Test uploadListingImage success and error cases
  - Test uploadMultipleImages with multiple files
  - Mock Supabase storage client
  - _Requirements: 2.1, 2.8_

- [ ] 3. Update ImageUpload Component
  - Integrate real user ID from auth context
  - Add drag & drop support
  - Implement upload progress indicator
  - Add image compression before upload
  - Improve error handling with retry option
  - Add loading states during upload
  - _Requirements: 1.1, 1.4, 1.5, 1.6, 1.10_

- [ ] 3.1 Update ImageUpload props and state
  - Accept userId prop from auth context
  - Add uploadProgress state for tracking
  - Add uploading state for loading indicator
  - Add error state for error messages
  - _Requirements: 1.10_

- [ ] 3.2 Implement drag & drop functionality
  - Add onDrop handler
  - Add onDragOver handler
  - Add visual feedback for drag state
  - Validate dropped files
  - _Requirements: 1.1_

- [ ] 3.3 Add upload progress tracking
  - Update uploadProgress state during upload
  - Display progress bar for each image
  - Show percentage completion
  - _Requirements: 1.10_

- [ ] 3.4 Integrate image compression
  - Call compressImage before upload
  - Show compression progress
  - Handle compression errors
  - _Requirements: 1.3_

- [ ] 3.5 Improve error handling
  - Show user-friendly error messages
  - Add retry button for failed uploads
  - Clear errors on successful retry
  - _Requirements: 1.5_

- [ ]* 3.6 Write component tests for ImageUpload
  - Test file selection and preview
  - Test drag & drop functionality
  - Test upload progress display
  - Test error handling and retry
  - Test image removal
  - Mock upload functions
  - _Requirements: 2.2, 2.10_

- [ ] 4. Integrate ImageUpload into CreateAd Page
  - Replace file input with ImageUpload component
  - Pass real user ID from auth context
  - Handle uploaded images in form state
  - Submit image URLs with listing data
  - Show upload errors in form
  - Disable submit during upload
  - _Requirements: 1.1, 1.5, 1.7, 1.8, 1.9_

- [ ] 4.1 Import and add ImageUpload component
  - Import ImageUpload component
  - Import useAuth hook for user ID
  - Replace existing file input with ImageUpload
  - _Requirements: 1.1_

- [ ] 4.2 Manage uploaded images state
  - Add uploadedImages state
  - Add handleImagesChange callback
  - Update form validation to check images
  - _Requirements: 1.7_

- [ ] 4.3 Update form submission
  - Extract image URLs from uploadedImages
  - Set main_image to first image URL
  - Handle case when no images uploaded (use placeholder)
  - Disable submit button during upload
  - _Requirements: 1.7, 1.8, 1.9_

- [ ] 4.4 Add upload error handling
  - Display upload errors in form
  - Prevent submission if upload failed
  - Show retry option
  - _Requirements: 1.5_

- [ ]* 4.5 Write integration test for listing creation with images
  - Test complete flow: fill form, upload images, submit
  - Verify images are uploaded to storage
  - Verify listing is created with image URLs
  - Test error handling
  - _Requirements: 2.3, 2.4_

- [ ] 5. Implement Production Build Optimizations
  - Configure Vite for production builds
  - Implement code splitting and lazy loading
  - Add bundle analyzer
  - Optimize dependencies
  - Configure minification
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5.1 Update vite.config.js for production
  - Add manual chunks configuration (react-vendor, supabase-vendor)
  - Configure terser minification with console removal
  - Add chunk size warning limit (500KB)
  - Configure source maps for production
  - Add rollup-plugin-visualizer for bundle analysis
  - _Requirements: 3.1, 3.2_

- [ ] 5.2 Implement lazy loading in App.jsx
  - Import React.lazy and Suspense
  - Lazy load non-critical pages (Products, CreateAd, ProductDetail, AdminPanel, Login, Register)
  - Keep critical components eager loaded (Home, Navbar, Footer)
  - Create PageLoader component for Suspense fallback
  - _Requirements: 3.4_

- [ ] 5.3 Add preload for critical resources
  - Add preload links in index.html for fonts
  - Add preconnect for Supabase domain
  - Add dns-prefetch for external resources
  - _Requirements: 3.5_

- [ ] 5.4 Optimize dependencies
  - Add optimizeDeps configuration in vite.config.js
  - Include frequently used dependencies
  - _Requirements: 3.3_

- [ ] 6. Add Error Boundaries and Error Handling
  - Create ErrorBoundary component
  - Wrap App with ErrorBoundary
  - Create error utility functions
  - Add error logging for production
  - Implement retry logic for API calls
  - _Requirements: 3.10, 3.11_

- [ ] 6.1 Create ErrorBoundary component
  - Create src/components/ErrorBoundary.jsx
  - Implement componentDidCatch lifecycle
  - Add error UI with reload button
  - Log errors to console in development
  - _Requirements: 3.10_

- [ ] 6.2 Wrap App with ErrorBoundary
  - Import ErrorBoundary in main.jsx
  - Wrap App component with ErrorBoundary
  - _Requirements: 3.10_

- [ ] 6.3 Create error utility functions
  - Create src/lib/errors.js
  - Define custom error classes (ImageUploadError, ValidationError, NetworkError)
  - Create logError function for error logging
  - Create logEvent function for analytics
  - _Requirements: 3.8_

- [ ] 6.4 Implement retry logic for API calls
  - Create src/lib/retry.js
  - Implement retryWithBackoff function
  - Add exponential backoff strategy
  - Use in Supabase API calls
  - _Requirements: 3.11_

- [ ]* 6.5 Write tests for error handling
  - Test ErrorBoundary catches and displays errors
  - Test retry logic with failed API calls
  - Test error logging functions
  - _Requirements: 2.6_

- [ ] 7. Add Environment Validation and Security Improvements
  - Create environment validation utility
  - Remove admin password from .env
  - Update AdminContext to use Supabase Auth
  - Add input sanitization utility
  - Implement rate limiting strategy
  - _Requirements: 3.6, 3.7, 4.1, 4.2, 4.4, 4.5_

- [ ] 7.1 Create environment validation
  - Create src/lib/env.js
  - Implement validateEnv function
  - Check required environment variables
  - Validate URL formats
  - Call validateEnv in main.jsx
  - _Requirements: 3.6_

- [ ] 7.2 Update AdminContext for Supabase Auth
  - Remove VITE_ADMIN_PASSWORD from .env
  - Update loginAsAdmin to use email/password
  - Check user role from user_profiles table
  - Update AdminLogin component to accept email and password
  - _Requirements: 4.1, 4.2_

- [ ] 7.3 Create input sanitization utility
  - Install dompurify: `npm install dompurify`
  - Create src/lib/sanitize.js
  - Implement sanitizeInput function
  - Implement sanitizeFormData function
  - Use in form submissions
  - _Requirements: 4.5_

- [ ] 7.4 Document rate limiting strategy
  - Add rate limiting notes to README
  - Document Supabase rate limits
  - Add client-side request throttling
  - _Requirements: 4.4_

- [ ]* 7.5 Write security tests
  - Test environment validation
  - Test admin authentication flow
  - Test input sanitization
  - _Requirements: 2.1_

- [ ] 8. Add Performance Monitoring
  - Install web-vitals package
  - Create performance monitoring utility
  - Add performance logging
  - Implement memoization for expensive components
  - Add debouncing for search inputs
  - _Requirements: 3.12_

- [ ] 8.1 Install and setup web-vitals
  - Run: `npm install web-vitals`
  - Create src/lib/performance.js
  - Implement reportWebVitals function
  - Call in main.jsx
  - _Requirements: 3.12_

- [ ] 8.2 Add React.memo to expensive components
  - Wrap ProductCard with React.memo
  - Wrap CategoryCard with React.memo
  - Add custom comparison function
  - _Requirements: 3.12_

- [ ] 8.3 Add debouncing to search inputs
  - Install lodash.debounce: `npm install lodash.debounce`
  - Add debounce to search input in Products page
  - Add debounce to search suggestions in Home page
  - Set 300ms delay
  - _Requirements: 3.12_

- [ ] 9. Write Core Unit Tests
  - Test storage utility functions
  - Test validation functions
  - Test sanitization functions
  - Test error utilities
  - Achieve >90% coverage for utilities
  - _Requirements: 2.1, 2.5_

- [ ] 9.1 Write storage utility tests
  - Create tests/unit/storage.test.js
  - Test uploadListingImage with valid/invalid files
  - Test deleteListingImage
  - Test getUserListingImages
  - Mock Supabase storage client
  - _Requirements: 2.1, 2.8_

- [ ] 9.2 Write validation tests
  - Create tests/unit/validation.test.js
  - Test form validation functions
  - Test file validation functions
  - Test image content validation
  - _Requirements: 2.1_

- [ ] 9.3 Write sanitization tests
  - Create tests/unit/sanitize.test.js
  - Test sanitizeInput with various inputs
  - Test sanitizeFormData
  - Test XSS prevention
  - _Requirements: 2.1_

- [ ] 9.4 Write error utility tests
  - Create tests/unit/errors.test.js
  - Test custom error classes
  - Test error logging functions
  - _Requirements: 2.1_

- [ ] 10. Write Component Tests
  - Test ImageUpload component
  - Test CreateAd form component
  - Test Products list component
  - Test Navbar component
  - Achieve >50% coverage for components
  - _Requirements: 2.2, 2.5, 2.10_

- [ ] 10.1 Write ImageUpload component tests
  - Create tests/components/ImageUpload.test.jsx
  - Test file selection and preview
  - Test drag & drop
  - Test upload progress
  - Test error handling
  - Test image removal
  - _Requirements: 2.2, 2.10_

- [ ] 10.2 Write CreateAd component tests
  - Create tests/components/CreateAd.test.jsx
  - Test form rendering
  - Test form validation
  - Test image upload integration
  - Test form submission
  - _Requirements: 2.2, 2.10_

- [ ] 10.3 Write Products component tests
  - Create tests/components/Products.test.jsx
  - Test listing display
  - Test filtering
  - Test search functionality
  - _Requirements: 2.2, 2.10_

- [ ] 10.4 Write Navbar component tests
  - Create tests/components/Navbar.test.jsx
  - Test navigation links
  - Test auth state display
  - Test logout functionality
  - _Requirements: 2.2, 2.10_

- [ ] 11. Write Integration Tests
  - Test authentication flow (login, register, logout)
  - Test listing creation flow (form fill, image upload, submit)
  - Test admin approval flow
  - Achieve >80% coverage for critical paths
  - _Requirements: 2.3, 2.4, 2.5_

- [ ] 11.1 Write authentication flow tests
  - Create tests/integration/auth-flow.test.jsx
  - Test user registration
  - Test user login
  - Test user logout
  - Test session persistence
  - _Requirements: 2.3_

- [ ] 11.2 Write listing creation flow tests
  - Create tests/integration/listing-creation.test.jsx
  - Test complete listing creation flow
  - Test with image upload
  - Test without images (placeholder)
  - Test validation errors
  - _Requirements: 2.4_

- [ ] 11.3 Write admin approval flow tests
  - Create tests/integration/admin-approval.test.jsx
  - Test admin login
  - Test listing approval
  - Test listing rejection
  - _Requirements: 2.3_

- [ ] 12. Update Documentation
  - Update README with setup instructions
  - Add testing documentation
  - Add deployment guide
  - Document environment variables
  - Add troubleshooting section
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 12.1 Update README.md
  - Add project description
  - Add setup instructions
  - Add testing commands
  - Add build commands
  - Add deployment instructions
  - _Requirements: 5.1_

- [ ] 12.2 Create TESTING.md
  - Document test structure
  - Explain how to run tests
  - Document test utilities
  - Add examples
  - _Requirements: 5.2_

- [ ] 12.3 Create DEPLOYMENT.md
  - Document deployment process
  - List environment variables
  - Add pre-deployment checklist
  - Document monitoring setup
  - _Requirements: 5.4_

- [ ] 12.4 Update .env.example
  - List all required environment variables
  - Add descriptions for each variable
  - Remove VITE_ADMIN_PASSWORD
  - _Requirements: 5.5_

- [ ] 13. Setup CI/CD Pipeline (Optional)
  - Create GitHub Actions workflow
  - Run tests on pull requests
  - Run linting on pull requests
  - Build and deploy on merge to main
  - _Requirements: 2.7_

- [ ] 13.1 Create .github/workflows/test.yml
  - Setup Node.js environment
  - Install dependencies
  - Run tests with coverage
  - Upload coverage report
  - _Requirements: 2.7_

- [ ] 13.2 Create .github/workflows/deploy.yml
  - Setup Node.js environment
  - Install dependencies
  - Run build
  - Deploy to hosting (Vercel/Netlify)
  - _Requirements: 2.7_

- [ ] 14. Final Testing and Optimization
  - Run full test suite and verify coverage
  - Run Lighthouse audit on all pages
  - Verify bundle size is under 500KB
  - Test on different browsers
  - Test on mobile devices
  - Fix any remaining issues
  - _Requirements: 2.5, 3.12_

- [ ] 14.1 Verify test coverage
  - Run: `npm run test:coverage`
  - Verify overall coverage >60%
  - Verify critical paths >80%
  - _Requirements: 2.5_

- [ ] 14.2 Run Lighthouse audits
  - Audit Home page
  - Audit Products page
  - Audit CreateAd page
  - Verify all scores >80
  - _Requirements: 3.12_

- [ ] 14.3 Verify bundle size
  - Run: `npm run build`
  - Check dist folder size
  - Verify main bundle <500KB (gzipped)
  - _Requirements: 3.2_

- [ ] 14.4 Cross-browser testing
  - Test on Chrome
  - Test on Firefox
  - Test on Safari
  - Test on Edge
  - _Requirements: 3.12_

- [ ] 14.5 Mobile testing
  - Test on iOS Safari
  - Test on Android Chrome
  - Verify responsive design
  - Test touch interactions
  - _Requirements: 3.12_

---

## Notes

- Tasks marked with `*` are optional testing tasks that can be skipped if time is limited
- Each task should be completed and tested before moving to the next
- Use git commits after completing each major task
- Run `npm test` frequently to ensure no regressions
- Keep the design document and requirements handy during implementation

## Estimated Timeline

- **Phase 1 (Tasks 1-4)**: Image Upload - 3 days
- **Phase 2 (Tasks 5-8)**: Production Optimizations - 3 days
- **Phase 3 (Tasks 9-11)**: Testing - 4 days
- **Phase 4 (Tasks 12-14)**: Documentation & Polish - 2 days

**Total: 12 days**
