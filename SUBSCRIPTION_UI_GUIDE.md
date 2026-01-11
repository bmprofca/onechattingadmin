# Subscription Management UI Guide

## Navigation

### Main Menu
The subscription features are accessible from the main sidebar menu under "Subscriptions" with three submenu items:

```
📊 Dashboard
👥 Users
💼 Projects
📦 Subscriptions ▼
   ├── All Subscriptions
   ├── Subscription Packs
   └── Custom Pricing
```

---

## 1. Subscription Packs Management

**Route:** `/admin/subscription-packs`

### Page Layout

#### Header Section
- **Title:** "Subscription Packs"
- **Subtitle:** "Manage subscription plans and pricing"
- **Action Button:** "Create Pack" (Indigo button with plus icon)

#### Statistics Cards (3 cards in a row)
1. **Total Packs**
   - Icon: Package icon (Indigo)
   - Shows: Total number of packs

2. **Active Packs**
   - Icon: Check circle (Green)
   - Shows: Number of active packs

3. **Platform Packs**
   - Icon: Dollar sign (Purple)
   - Shows: Number of platform-type packs

#### Search Bar
- Search input with magnifying glass icon
- Placeholder: "Search packs by name, ID or type..."
- Refresh button on the right

#### Pack Cards Grid
Each pack is displayed as a card with:

**Card Header:**
- Pack name (large, bold)
- Status badge (Active/Inactive)
- Pack type badge (platform/addon)
- Pack ID (small, monospace)

**Card Body:**
- Price (large, bold, ₹ format)
- Billing cycle (small text below price)
- Description (2 lines max, truncated)
- Features list (up to 3 features shown, with "+X more" indicator)

**Card Footer:**
- Edit button (Indigo)
- Delete button (Red) - Only for non-platform packs

### Create/Edit Pack Modal

**Modal Layout:**
- Title: "Create New Pack" or "Edit Pack"
- Close button (X) in top right

**Form Fields:**
1. **Pack Name** (required)
   - Text input
   - Placeholder: "e.g., Premium Pack"

2. **Pack Type** (required)
   - Dropdown: Add-on / Platform

3. **Amount (₹)** (required)
   - Number input
   - Placeholder: "0.00"

4. **Billing Cycle** (required)
   - Dropdown: Monthly / Yearly / Quarterly

5. **Description**
   - Textarea (3 rows)
   - Placeholder: "Brief description of the pack"

6. **Features**
   - Textarea (3 rows)
   - Placeholder: "Feature 1, Feature 2, Feature 3"
   - Note: Comma-separated values

7. **Status**
   - Two toggle buttons: Active / Inactive
   - Visual highlight for selected option

**Modal Footer:**
- Cancel button (left)
- Save button (right, Indigo with save icon)

---

## 2. Custom Pricing Management

**Route:** `/admin/custom-pricing`

### Page Layout

#### Header Section
- **Title:** "Custom Pricing"
- **Subtitle:** "Manage user-specific pricing across all packs"

#### Statistics Cards (4 cards in a row)
1. **Total Custom Pricing**
   - Icon: Dollar sign (Indigo)
   - Shows: Total custom pricing entries

2. **Active Pricing**
   - Icon: Check circle (Green)
   - Shows: Active custom pricing count

3. **Unique Users**
   - Icon: Users (Purple)
   - Shows: Number of users with custom pricing

4. **Total Discounts**
   - Icon: Package (Orange)
   - Shows: Total discount amount in ₹

#### Search & Filter Bar
- Search input (left side)
  - Placeholder: "Search by username, email, pack name..."
- Filter dropdown (right side)
  - Options: All / Active Only / Inactive Only / Platform Packs / Add-on Packs
- Refresh button

#### Custom Pricing Table

**Table Columns:**
1. **User**
   - User name (bold)
   - Email (small)
   - Username (smaller, monospace)

2. **Pack**
   - Pack name (bold)
   - Pack type badge
   - Pack ID (small, monospace)

3. **Default Price**
   - Strikethrough style
   - ₹ format

4. **Custom Price**
   - Bold, prominent
   - ₹ format

5. **Discount**
   - Discount amount (Green)
   - Percentage (small, gray)

6. **Status**
   - Badge: Active (Green) / Inactive (Gray)

7. **Created**
   - Date (formatted)
   - Created by (small)

8. **Actions**
   - Trash icon button (Red hover)

---

## 3. All Subscriptions View

**Route:** `/admin/subscriptions`

### Page Layout

#### Header Section
- **Title:** "All Subscriptions"
- **Subtitle:** "Monitor and manage all user subscriptions"

#### Statistics Cards (5 cards in a row)
1. **Total**
   - Icon: Package (Indigo)
   - Shows: Total subscriptions

2. **Active**
   - Icon: Check circle (Green)
   - Shows: Active subscriptions

3. **Expired**
   - Icon: X circle (Red)
   - Shows: Expired subscriptions

4. **Auto-Renew**
   - Icon: Refresh (Purple)
   - Shows: Subscriptions with auto-renew enabled

5. **Revenue**
   - Icon: Dollar sign (Orange)
   - Shows: Total revenue in ₹

#### Search & Filter Bar
- Search input (left side)
  - Placeholder: "Search by username, email, pack name, subscription ID..."
- Filters dropdown (right side)
  - **Status Filter:** All Status / Active / Expired / Cancelled
  - **Pack Type Filter:** All Types / Platform / Add-on
- Refresh button

#### Subscriptions Table

**Table Columns:**
1. **User**
   - User name (bold)
   - Email (small)
   - Username (smaller, monospace)

