# 🌴 **Vibecation**

*A personal travel & itinerary planning web app — built to vibe, plan, and wander.*

---

## 🚀 **Overview**

**Vibecation** is a private travel planning web app designed for personal use — no logins, no accounts, no nonsense. Just clean trip planning, itinerary management, budget tracking and file storage, powered by **Supabase** and a modern frontend.

This project helps you plan trips smoothly while still keeping the fun, spontaneity, and vibes of travel.

---

## ✨ **Features**

✅ **Trip Dashboard**

* Create, view, edit, and delete trips
* Categorized into Upcoming / Past Trips
* Quick access to itineraries, budgets, and notes

✅ **Trip Details Include:**

* Destination, country, dates (auto duration calculation)
* Day-by-day itinerary planner
* Accommodation, transport, and booking info
* Budget + expense tracking (with totals)
* Packing checklist (with templates: Beach / City / Camping)
* Notes & external links (Google Maps, Airbnb, etc.)
* File uploads: tickets, PDFs, images (via Supabase Storage)

✅ **Wishlist / Future Destinations**

* Save dream locations with priority, tags, notes

✅ **Excel/CSV Import (with UK date support)**

* Upload past travel data
* Auto-create trips + itinerary + expenses + packing lists
* Supports multi-sheet Excel files or single-sheet with `section` column
* Detects **UK date format (DD/MM/YYYY)** automatically
* Generates import summary (created / updated / errors)

✅ **Optional Nice-to-Have Features (Supported)**

* Dark mode toggle
* Trip export to PDF / JSON
* Calendar or timeline view
* Drag-and-drop attachment uploads
* Auto-budget remaining calculation

---

## 🗂 **Tech Stack**

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Frontend     | React / Next.js or similar (generated via Lovable) |
| Backend      | Supabase (PostgreSQL + Edge Functions if needed)   |
| Storage      | Supabase Storage (`attachments` bucket)            |
| Excel Import | SheetJS (`xlsx`) + Day.js (UK date parsing)        |
| Styling      | TailwindCSS / modern UI components                 |
| Deployment   | Vercel / Netlify / Private Hosting                 |

---

## 🛢 **Supabase Structure**

**Tables Used:**

```
trips
itinerary_items
accommodations
transports
expenses
packing_items
attachments
wishlist
```

**Storage Bucket:**

```
attachments/
   └── {trip_id}/{file_name}
```

**Row Level Security:**

* Disabled for personal use **OR** permissive policy (`allow all using (true)`)

**Environment Variables (.env):**

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📤 **Excel Import Format**

Supports:

* ✅ Multi-sheet Excel (`trips`, `itinerary_items`, `expenses`, etc.)
* ✅ Single sheet with `section` column
* ✅ Date Format (`DD/MM/YYYY`)

**Required Column for Linking:**
`trip_ref` → used to associate rows with the correct trip.

**Example `trips` sheet:**

| trip_ref | title     | destination | start_date | end_date   | budget | notes     |
| -------- | --------- | ----------- | ---------- | ---------- | ------ | --------- |
| T1       | Bali Vibe | Bali        | 12/06/2025 | 20/06/2025 | 1500   | Surf trip |

---

## 🧠 **Why I Built This**

I wanted a private, aesthetic, and functional place to plan my trips — without using public apps, logins, or chaotic spreadsheets. So I built **Vibecation**:
→ A mix of organization + spontaneity
→ A personal travel HQ with vibes

---

## ✅ **Future Improvements (Ideas)**

* AI itinerary suggestions (based on location + duration)
* Google Maps & calendar integration
* Multi-user sharing (maybe)
* Offline mode using IndexedDB / PWA

---

## 💖 **Credits**

Built with ☕ + ✈️ + good vibes.
Powered by **Supabase**, **React**, and spontaneous delulu energy.

---

## 📜 **License**

Private project (for personal use only).
Feel free to fork and vibe your own way 🌍
