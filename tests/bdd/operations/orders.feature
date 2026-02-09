Feature: Operations - Order Processing
  As an operations team member
  I want to process orders and create shipments
  So that I can fulfill retailer orders

  Background:
    Given I am logged in as operations user "fittmart-ops@mailinator.com"

  # ============================================================
  # ORDER LIST
  # ============================================================

  Scenario: Access order management
    When I tap "Order Management" in navigation menu
    Then I should see the order list screen
    And I should see all orders across all retailers

  Scenario: Order list shows full information
    When I view order list
    Then each order should show:
      | field          | displayed |
      | Order number   | yes       |
      | Order date     | yes       |
      | Retailer name  | yes       |
      | Retailer pincode| yes      |
      | Total items    | yes       |
      | Order amount   | yes       |
      | Payment status | yes       |
      | Order status   | yes       |
      | Process button | yes       |

  Scenario: Filter orders by date range
    When I set date filter from "2026-01-01" to "2026-01-31"
    Then I should see only orders from that period

  Scenario: Filter orders by retailer
    When I search/filter by retailer "ghazal"
    Then I should see only orders from that retailer

  Scenario: Filter orders by order status
    When I filter by status "Placed"
    Then I should see only placed orders

  Scenario: Filter orders by payment status
    When I filter by payment status "Unpaid"
    Then I should see only unpaid orders

  Scenario: Filter orders by pincode
    When I filter by pincode "560001"
    Then I should see only orders from that pincode

  Scenario: Sort orders by date
    When I sort by "Order date (newest first)"
    Then orders should be sorted by date descending

  Scenario: Sort orders by amount
    When I sort by "Order amount"
    Then orders should be sorted by amount

  # ============================================================
  # ORDER DETAILS / PROCESSING
  # ============================================================

  Scenario: Access order processing screen
    When I tap "Process Order" on order "ORD-20260203-07614"
    Then I should see the order processing screen
    And I should see all order items

  Scenario: Order processing shows item details
    When I view order processing screen
    Then for each item I should see:
      | field             | displayed |
      | Item details      | yes       |
      | Ordered quantity  | yes       |
      | Already shipped   | yes       |
      | Remaining qty     | yes       |
      | Ship now input    | yes       |
      | Include checkbox  | yes       |

  Scenario: Available inventory shown
    When I select items to ship
    Then I should see available inventory for each item

  # ============================================================
  # CREATE SHIPMENT
  # ============================================================

  Scenario: Create shipment form
    When I am on order processing screen
    Then I should see Create Shipment section with:
      | field              | required |
      | Items to ship      | yes      |
      | Quantities         | yes      |
      | Freight charges    | yes      |
      | Shipment notes     | no       |
      | Generate Invoice   | yes (auto-checked) |

  Scenario: Select items to ship
    Given order has 2 items with remaining quantities
    When I check "Include" for both items
    And I enter quantities to ship
    Then those items should be included in shipment

  Scenario: Cannot ship more than remaining
    Given item has remaining quantity of 5
    When I try to enter ship quantity 10
    Then it should be limited to 5
    Or I should see error

  Scenario: Freight charges required
    When I try to create shipment without freight charges
    Then I should see error "Freight charges required"

  Scenario: Successfully create shipment
    Given order "ORD-20260203-07614" has items to ship
    When I select items to ship
    And I enter quantities
    And I enter freight charge ₹50
    And I check "Generate Invoice"
    And I tap "Create Shipment"
    Then shipment should be created
    And invoice should be generated
    And inventory should be deducted
    And order status should update

  Scenario: Shipment triggers notifications
    When I create a shipment
    Then retailer should receive notification
    And retailer should receive email
    And invoice should be available for download

  Scenario: Order status updates to Partially Shipped
    Given order has 5 items
    When I ship only 3 items
    Then order status should change to "Partially Shipped"

  Scenario: Order status updates to Shipped
    Given order has all items shipped
    Then order status should change to "Shipped"

  # ============================================================
  # MULTIPLE SHIPMENTS
  # ============================================================

  Scenario: Create second shipment for remaining items
    Given order is "Partially Shipped"
    When I process the order again
    Then I should see remaining items
    And I can create another shipment

  Scenario: Each shipment has own freight and invoice
    When I create multiple shipments
    Then each should have:
      | own freight charges |
      | own invoice number  |
      | own shipment number |

  Scenario: Shipment history visible
    Given order has previous shipments
    When I view order processing screen
    Then I should see shipment history section
    With details of all previous shipments

  # ============================================================
  # CANCEL ORDER
  # ============================================================

  Scenario: Cancel placed order
    Given order status is "Placed"
    When I tap "Cancel Order"
    Then I should see cancellation dialog
    And reason is required

  Scenario: Cancellation reason required
    When I try to cancel without reason
    Then I should see error "Cancellation reason required"

  Scenario: Successfully cancel order
    When I enter cancellation reason "Out of stock"
    And I confirm cancellation
    Then order status should change to "Cancelled"
    And retailer should receive notification
    And no credit limit impact (order wasn't shipped)

  Scenario: Can cancel partially shipped order
    Given order is "Partially Shipped"
    When I tap "Cancel Order"
    Then I should be able to cancel remaining items
    And shipped items remain shipped

  Scenario: Cannot cancel fully shipped order
    Given order status is "Shipped"
    Then "Cancel Order" button should not be available

  # ============================================================
  # INVENTORY DEDUCTION
  # ============================================================

  Scenario: Inventory deducted on shipment
    Given item has stock 100
    When I ship quantity 5
    Then item stock should become 95

  Scenario: Cannot ship if insufficient stock
    Given item has stock 3
    When I try to ship quantity 5
    Then I should see error "Insufficient stock"

  # ============================================================
  # INVOICE GENERATION
  # ============================================================

  Scenario: Invoice auto-generated on shipment
    When I create shipment with "Generate Invoice" checked
    Then invoice should be automatically generated
    And invoice number should be assigned

  Scenario: Download invoice from shipment
    Given shipment has invoice generated
    When I tap "Download Invoice"
    Then invoice PDF should be downloaded

  Scenario: Invoice shows shipment details
    When I view generated invoice
    Then it should show:
      | Shipment items and quantities |
      | Unit prices |
      | Freight charges |
      | Total amount |
