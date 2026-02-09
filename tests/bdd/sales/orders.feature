Feature: Sales Person - Order Viewing (Read-Only)
  As a sales person
  I want to view all orders
  So that I can monitor business activity and support retailers

  Background:
    Given I am logged in as sales person "sales@mailinator.com"

  # ============================================================
  # VIEW ORDER LIST
  # ============================================================

  Scenario: Access order management
    When I tap "Order Management" in navigation menu
    Then I should see the order list screen
    And I should see all orders (not filtered by salesperson)

  Scenario: Order list shows same info as admin view
    When I view order list
    Then I should see for each order:
      | field          | displayed |
      | Order number   | yes       |
      | Order date     | yes       |
      | Retailer name  | yes       |
      | Pincode        | yes       |
      | Total items    | yes       |
      | Order amount   | yes       |
      | Payment status | yes       |
      | Order status   | yes       |

  Scenario: Can filter orders by date range
    When I apply date filter
    Then I should see filtered orders

  Scenario: Can filter orders by status
    When I filter by status "Placed"
    Then I should see only placed orders

  Scenario: Can filter orders by retailer
    When I search for retailer "ghazal"
    Then I should see orders from that retailer

  Scenario: Can filter orders by pincode
    When I filter by pincode "560001"
    Then I should see orders from that pincode

  # ============================================================
  # VIEW ORDER DETAILS
  # ============================================================

  Scenario: View order details
    Given there is an order "ORD-20260203-07614"
    When I tap to view that order
    Then I should see full order details

  Scenario: Order details show all information
    When I view order details
    Then I should see:
      | section        | visible |
      | Order header   | yes     |
      | Items list     | yes     |
      | Shipment info  | yes (if shipped) |
      | Order summary  | yes     |

  # ============================================================
  # READ-ONLY RESTRICTIONS
  # ============================================================

  Scenario: Cannot process orders
    When I view order details
    Then I should NOT see "Process Order" button
    And I should NOT see shipment creation form

  Scenario: Cannot add freight charges
    When I view an order
    Then I should NOT have option to add freight charges

  Scenario: Cannot generate invoices
    When I view order details
    Then I should NOT have option to generate invoice

  Scenario: Cannot cancel orders
    When I view a placed order
    Then I should NOT see "Cancel Order" button

  Scenario: Can only view, not edit
    When I view any order
    Then all fields should be read-only
    And no edit actions should be available
