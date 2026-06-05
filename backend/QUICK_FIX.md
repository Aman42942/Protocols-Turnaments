# Implement Persistent Media Upload System

The current local storage system on Render is ephemeral (files are deleted on restart) and has protocol issues (HTTP vs HTTPS). This update switches to Cloudinary for permanent storage and fixes production display issues.

## User Review Required

> [!IMPORTANT]
> This change will move media storage from the server's disk to **Cloudinary**. Existing locally uploaded files (if any remained) will not be accessible after this change, but your `.env` already contains the necessary Cloudinary credentials.

## Proposed Changes

### Backend (NestJS)

#### [MODIFY] [media.controller.ts](file:///c:/Users/amanh/OneDrive/Documents/Protocal%20Turnamant/backend/src/cms/media.controller.ts)
- Integrate `cloudinary` for file uploads.
- Remove `multer.diskStorage` and use `multer.memoryStorage`.
- Upload received bitstream directly to Cloudinary and return the secure HTTPS URL.

#### [MODIFY] [main.ts](file:///c:/Users/amanh/OneDrive/Documents/Protocal%20Turnamant/backend/src/main.ts)
- Update Content Security Policy (CSP) to allow `https:` and `res.cloudinary.com`.
- Ensure `imgSrc` and `mediaSrc` are permissive enough for production.

### Frontend (Next.js)

#### [MODIFY] [MediaUpload.tsx](file:///c:/Users/amanh/OneDrive/Documents/Protocal%20Turnamant/frontend/src/components/admin/MediaUpload.tsx)
- Ensure the preview handles the production URLs correctly.

## Verification Plan

### Automated Tests
- Upload an image via the Slide Creator and verify it renders in the preview.
- Upload a video and verify it renders in the preview.

### Manual Verification
- Check the "OR PASTE DIRECT URL" field after upload to ensure it starts with `https://res.cloudinary.com`.
- Verify the homepage shows the new Cloudinary-hosted media.
