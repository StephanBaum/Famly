# Famly 🏡 - Kitchen Kiosk & Ambient Display Guide

This guide explains how Famly operates on wall-mounted screens, countertop tablets, and fridge displays (similar to Hearth Display or Skylight Calendar) without requiring dedicated proprietary hardware.

---

## 1. Hardware Recommendations

| Hardware Option | Est. Cost | Best For | Setup Notes |
| :--- | :--- | :--- | :--- |
| **Old iPad (iPad 6+ or Air 2+)** | \$0 (repurposed) | Countertop stand or magnetic fridge mount | Use Safari $\rightarrow$ "Zum Home-Bildschirm hinzufügen" (PWA mode). Enable Guided Access to lock to Famly. |
| **Amazon Fire HD 10 (or HD 8)** | \$60 – \$110 | Dedicated budget kitchen wall mount | Install Google Play / Chrome via Fire Toolbox, add to home screen. |
| **Raspberry Pi 4 / 5 + Touchscreen (10"–15")** | \$120 – \$180 | Custom DIY kitchen build | Run Raspberry Pi OS in Chromium Kiosk mode (`chromium-browser --kiosk http://localhost:3000`). |

---

## 2. Automatic Activation & Detection

Famly requires **no manual toggling** to launch into the Ambient Kitchen Station:

1. **Automatic Form-Factor Heuristic:**
   * If the display is in landscape orientation with screen dimensions $\ge 1024 \times 600$ px and running in standalone PWA mode, Famly boots straight into the **Ambient Kitchen Station**.
2. **Explicit Device Role Setting:**
   * In **Einstellungen ➔ Geräte-Rolle**: select **"Kühlschrank / Wand-Tablet"**.
   * This setting is persisted in `localStorage` (`famly_device_role_v1`).
3. **URL Parameter (Direct Bookmark):**
   * Append `?kiosk=1` or `#kiosk` to the URL.
   * Example: `https://your-famly-domain.vercel.app/?kiosk=1`

---

## 3. Inactivity Auto-Reset (Zero Maintenance)

On a communal kitchen screen, users should never leave the display trapped on a buried settings subpage or an open recipe modal:

* When `isKioskDevice()` is true:
  * An idle detector monitors all user interactions (`click`, `touchstart`, `mousemove`, `keydown`, `scroll`).
  * If a family member taps **"Alle Bereiche öffnen"** to view recipes or edit appointments, a **60-second inactivity countdown** begins.
  * After 60 seconds of no touch/input, the display smoothly returns to the calm **Ambient Kitchen Station**.
* A manual **"📺 Station"** button is also available in the header for immediate return.

---

## 4. Time-of-Day Adaptive Phases (Dayparting)

The display automatically morphs its content according to household hours:

```
06:30 ───────────── 09:00 ───────────── 15:30 ───────────── 20:30 ───────────── 06:30
  MORNING RUSH        DAY AMBIENT         EVENING HUB         NIGHT DIM
  • Bus Countdown     • Photo Memories    • Tonight's Dinner  • Amber Soft Glow
  • Clothing Icon     • Quiet Status      • 20m Cook Timer    • Sleep Status
  • Kids 3-Punch      • Dinner Preview    • Chore Stars       • Dim Clock
```

### URL Overrides for Testing:
You can force any phase in development or testing by adding `?daypart=<phase>` to the URL:
* `?daypart=morning_rush`
* `?daypart=day_ambient`
* `?daypart=evening_hub`
* `?daypart=night_dim`

Alternatively, use the quick simulation pill buttons (`Morgen | Tag | Abend | Nacht`) located in the header of the Ambient Station.

---

## 5. Kids Morning 3-Punch Launchpad

* **Teeth (🪥 Zähne):** Morning hygiene.
* **Schoolbag (🎒 Ranzen):** Books, homework, and lunchbox packed.
* **Shoes & Jacket (👟 Schuhe):** Dressed and ready for departure.

Tapping any punch card triggers:
1. Web Audio synthesizer chord (triangle wave C5 $\rightarrow$ E5 $\rightarrow$ G5).
2. Canvas confetti explosion.
3. Progress count update (`2/3 Aufgaben`) and celebratory star on full completion (`3/3`).
4. State is stored locally by date (`famly_morning_punches_YYYY-MM-DD`) and resets automatically every morning.
