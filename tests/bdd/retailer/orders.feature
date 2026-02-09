Feature: Retailer Order History and Tracking
  As a retailer
  I want to view my order history and track order status
  So that I can monitor my purchases and shipments

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # ORDER HISTORY LIST
  # ============================================================

  Scenario: View order history
    When I navigate to "Orders History" from navigation menu
    Then I should see the order history screen
    And I should see list of my orders

  Scenario: Order list displays correct information
    Given I have placed orders
    When I view order history
    Then each order card should show:
      | field        | displayed |
      | Order number | yes       |
      | Order date   | yes       |
      | Items count  | yes       |
      | Order amount | yes       |
      | Status badge | yes       |
      | View Details | yes       |

  Scenario: Orders sorted by date newest first
    Given I have multiple orders
    When I view order history
    Then orders should be sorted by date descending
    And most recent order should appear first

  Scenario: Empty state when no orders
    Given I have not placed any orders
    When I view order history
    Then I should see empty state
    And message "You haven't placed any orders yet"
    And option to browse catalogue

  # ============================================================
  # ORDER STATUS BADGES
  # ============================================================

  Scenario: Placed order shows "Placed" badge
    Given I have an order with status "placed"
    When I view order history
    Then that order should show "Placed" status badge

  Scenario: Partially shipped order shows correct badge
    Given I have an order with status "partially_shipped"
    When I view order history
    Then that order should show "Partially Shipped" status badge

  Scenario: Shipped order shows "Shipped" badge
    Given I have an order with status "shipped"
    When I view order history
    Then that order should show "Shipped" status badge

  Scenario: Cancelled order shows "Cancelled" badge
    Given I have an order with status "cancelled"
    When I view order history
    Then that order should show "Cancelled" status badge

  # ============================================================
  # FILTERS
  # ============================================================

  Scenario: Filter orders by date range
    Given I have orders from different dates
    When I tap the date range filter
    And I select start date "2026-01-01"
    And I select end date "2026-01-31"
    And I apply filter
    Then I should only see orders from January 2026

  Scenario: Filter orders by status
    Given I have orders with different statuses
    When I tap the status filter
    And I select "Placed"
    Then I should only see orders with status "Placed"

  Scenario: Filter by multiple statuses
    Given I have orders with different statuses
    When I select statuses "Placed" and "Shipped"
    Then I should see orders matching either status

  Scenario: Clear filters
    Given I have filters applied
    When I tap "Clear" or reset filters
    Then all filters should be removed
    And all orders should be visible

  # ============================================================
  # ORDER DETAILS
  # ============================================================

  Scenario: View order details
    Given I have an order "ORD-20260203-07614"
    When I tap "View Details" on that order
    Then I should see the order details screen
    And I should see full order information

  Scenario: Order details header shows correct info
    Given I am viewing order "ORD-20260203-07614"
    Then I should see:
      | field        | value              |
      | Order number | ORD-20260203-07614 |
      | Order date   | displayed          |
      | Status badge | Placed             |

  Scenario: Order details shows items with quantities
    Given I am viewing order details
    Then I should see all ordered items
    And each item should show:
      | field          | displayed |
      | Item image     | yes       |
      | Item name      | yes       |
      | Ordered qty    | yes       |
      | Price per unit | yes       |
      | Line total     | yes       |

  # ============================================================
  # SHIPMENT TRACKING
  # ============================================================

  Scenario: View shipment details for shipped items
    Given I have an order with shipments
    When I view order details
    Then I should see shipment information
    And each shipment should show:
      | field           | displayed |
      | Shipment number | yes       |
      | Shipment date   | yes       |
      | Shipped qty     | yes       |
      | Freight charges | yes       |
      | Invoice number  | yes       |

  Scenario: Multiple shipments displayed separately
    Given I have an order shipped in 2 shipments
    When I view order details
    Then I should see both shipments listed
    And each with its own details

  Scenario: Pending items shown for partial shipment
    Given I have a partially shipped order
    When I view order details
    Then I should see items grouped by status
    And I should see "Pending" items with remaining quantity

  # ============================================================
  # ORDER SUMMARY
  # ============================================================

  Scenario: Order summary shows all totals
    Given I am viewing order details
    Then order summary should show:
      | field                | displayed |
      | Total items ordered  | yes       |
      | Total items shipped  | yes       |
      | Total items pending  | yes       |
      | Subtotal             | yes       |
      | Total freight        | yes       |
      | Grand total          | yes       |

  Scenario: Grand total includes freight charges
    Given order has subtotal ₹920 and freight ₹12
    When I view order details
    Then grand total should be ₹932

  # ============================================================
  # INVOICES
  # ============================================================

  Scenario: Download invoice for shipped items
    Given I have an order with a shipment
    And invoice is generated for that shipment
    When I view order details
    Then I should see "Download Invoice" button for that shipment
    When I tap "Download Invoice"
    Then invoice PDF should be downloaded or opened

  Scenario: Invoice not available for placed orders
    Given I have an order with status "placed"
    When I view order details
    Then "Download Invoice" should not be available
    And I should see note about invoice generation on shipment

  Scenario: Multiple invoices for multiple shipments
    Given I have an order shipped in multiple shipments
    When I view order details
    Then each shipment should have its own invoice
    And I should be able to download each separately

  # ============================================================
  # STATUS MESSAGES
  # ============================================================

  Scenario: Placed order shows processing message
    Given order status is "placed"
    When I view order details
    Then I should see message "Your order is being processed"

  Scenario: Partially shipped order shows appropriate message
    Given order status is "partially_shipped"
    When I view order details
    Then I should see message "Your order has been partially shipped. Invoice(s) available for download."

  Scenario: Shipped order shows completion message
    Given order status is "shipped"
    When I view order details
    Then I should see message "Your order has been fully shipped. Invoice(s) available for download."

  Scenario: Cancelled order shows reason
    Given order is cancelled with reason "Out of stock"
    When I view order details
    Then I should see message "This order has been cancelled"
    And I should see cancellation reason "Out of stock"

  # ============================================================
  # PAGINATION
  # ============================================================

  Scenario: Pagination on order history
    Given I have more than 10 orders
    When I view order history
    Then I should see first 10 orders
    When I scroll down or tap "Load More"
    Then more orders should load

  # ============================================================
  # CONTACT SUPPORT
  # ============================================================

  Scenario: Contact support from order details
    Given I am viewing order details
    When I tap "Contact Support"
    Then I should be navigated to Contact Us screen
    Or support dialog should open
