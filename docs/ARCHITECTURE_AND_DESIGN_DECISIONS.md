# Famly 🏡 - Architecture & Design Decisions

> **Core Philosophy**: *Minimize screen time. Run the household like an autonomous team of servants. Never require the user to configure or switch modes manually.*

---

## 1. The Strategic Paradigm: "Appliance Over App"

### Why Most Family Apps Fail (The 3 Fatal Traps)
1. **The Asymmetric Effort Trap:** One parent (usually Mom) becomes the unpaid administrative manager of the app, entering 90% of the data while the other parent and kids abandon it after two weeks.
2. **The "Flour on Hands" Barrier:** Life happens in the kitchen, garage, and school run. If adding milk, checking dinner, or punching a chore requires unlocking a smartphone, finding an app icon, and navigating menus, it doesn't happen.
3. **The Feature Shower Fallacy:** Adding more tabs, submenus, and complex customization options increases cognitive load. A family organizer should remove cognitive burden, not add administrative chores.

### The Expensive Hardware Comparison
* Dedicated wall screens (\$300–\$700) prove families will pay a massive premium to have an always-on display in the kitchen.
* However, existing hardware displays are still largely **passive digital paper**—the parents still have to do all the work manually.
* **Famly’s Value Proposition:** An **Autonomous Household Butler** that proactively stages work (grocery baskets, carpool dispatches, kid routines) and requires only a single tap to approve.

---

## 2. Core Architectural Design Decisions

### Decision 1: Zero Manual Mode Switching (Context-Driven Engine)
* **Problem:** Users will not remember to toggle "Fridge Mode" in the morning or "Shopping Mode" at the grocery store.
* **Decision:** The app senses its own physical context and adapts automatically without user intervention:
  * **Device Detection:** Screens $>1024$px in landscape, running standalone PWA, or explicitly flagged as a kitchen station in settings automatically default to the **Ambient Kitchen Station**.
  * **Location Geofencing:** Proximity ($<150$m) to the family supermarket automatically presents the aisle-sorted **Shopping Focus Mode**.
  * **Inactivity Auto-Reset:** When running on a kitchen screen, inspecting a calendar or editing a meal plan will automatically glide back to the ambient display after 60 seconds of idle time. The kitchen screen never stays stuck on an edit modal.

### Decision 2: Time-of-Day Adaptive Display (Dayparting)
* **Problem:** A static dashboard requires scanning past irrelevant information (e.g. looking at dinner recipes at 7:15 AM while packing schoolbags).
* **Decision:** The main display dynamically morphs its primary focus based on the natural rhythm of a family home:
  1. **Morning Rush (06:30 – 09:00):**
     * High-contrast time and school departure countdown.
     * Clothing/weather recommendation with instant visual icons (raincoat / snowsuit / light jacket).
     * **Kids 3-Punch Launchpad:** Big 60px buttons for Teeth 🪥, Backpack 🎒, and Shoes 👟 with instant audio chimes and confetti.
  2. **Day Ambient (09:00 – 15:30):**
     * Low-stimulation, serene family photo slideshow.
     * Quiet household status ("All kids at school/kindergarten").
     * Tonight's dinner preview (what to thaw or prep).
  3. **Evening Hub (15:30 – 20:30):**
     * Tonight's Dinner front and center with Chef avatar.
     * **1-Tap 20-Minute Cooking Timer** with audible countdown chime.
     * Evening sports/pickup timeline and chore star completion.
  4. **Night Dim (20:30 – 06:30):**
     * Amber, low-blue-light display so the screen does not disturb the kitchen at night.

### Decision 3: Kids Intrinsic Motivation (Pre-Reader & Duolingo-Inspired UX)
* **Problem:** Text-heavy chore checklists require constant parental nagging and cannot be used by 4–7-year-olds who cannot read yet.
* **Decision:**
  * Visual-first icons (toothbrush, schoolbag, shoes) with high-contrast color states.
  * Instant multi-sensory feedback: Web Audio harmonic synthesizer chimes (triangle wave C5 $\rightarrow$ E5 $\rightarrow$ G5) + micro-confetti.
  * Star tracking with real household reward exchange (screen time, pocket money, family movie pick).

### Decision 4: Supermarket Proximity & Offline-Resilient Cart Focus
* **Problem:** Shopping in a supermarket with spotty cell reception while pushing a cart with one hand leads to dropped items and frustrating phone navigation.
* **Decision:**
  * Proximity detection via HTML5 Geolocation `watchPosition` against saved store coordinates.
  * Instant floating banner: *"Du bist bei Rewe! (X offene Artikel)"* with 1-tap launch into `ShoppingFocusModal`.
  * Extra-large 36px tactile checkboxes, high-contrast check states, and automatic aisle categorization.

---

## 3. Component & State Architecture

```
src/
├── services/
│   ├── contextEngine.ts         # Real-time state machine: dayparting, kiosk sensing, geofence, idle watcher
│   ├── weatherService.ts        # Open-Meteo zero-key weather & family clothing recommendations
│   ├── notificationService.ts   # Device reminder scheduler & web notifications
│   └── vercelSync.ts            # Local-first persistence + Vercel Upstash Redis cloud sync
├── components/
│   ├── kiosk/
│   │   └── AmbientKitchenStation.tsx   # Appliance-grade full-viewport ambient kitchen display
│   ├── groceries/
│   │   ├── StoreArrivalBanner.tsx      # Geofenced arrival notification card
│   │   └── ShoppingFocusModal.tsx      # One-handed supermarket cart mode
│   └── SettingsModal.tsx               # Device role configuration & GPS calibration
└── context/
    ├── FamilyContext.tsx        # Centralized household state (members, meals, groceries, chores)
    └── storageKeys.ts           # LocalStorage keys for offline-first resilience
```

---

## 4. Key Metrics for Success
1. **Time Spent in App:** Lower is better. If a parent manages the household in under 60 seconds a day, Famly is succeeding.
2. **Kids Autonomous Completion Rate:** Percentage of morning routine items checked off by children without parental verbal reminders.
3. **Cart Conversion Speed:** Time from grocery store arrival to list completion in Shopping Focus Mode.
