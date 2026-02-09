Feature: Retailer Checkout and Order Placement
  As an approved retailer
  I want to place orders for products in my cart
  So that I can receive inventory for my business

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"
    And I have items in my cart

  # ============================================================
  # CHECKOUT SCREEN
  # ============================================================

  Scenario: View checkout screen with order summary
    When I navigate to checkout from cart
    Then I should see the checkout screen
    And I should see order summary section
    And items list should be read-only

  Scenario: Order summary shows correct details
    Given I have the following items in cart:
      | item                           | quantity | unit_price |
      | Ceramic Floor Tile 12x12 White | 5        | ₹396       |
      | Round Wash Basin 18"           | 2        | ₹2,125     |
    When I view the checkout screen
    Then order summary should show:
      | field          | value                                            |
      | Items list     | 2 items with quantities and prices               |
      | Subtotal       | ₹6,230                                           |
      | Freight note   | "Freight charges will be determined..."          |
      | Invoice note   | "Invoice will be generated upon shipment"        |
      | Order total    | ₹6,230                                           |

  # ============================================================
  # DELIVERY ADDRESS
  # ============================================================

  Scenario: Delivery address displays registered business address
    Given my registered business address is "123 Test Street, Bangalore, 560001"
    When I view the checkout screen
    Then delivery address section should show "123 Test Street, Bangalore, 560001"
    And it should be read-only
    And I should see note "To change delivery address, please update in Settings"

  Scenario: Delivery address shows edit link
    When I view the checkout screen
    Then I should see a link/button to update address in Settings

  # ============================================================
  # TERMS AND CONDITIONS
  # ============================================================

  Scenario: Terms and conditions checkbox is required
    When I view the checkout screen
    Then I should see Terms & Conditions checkbox
    And it should be unchecked by default
    And "Place Order" button should be disabled

  Scenario: Place order enabled after accepting terms
    Given I am on checkout screen
    When I check "I agree to the terms and conditions"
    Then "Place Order" button should become enabled

  Scenario: View terms and conditions
    Given I am on checkout screen
    When I tap the "terms and conditions" link
    Then I should see the full terms and conditions content
    And I should be able to close and return to checkout

  # ============================================================
  # PLACE ORDER
  # ============================================================

  Scenario: Successfully place order
    Given I have items in cart
    And I am on checkout screen
    And I have accepted terms and conditions
    When I tap "Place Order"
    Then I should see loading indicator
    And order should be created successfully
    And I should be navigated to order confirmation screen

  Scenario: Order number is generated
    When I successfully place an order
    Then order should have a unique order number
    And format should be like "ORD-YYYYMMDD-XXXXX"

  Scenario: Cart is cleared after successful order
    Given I have items in cart
    When I successfully place an order
    And I navigate to cart
    Then cart should be empty

  Scenario: Cannot place order without accepting terms
    Given I am on checkout screen
    And I have NOT accepted terms and conditions
    Then "Place Order" button should be disabled
    When I tap the disabled button
    Then nothing should happen or I should see a prompt to accept terms

  # ============================================================
  # ORDER CONFIRMATION SCREEN
  # ============================================================

  Scenario: Order confirmation shows success message
    When I successfully place an order
    Then I should see order confirmation screen
    And I should see success icon/animation
    And I should see "Order placed successfully!" message

  Scenario: Order confirmation shows order details
    When I successfully place an order
    Then I should see:
      | field          | displayed |
      | Order number   | yes (large, prominent) |
      | Order date     | yes       |
      | Items list     | yes       |
      | Order total    | yes       |
      | Status         | "Placed"  |

  Scenario: Order confirmation note about processing
    When I successfully place an order
    Then I should see note "Your order is being processed. You will be notified on shipment."

  Scenario: Navigate from confirmation to order details
    Given I am on order confirmation screen
    When I tap "View Order Details"
    Then I should be navigated to order details screen
    And I should see the same order

  Scenario: Navigate from confirmation to catalogue
    Given I am on order confirmation screen
    When I tap "Continue Shopping"
    Then I should be navigated to catalogue screen

  Scenario: Download order summary
    Given I am on order confirmation screen
    When I tap "Download Order Summary"
    Then order summary PDF should be generated
    And download should start or share sheet should appear

  # ============================================================
  # CREDIT LIMIT (OPTIONAL)
  # ============================================================

  Scenario: Credit info shown if credit limit assigned
    Given I have a credit limit of ₹50,000
    And I place an order of ₹6,230
    When I view order confirmation
    Then I should see credit information card:
      | field                  | value   |
      | Available credit before| ₹50,000 |
      | Order amount           | ₹6,230  |
      | Note                   | "Credit limit updated. Balance will be adjusted upon payment." |

  Scenario: No credit info if no credit limit assigned
    Given I have no credit limit assigned
    When I place an order successfully
    Then order confirmation should NOT show credit information section

  # ============================================================
  # NOTIFICATIONS
  # ============================================================

  Scenario: Email notification sent on order placement
    When I successfully place an order
    Then confirmation email should be sent to my registered email
    And email should contain order number and details

  Scenario: Push notification received on order placement
    Given I have push notifications enabled
    When I successfully place an order
    Then I should receive push notification about order placed

  # ============================================================
  # ERROR HANDLING
  # ============================================================

  Scenario: Handle network error during order placement
    Given I am on checkout screen
    And network is unavailable
    When I tap "Place Order"
    Then I should see error message about network
    And I should be able to retry

  Scenario: Handle server error during order placement
    Given server returns an error during order creation
    When I tap "Place Order"
    Then I should see appropriate error message
    And my cart should remain intact
    And I should be able to retry

  # ============================================================
  # BACK NAVIGATION
  # ============================================================

  Scenario: Back to cart from checkout
    Given I am on checkout screen
    When I tap "Back to Cart" or back button
    Then I should return to cart screen
    And cart items should be unchanged