2. **Pack**
   - Pack name (bold)
   - Pack type badge
   - Subscription ID (small, monospace)

3. **Period**
   - Start date (with calendar icon)
   - End date (small, "to" prefix)

4. **Amount**
   - Amount paid (bold)
   - ₹ format

5. **Payment**
   - Wallet amount (if used)
   - Gateway amount (if used)
   - Credit card icon

6. **Status**
   - Badge with icon:
     - Active (Green with check)
     - Expired (Red with X)
     - Other statuses (Gray)

7. **Auto-Renew**
   - Badge: "Yes" with refresh icon (Indigo)
   - Or: "No" (small, gray text)

---

## 4. User Billing Modal (Enhanced)

**Triggered from:** Users page → Credit card icon button

### Modal Layout

#### Header
- Icon: Package icon
- Title: "Subscriptions"
- Subtitle: Username
- Refresh button
- Close button (X)

#### Stats Bar
- Active Subscriptions count (with green dot)
- Total Packs count

#### Pack Cards
Each pack displays:

**View Mode:**
- Pack name (bold) with status badge
- Custom Price badge (if applicable)
- Pack type badge and ID
- Price display:
  - Current price (large, bold)
  - Default price (strikethrough if custom)
- Features list (tags)
- Action buttons:
  - Edit button (pencil icon)
  - Remove Custom Pricing button (trash icon) - Only if custom pricing exists

**Edit Mode:**
- Pack name header
- Cancel link (top right)
- Custom Price input field
  - Number input
  - Shows default price below
- Status toggle (Active/Inactive)
- Save Changes button (full width, Indigo)

**Subscription History** (if exists)
- Shows below pack details
- Title: "History"
- List of subscriptions:
  - Subscription ID (monospace)
  - Date range (start → end)
  - Amount paid
  - Payment method indicator

#### Footer
- Close button

---

## Color Scheme

### Primary Colors
- **Indigo** (#4F46E5): Primary actions, active states
- **Green** (#10B981): Success, active status
- **Red/Rose** (#EF4444): Errors, destructive actions
- **Purple** (#8B5CF6): Platform packs, special features
- **Blue** (#3B82F6): Add-on packs, informational
- **Orange** (#F59E0B): Revenue, warnings

### Status Colors
- **Active:** Green background, darker green text
- **Inactive:** Gray background, darker gray text
- **Expired:** Red background, darker red text
- **Platform:** Purple background, darker purple text
- **Add-on:** Blue background, darker blue text

### Dark Mode
All colors have dark mode variants with adjusted opacity and brightness for optimal contrast.

---

## Icons Used

- **FiPackage:** Subscription packs, packages
- **FiDollarSign:** Pricing, revenue, money
- **FiUsers:** User counts, people
- **FiCheckCircle:** Success, active status
- **FiXCircle:** Errors, expired status
- **FiRefreshCw:** Refresh, auto-renew
- **FiEdit2:** Edit actions
- **FiTrash2:** Delete, remove actions
- **FiSave:** Save actions
- **FiX:** Close, cancel
- **FiSearch:** Search functionality
- **FiFilter:** Filtering options
- **FiCalendar:** Dates, periods
- **FiCreditCard:** Payments, billing
- **FiChevronRight:** Navigation, expansion
- **FiChevronDown:** Dropdowns, expansion
- **FiAlertCircle:** Errors, warnings
- **FiInfo:** Information

---

## Responsive Behavior

### Desktop (≥1024px)
- Full sidebar visible
- Multi-column layouts (3-5 columns for stats)
- Wide tables with all columns
- Side-by-side form layouts

### Tablet (768px - 1023px)
- Collapsible sidebar
- 2-3 column layouts for stats
- Horizontal scroll for tables
- Stacked form layouts

### Mobile (<768px)
- Hidden sidebar (hamburger menu)
- Single column layouts
- Card-based views instead of tables
- Full-width modals
- Stacked form fields

---

## Animations

### Page Transitions
- Fade in on mount
- Smooth opacity transitions

### Modal Animations
- Scale up from 0.95 to 1.0
- Fade in backdrop
- Smooth exit animations

### Hover Effects
- Button color changes
- Background color changes
- Scale transformations (subtle)
- Shadow enhancements

### Loading States
- Spinning refresh icons
- Skeleton loaders for tables
- Spinner for full-page loads

---

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter to submit forms
- Escape to close modals

### Screen Readers
- Semantic HTML elements
- ARIA labels on icons
- Descriptive button text
- Table headers properly marked

### Visual Indicators
- Focus rings on interactive elements
- High contrast mode support
- Color is not the only indicator
- Loading states announced

---

## Error Handling

### Error Display
- Red notification banner at top
- Alert icon
- Clear error message
- Dismissible (X button)
- Auto-dismiss after 5 seconds

### Success Display
- Green notification banner
- Check icon
- Success message
- Auto-dismiss after 3 seconds

### Validation
- Inline validation on form fields
- Required field indicators
- Clear error messages
- Prevention of invalid submissions

---

## Best Practices Implemented

1. **Consistent Design Language**
   - Same spacing, colors, typography throughout
   - Reusable component patterns

2. **Progressive Disclosure**
   - Show essential info first
   - Details available on interaction

3. **Clear Hierarchy**
   - Visual weight indicates importance
   - Logical grouping of related items

4. **Feedback**
   - Loading states for all async operations
   - Success/error notifications
   - Confirmation dialogs for destructive actions

5. **Performance**
   - Optimized re-renders
   - Lazy loading where applicable
   - Efficient data filtering

---

**Last Updated:** January 11, 2026
