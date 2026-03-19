# KrishiSaarthi Frontend Application

This document outlines the frontend architecture and design system for the KrishiSaarthi platform.

## 🎨 Technology Stack
- **Framework**: React 18+ (Vite)
- **Styling**: Tailwind CSS / Lucide React / Shadcn UI
- **Routing**: `wouter` (Lightweight routing)
- **State Management**: React Context (`AuthContext`, `FieldContext`, `ThemeContext`)
- **API Communication**: `apiFetch` (Custom Fetch wrapper with Token support)
- **Visualization**: Recharts (for Finance and Analytics)

## 📁 Component Organization

### 1. `components/dashboard`
- **Dashboard Overview**: The unified view to manage multiple fields.
- **Charts & Metrics**: Implementation of P&L charts and health score displays.
- **Notifications**: Integrated system for irrigation reminders and pest alerts.

### 2. `components/field`
- **Field Creator**: Multi-step polygon drawing tool (with Leaflet maps).
- **Field Logs**: Integrated calendar and activity management.
- **Analysis Views**: Visualization of satellite data (NDVI/EVI) and AWD reports.

### 3. `components/planning`
- **Rotation Planner**: Interactive AI-suggested crop rotation timeline.
- **Inventory & Labor**: Forms and tables for agricultural logistics.

### 4. `components/layout`
- **Global Navigation**: Responsive sidebar and navigation patterns.
- **Design System**: Reusable UI components from Shadcn UI (buttons, cards, etc.).

## 🔄 Shared State & Persistence
- **`AuthContext`**: Manages user session lifecycle and roles.
- **`FieldContext`**: Tracks the currently selected field across all dashboard tabs.
- **`ThemeContext`**: Handles Dark/Light mode preferences.
- **Session Persistence**: Active dashboard tabs and certain user preferences are persisted in `localStorage`.

## 🛠 Local Development

1. **Install Dependencies**:
   ```bash
   cd frontend/client
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file with:
   - `VITE_API_BASE_URL`: Pointer to the Django backend

3. **Running the Dev Server**:
   ```bash
   npm run dev
   ```

## 📐 Design Principles
- **Aesthetic Excellence**: High contrast, clear labels, and smooth transitions for premium feel.
- **Responsiveness**: Mobile-first design to ensure accessibility for farmers in the field.
- **Feedback Loops**: Real-time loading states and validation for all API interactions.
