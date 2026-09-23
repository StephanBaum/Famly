# Famly 🏡 - Autonomous Commerce & Logistics Architecture (Step 2 Roadmap)

This document outlines the technical architecture and design decisions for **Step 2**: transforming Famly from a passive list tracker into an active, autonomous household coordinator that stages orders and coordinates logistics with the outside world.

---

## 1. Autonomous Grocery & Pantry Provisioning

### The Core Problem
Conventional apps require parents to manually type ingredients, manually sort them, and walk through supermarkets. If an app claims to be an "intelligent household butler," it must **do the work of assembling the shopping cart** and only request a 1-tap confirmation.

### The SKU Resolution & Cart Staging Pipeline

```
┌────────────────────────────────┐
│   MEAL PLAN (Recipes)          │
│   + STAPLE REPLENISHMENT CYCLE │ ──┐
│   (Milk every 4d, Eggs 7d)     │   │
└────────────────────────────────┘   │
                                     ▼
                      ┌──────────────────────────────┐
                      │   SKU RESOLUTION ENGINE      │
                      │   (Ingredient ➔ Exact Store  │
                      │    Product EAN / ASIN / SKU) │
                      └──────────────┬───────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
┌───────────────────────────────┐               ┌───────────────────────────────┐
│     EUROPE / GERMANY          │               │      US / GLOBAL              │
│  Rewe Lieferservice / Bring!  │               │  Instacart Developer Platform │
│  • Session Basket API         │               │  • Shoppable Cart API         │
│  • shop.rewe.de/api/basket    │               │  • POST /api/v2/carts         │
└──────────────┬────────────────┘               └──────────────┬────────────────┘
               │                                               │
               └───────────────────────┬───────────────────────┘
                                       ▼
                      ┌─────────────────────────────────┐
                      │  PRE-POPULATED LIVE STORE CART  │
                      │  (14 items resolved · €42.80)   │
                      └────────────────┬────────────────┘
                                       ▼
                       HUMAN-IN-THE-LOOP APPROVAL CARD:
                      [ Confirm Rewe Order for Wed 18:00 ]
```

### Technical Integration Details:
1. **Instacart Developer Platform (Shoppable Cart API):**
   * Endpoint: `POST https://api.instacart.com/v2/retailers/{retailer_id}/carts`
   * Famly passes resolved UPCs and quantities.
   * Returns a deep-link URL that opens the user's native Instacart app or browser with every item staged in their basket ready for checkout.
2. **Rewe Lieferservice / Edeka (Germany/EU):**
   * Rewe session cart ingestion (`shop.rewe.de/api/basket`) or Bring! Partner Grocery Gateway.
   * Famly maintains user-preferred brands (e.g. *Rewe Bio Vollmilch 3.8%*), maps them to local store zip codes, and triggers cart staging.
3. **Amazon Fresh / Whole Foods:**
   * Remote Cart Creation Protocol:
     `https://www.amazon.de/gp/aws/cart/add.html?ASIN.1={ASIN}&Quantity.1=1&...`

---

## 2. Invisible Carpooling & Outward Logistics

### Design Rule: No New Tabs or Feature Bloat
Carpooling does not belong in a separate "Carpool Tab." It lives **strictly inside the Calendar Event where the ride conflict or transportation requirement exists**.

### The Flow:
1. **Event Detection:**
   * An event involves a child (`member.isChild === true`) and an off-site location (e.g. *Leo: Fußballtraining, Sportplatz Ost*).
   * A logistics pill is attached to the event: `[ 🚗 Mitfahrgelegenheit: 3 Plätze frei ]`.
2. **1-Tap WhatsApp / SMS Magic Link:**
   * Tapping **"Fahrgemeinschaft teilen"** generates an instant zero-login web link:
     `https://famly.app/c/{carpool_id}`
   * Pre-fills WhatsApp message:
     > *"Hallo! Ich fahre Leo am Dienstag um 17:00 zum Fußball. Ich habe noch 3 Plätze im Auto frei. Tippt hier, wenn euer Kind mitfahren möchte: famly.app/c/x98f2"*
3. **Zero-Login Web Card for Other Parents:**
   * The other parent taps the link on their phone.
   * No app download required; no account creation.
   * Clean single-action page:
     > **Leo's Papa fährt zum Fußball (Dienstag 17:00)**  
     > *Verfügbare Plätze: 3*  
     > **`[ Emma fährt mit Leo mit! ]`**
4. **Instant Household Calendar Sync:**
   * When claimed, your family calendar event updates immediately:
     `Fahrer: Papa (mit Leo, Emma • 2 freie Plätze)`.
   * Pickup address integrates with Apple Maps / Google Maps for Dad's navigation.

---

## 3. The Grandparent Bridge (Living Postcards)

* **Zero Account Barrier for Relatives:**
  * Grandparents receive shared photos or milestone celebrations via a persistent private web frame URL or WhatsApp bot.
* **Audio Voice Notes:**
  * Grandparents tap a large microphone button to leave a 5-second voice greeting.
  * The voice note chimes directly on the Kitchen Station when the child checks off their after-school routine.
