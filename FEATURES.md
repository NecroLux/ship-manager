# USN Ship Manager - Feature Guide

Complete documentation of all features and functionality in Ship Manager.

## 📊 Overview Tab

The Overview tab provides a complete snapshot of your ship's crew status and performance metrics.

### Key Metrics (Top Row)

- **Total Crew**: Total number of sailors in your roster
- **Compliance Rate**: Percentage of actively compliant crew members
- **Actions Required**: Count of crew members requiring attention (blue with checkmark)

### Compliance Status Breakdown

Shows detailed breakdown of crew compliance status:
- **Active / Compliant** (Green bar): Sailors actively participating and compliant
- **Requires Attention (LOA)** (Yellow bar): Sailors on Leave of Absence
- **Requires Action (Flagged)** (Red bar): Sailors with compliance issues

### Squad Distribution

Visual representation of crew distribution across squads:

#### Command Staff
- Displays three command staff members with rank-based color coding:
  - Commanding Officers (Red)
  - Midshipman (Pink)
  - Senior Chiefs (Purple)
  - Petty Officers (Blue)
  - Able Seamen (Green)
- Count shows total command staff

#### Squad Bars (Necro Squad, Shade Squad, etc.)
Each squad shows a full-width stacked bar representing crew status:
- **Green**: Active crew members
- **Yellow**: LOA-1 (Leave of Absence Level 1)
- **Orange**: LOA-2 (Leave of Absence Level 2)
- **Red**: Non-compliant crew members

Hover over sections to see exact counts.

### Top Hosts & Top Voyagers (Side-by-side Tables)

#### Top Hosts 🏠
Shows sailors ranked by number of hosted events:
- Sailor name and rank
- Count of events hosted

#### Top Voyagers ⛵
Shows sailors ranked by number of voyages completed:
- Sailor name and rank
- Count of voyages participated in

Data sourced from the Voyage Awards Google Sheet.

---

## 👥 Sailors Tab (formerly Users)

Complete crew roster with detailed individual sailor information.

### Ship Crew Roster

Displays all sailors with full details:
- **Rank**: Military rank/title
- **Name**: Sailor's full name
- **Discord Nickname**: Unique Discord identifier
- **Squad**: Squad assignment
- **Compliance**: Current compliance status
- **Timezone**: Sailor's timezone
- **Activity**: Chat activity stars (★)

### Features

- **Refresh Button**: Update data from Google Sheets
- **Compliance Stats**: Shows compliant vs. total sailor count
- **Search/Filter**: Find specific sailors
- **Sortable Columns**: Click headers to sort
- **Expandable Rows**: Click to see additional details

---

## 📋 Actions Tab

Leadership tool for managing crew member action items and priorities.

### Tab Organization

Actions are organized by responsibility level:

1. **All Actions** - All pending actions across the crew
2. **CO - Hoit** - Actions requiring Commanding Officer attention
3. **First Officer - LadyHoit** - First Officer action items
4. **Chief of Ship - Spice** - Chief of Ship priorities
5. **Squad Leader 1 - Necro** - Squad 1 leader tasks
6. **Squad Leader 2 - Shade** - Squad 2 leader tasks

### Priority Levels

Actions are color-coded by priority:

- **High (Red #dc2626)**: Requires immediate action - compliance issues, sailing/hosting critical needs
- **Medium (Yellow #eab308)**: Requires attention - inactive crew, minor compliance issues
- **Low (Blue #3b82f6)**: Chat activity - crew with no recent chat participation
- **Recurring (Blue #3b82f6)**: Daily/weekly recurring tasks

### Action Detection

The system automatically detects:

- **No Chat Activity**: Crew members with zero stars/activity level (Low priority)
- **Compliance Issues**: 
  - Flagged/Non-Compliant status → High priority
  - Inactive status → Medium priority
- **Sailing/Hosting Issues**: Crew requiring sailing or hosting attention (varies by severity)
- **Responsible Party**: Actions automatically assigned to appropriate leader

### Summary Stats

Shows count of actions for each leader:
- CO (Red)
- First Officer (Orange)
- Chief of Ship (Blue)
- Squad Leaders (Purple)

---

## 📍 Linked Sheets Tab

Manage connections to Google Sheets data sources.

### Features

- **Connection Status**: Shows if backend is connected and responding
- **Data Sources**: Lists all configured Google Sheets
- **Record Counts**: How many records in each sheet
- **Last Updated**: Timestamp of last data refresh
- **Refresh Button**: Manually trigger data refresh
- **Sheet Links**: Direct links to open sheets in Google Drive

### Configured Sheets

1. **Gullinbursti** - Main crew roster
   - 64 member records
   - All crew information

2. **Voyage Awards** - Activity tracking
   - Host event counts
   - Voyage participation counts
   - Member achievement records

---

## 📤 Reports Tab

Export crew data and reports in multiple formats.

### Features (In Development)

- **Ship Report**: Comprehensive crew report
  - Export as Word document
  - Export as PDF
  - Includes all crew statistics and compliance data

- **Squad Report**: Squad-specific reporting
  - Export as Word document
  - Export as PDF
  - Contains squad-level breakdown and analysis

### Export Formats

- **Word (.docx)**: Professional formatted document
- **PDF (.pdf)**: Print-ready format
- **Excel (.xlsx)**: Spreadsheet format (future)

---

## 🎨 Theme Features

- **Dark/Light Mode**: Toggle via AppBar menu
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Material-UI Components**: Professional, accessible interface
- **Accessibility**: Keyboard navigation and screen reader support

---

## ⚙️ Settings & Configuration

### Data Sources

The application connects to two Google Sheets:

1. **Gullinbursti Sheet** (`1EiLym2gcxcxmwoTHkHD9m9MisRqC3lmjJbBUBzqlZI0`)
   - Range: `Gullinbursti!A1:W64`
   - Crew roster with compliance data

2. **Voyage Awards Sheet** (`1AK81fcdI9UTY4Nlp5ijwtPqyILE-e4DnRK3-IAgEIHI`)
   - Range: `Time/Voyage Awards!A1:O900`
   - Activity and achievement data

### Environment Variables

- `VITE_BACKEND_URL`: Backend API server URL (default: https://ship-manager.onrender.com)
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH`: Path to credentials.json

---

## 🔄 Data Refresh

- **Automatic**: Backend refreshes every 5 minutes
- **Manual**: Click Refresh button in any tab to force update
- **Real-time**: Changes made in Google Sheets appear within 5 minutes

---

## 📱 Keyboard Shortcuts

- **Tab**: Navigate between fields
- **Enter**: Activate buttons
- **Space**: Toggle checkboxes and menus
- **Escape**: Close dialogs

---

## 🔐 Permissions & Access

- **Read-only Google Sheets**: Dashboard reads crew data
- **No Write Access**: Data can only be modified in Google Sheets
- **Service Account**: Authenticated access to Google API
- **Secure**: Credentials never exposed to frontend

---

## 🚀 Deployment

The application is deployed on:
- **Frontend**: GitHub Pages (https://NecroLux.github.io/ship-manager/)
- **Backend**: Render (https://ship-manager.onrender.com)
- **Cost**: Free tier deployment

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run dev:all` - Run frontend and backend together
- `npm run deploy` - Deploy to GitHub (commits and pushes)

---

## 📞 Support

For issues or feature requests, please refer to:
- GitHub Issues: https://github.com/NecroLux/ship-manager/issues
- Documentation: See other .md files in project root
- Deployment Status: Check DEPLOYMENT_COMPLETE.md
