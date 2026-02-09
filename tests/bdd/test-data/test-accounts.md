# Test Data for Fittmart BDD Tests

## Test Accounts

### Admin Account
| Field | Value |
|-------|-------|
| Email | ghazalpansari@gmail.com |
| Password | (use existing password) |
| Name | Ghazal Pansari |
| Phone | 9999999999 |
| Role | admin |
| Status | active |

### Operations Accounts
| Email | Name | Status | Notes |
|-------|------|--------|-------|
| fittmart-ops@mailinator.com | F L | active | Primary ops test account |
| fittmart-ops2@mailinator.com | Jagdish Khaitan | active | Secondary ops account |
| fittmart-ops1@mailinator.com | Operation User | pending_password | For password setup tests |

### Sales Account
| Email | Name | Status |
|-------|------|--------|
| sales@mailinator.com | Abhishek Khaitan | active |

### Retailer Accounts
| Email | Business Name | Status | Pincode | Credit Limit |
|-------|---------------|--------|---------|--------------|
| fittmart-seller-approved4@mailinator.com | ghazal | approved | 560001 | null |
| fittmart-seller-approved@mailinator.com | asdasd | approved | 560001 | null |
| fittmart-seller-approved5@mailinator.com | fittmart-seller-approved5 | pending | 560001 | null |

---

## Test Pincodes

| Pincode | City | State | Items Available |
|---------|------|-------|-----------------|
| 560001 | Bangalore | Karnataka | Yes (primary test pincode) |

---

## Categories & Discounts

| Category | Discount % | Subcategories |
|----------|------------|---------------|
| Bathroom Fittings | 12% | Basin (15%), Glass Window (10%), Tiles (12%), Toilet (10%) |
| Hardware & Tools | 5% | Adhesive (5%), Door Hardware (7%), Fasteners (3%), Hand Tools (5%), Power Tools (5%) |
| Kitchen Fittings | 10% | Cabinet Hardware (8%), Kitchen Faucets (10%), Sinks (10%) |
| Window | 8% | Channel (5%), Glass Window (10%) |
| Window & Glass | 8% | Glass Panels (8%), Sliding Windows (10%), Window Frames (8%) |

---

## Sample Products for Testing

### Tiles (Category: Bathroom Fittings, Discount: 12%)
| SKU | Name | MRP | Final Price | Stock |
|-----|------|-----|-------------|-------|
| TIL-001 | Ceramic Floor Tile 12x12 White | ₹450 | ₹396 | 150 |
| TIL-002 | Ceramic Floor Tile 12x12 Beige | ₹480 | ₹422.40 | 120 |
| TIL-003 | Vitrified Wall Tile 8x12 Cream | ₹380 | ₹334.40 | 200 |
| TIL-004 | Mosaic Tile Sheet 12x12 | ₹850 | ₹748 | 50 |
| TIL-005 | Anti-Skid Floor Tile 12x12 | ₹520 | ₹457.60 | 80 |

### Basins (Category: Bathroom Fittings, Discount: 15%)
| SKU | Name | MRP | Final Price | Stock |
|-----|------|-----|-------------|-------|
| BAS-001 | Round Wash Basin 18" | ₹2,500 | ₹2,125 | 25 |
| BAS-002 | Pedestal Basin Full Set | ₹4,200 | ₹3,570 | 15 |
| BAS-003 | Wall-Hung Basin Rectangle | ₹3,200 | ₹2,720 | 18 |

### Glass Panels (Category: Window & Glass, Discount: 8%)
| SKU | Name | MRP | Final Price | Stock |
|-----|------|-----|-------------|-------|
| GLW-001 | Clear Float Glass 4mm | ₹85 | ₹78.20 | 500 |
| GLW-002 | Clear Float Glass 6mm | ₹120 | ₹110.40 | 400 |

---

## Sample Orders

| Order Number | Status | Subtotal | Freight | Grand Total | Retailer |
|--------------|--------|----------|---------|-------------|----------|
| ORD-20260203-07614 | placed | ₹920 | ₹0 | ₹920 | ghazal |
| ORD-20260203-02155 | cancelled | ₹920 | ₹0 | ₹920 | ghazal |
| ORD-20260202-29737 | processing | ₹920 | ₹12 | ₹932 | ghazal |
| ORD-20260202-21527 | processing | ₹950 | ₹24 | ₹974 | ghazal |

---

## New Registration Test Data

### Valid Registration Data
```
Email: test-retailer-{timestamp}@mailinator.com
Business Name: Test Business {timestamp}
Business Type: Trader
GST Number: 29ABCDE1234F1Z5
PAN Number: ABCDE1234F
Business Address: 123 Test Street, Test Area
Pincode: 560001
City: Bangalore (auto-populated)
State: Karnataka (auto-populated)
Owner Name: Test Owner
Owner DOB: 1990-01-15
Owner Phone: 9876543210
```

### Invalid Data for Validation Tests
| Field | Invalid Value | Expected Error |
|-------|---------------|----------------|
| Email | invalid-email | Invalid email format |
| GST | ABC123 | GST must be 15 characters |
| PAN | 12345 | PAN must be 10 characters (5 letters, 4 numbers, 1 letter) |
| Pincode | 12345 | Pincode must be 6 digits |
| Phone | 12345 | Phone must be 10 digits |

---

## Price Calculation Formula

```
Final Price = MRP - (MRP × Discount%)

Priority: Subcategory Discount > Category Discount

Example:
- Item: Round Wash Basin 18"
- MRP: ₹2,500
- Subcategory (Basin) Discount: 15%
- Final Price: 2500 - (2500 × 0.15) = ₹2,125
```

---

## Order Status Flow

```
Placed → Processing → Partially Shipped → Shipped
              ↓
         Cancelled (with reason)
```

---

## Notification Types

### Retailer Notifications
- Account approved
- Account rejected
- Order placed confirmation
- Order shipped (per shipment)
- Order cancelled
- Payment recorded
- Credit limit updated

### Admin/Operations Notifications
- New order placed
- New retailer application
- Low stock alert

### Sales Notifications
- New order placed
- Retailer application status update

---

## Business Rules Reference

### Credit Limit
- Credit limit is optional
- No credit check at checkout (any retailer can order)
- Outstanding dues = Total debits - Total credits
- Available credit = Credit limit - Outstanding dues

### Inventory
- Items only visible in retailer's registered pincode
- Stock deducted on shipment creation, not order placement

### Approvals
- New retailers default to "pending" status
- Pending retailers can login but have guest-like access
- Rejected retailers cannot login
