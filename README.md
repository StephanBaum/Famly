# Famly 🏡 - Happy Household Coordinator & Family Hub

Famly is an intuitive, tactile, mobile-first household operating system designed for modern families (3–6 members). It coordinates calendars, multi-photo collaborative albums with relative sharing, smart supermarket shopping lists, recipe management with 1-tap grocery synchronization, kids chore & star tracking, and medical/emergency profiles.

---

## ✨ Features

- **🏡 Today Hub**: One-glance dashboard with daily timeline, tonight's dinner, quick chore checklist, and family bulletin board.
- **📅 Visual Color-Coded Calendar**: Filter by family member, quick-toggle view modes, and seamless appointment management.
- **🍳 Meal Planner & Recipe Box**:
  - 7-Day meal planner with Day-Focus mode for busy evenings.
  - Multi-input recipe importer: web URL extraction, photo/handwritten OCR scanning, natural language prompt generation, or manual entry.
  - 1-tap **"Add Ingredients to Grocery List"** with automatic staple deduplication (excludes salt, oil, flour, spices, etc.).
- **🛒 Smart Grocery List (Supermarket Mode)**:
  - Big 36px tactile checkboxes for one-handed cart navigation.
  - Automatic aisle/store sorting (Aldi, Trader Joe's, Target, Whole Foods, etc.) with learned item memory.
  - Shopping progress bar and collapsible "Already in Basket" drawer.
- **📸 Collaborative Family Albums & Relative Sharing**:
  - Multi-photo collaborative albums where all family members can contribute photos.
  - Direct guest links & QR codes for Grandma and visiting relatives (no login or PIN required!).
  - Relative love notes & reaction guestbook.
- **⭐ Chores & Rewards**: Gamified star tracker for kids with completion celebrations.
- **👶 Kids & Family Info**: Quick access to clothing/shoe sizes, doctor contacts, allergies, school schedules, and vaccination records.
- **📺 Ambient Kitchen Station (Hearth-Style)**: Glanceable, zero-clutter kitchen display with automatic daypart adaptation, 60s idle auto-reset, and pre-reader kids punch cards.
- **📍 Supermarket Geofence**: Automatically detects proximity to your grocery store and surfaces the 1-tap aisle-sorted shopping list.

---

## 📚 Documentation & Architecture Decisions

Comprehensive architectural guides and design rationale are documented in the [`docs/`](file:///c:/Users/Stephan/.gemini/antigravity/scratch/family-hub/docs/) directory:

- [**Master Product Vision & System Architecture**](file:///c:/Users/Stephan/.gemini/antigravity/scratch/family-hub/docs/PRODUCT_VISION_AND_SYSTEM_ARCHITECTURE.md) - The comprehensive North Star goal, full 7-system feature breakdown, and foundational design decisions for the entire app.
- [**Kitchen Kiosk & Ambient Display Guide**](file:///c:/Users/Stephan/.gemini/antigravity/scratch/family-hub/docs/KITCHEN_KIOSK_GUIDE.md) - Hardware deployment (iPad, Fire Tablet, Raspberry Pi), daypart testing, and auto-reset behavior.
- [**Autonomous Commerce & Logistics Roadmap (Step 2)**](file:///c:/Users/Stephan/.gemini/antigravity/scratch/family-hub/docs/AUTONOMOUS_COMMERCE_AND_LOGISTICS.md) - Automated cart staging (Rewe, Instacart, Amazon Fresh) and invisible carpool dispatch.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
The app will be accessible at:
- Local: `http://localhost:3000/`
- Network (Mobile Wi-Fi): `http://<your-local-ip>:3000/`

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 1-Click Vercel Deployment

Famly includes SPA routing configurations ready for deployment on [Vercel](https://vercel.com):

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/StephanBaum/Famly.git
   git push -u origin main
   ```
2. In Vercel, import the `StephanBaum/Famly` repository.
3. Deploy! Famly will be live on your custom domain or `*.vercel.app` in under a minute.

---

## 🔒 Privacy & Architecture
- **Local-First**: All data is securely stored locally in the browser's persistent storage.
- **Zero Authentication Barriers for Relatives**: Shared album links allow relatives to view and comment without creating accounts.
- **Duolingo-Inspired Tactile Design**: Cheerful colors, high contrast, bold borders, and bouncy micro-interactions.
