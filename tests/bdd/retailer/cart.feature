Feature: Retailer Cart Management
  As an approved retailer
  I want to manage my shopping cart
  So that I can prepare orders before checkout

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # ADD TO CART
  # ============================================================

  Scenario: Add single item to cart from catalogue
    Given I am on the catalogue screen
    And my cart is empty
    When I tap "Add to Cart" on "Ceramic Floor Tile 12x12 White"
    Then item should be added with quantity 1
    And cart badge should show "1"
    And I should see success feedback

  Scenario: Add item to cart from product details
    Given I am viewing product details for "Round Wash Basin 18""
    When I set quantity to 2
    And I tap "Add to Cart"
    Then item should be added with quantity 2
    And I should see success toast

  Scenario: Add same item increases quantity
    Given I have "Ceramic Floor Tile 12x12 White" in cart with quantity 1
    When I add the same item again from catalogue
    Then cart quantity for that item should increase to 2

  # ============================================================
  # VIEW CART
  # ============================================================

  Scenario: View cart with items
    Given I have items in my cart
    When I navigate to the cart screen
    Then I should see the cart screen
    And I should see list of cart items

  Scenario: Cart item displays correct information
    Given I have "Ceramic Floor Tile 12x12 White" in cart with quantity 5
    When I view my cart
    Then I should see:
      | field           | value                              |
      | Item image      | thumbnail visible                  |
      | Item name       | Ceramic Floor Tile 12x12 White     |
      | Price per unit  | ₹396 (discounted)                  |
      | Quantity        | 5                                  |
      | Line total      | ₹1,980                             |

  Scenario: Cart shows empty state when no items
    Given my cart is empty
    When I navigate to the cart screen
    Then I should see empty cart illustration
    And I should see message "Your cart is empty"
    And I should see "Continue Shopping" button

  # ============================================================
  # QUANTITY MANAGEMENT
  # ============================================================

  Scenario: Increase item quantity using plus button
    Given I have "Ceramic Floor Tile 12x12 White" in cart with quantity 1
    When I tap the "+" button for that item
    Then quantity should increase to 2
    And line total should update accordingly

  Scenario: Decrease item quantity using minus button
    Given I have "Ceramic Floor Tile 12x12 White" in cart with quantity 3
    When I tap the "-" button for that item
    Then quantity should decrease to 2
    And line total should update accordingly

  Scenario: Cannot decrease quantity below 1
    Given I have an item in cart with quantity 1
    When I tap the "-" button
    Then quantity should remain 1
    Or I should be prompted to remove the item

  Scenario: Update quantity via direct input
    Given I have "Ceramic Floor Tile 12x12 White" in cart
    When I tap the quantity input field
    And I enter "10"
    Then quantity should update to 10
    And line total should recalculate

  Scenario: Maximum quantity is limited by stock
    Given "Ceramic Floor Tile 12x12 White" has stock of 150
    When I try to set quantity to 200
    Then quantity should be capped at 150
    Or I should see an error "Maximum available: 150"

  # ============================================================
  # REMOVE ITEMS
  # ============================================================

  Scenario: Remove item from cart
    Given I have "Ceramic Floor Tile 12x12 White" in cart
    When I tap the remove/delete icon for that item
    Then I should see a confirmation dialog
    When I confirm removal
    Then item should be removed from cart
    And cart totals should update

  Scenario: Cancel item removal
    Given I have an item in cart
    When I tap the remove icon
    And confirmation dialog appears
    When I tap "Cancel"
    Then item should remain in cart

  # ============================================================
  # CART SUMMARY
  # ============================================================

  Scenario: Cart summary shows correct totals
    Given I have the following items in cart:
      | item                           | quantity | unit_price | line_total |
      | Ceramic Floor Tile 12x12 White | 5        | ₹396       | ₹1,980     |
      | Round Wash Basin 18"           | 2        | ₹2,125     | ₹4,250     |
    When I view the cart summary
    Then I should see:
      | field         | value                                    |
      | Items count   | 2 items                                  |
      | Subtotal      | ₹6,230                                   |
      | Freight note  | "Freight charges will be added..."       |
      | Total         | ₹6,230                                   |

  Scenario: Cart total updates in real-time
    Given I have items totaling ₹1,000 in cart
    When I increase quantity of an item
    Then total should update immediately without page refresh

  # ============================================================
  # CLEAR CART
  # ============================================================

  Scenario: Clear entire cart
    Given I have multiple items in cart
    When I tap "Clear Cart" button
    Then I should see confirmation dialog "Are you sure you want to clear your cart?"
    When I confirm
    Then cart should be empty
    And I should see empty cart state

  Scenario: Cancel clear cart
    Given I have items in cart
    When I tap "Clear Cart"
    And confirmation dialog appears
    When I tap "Cancel"
    Then cart should still contain all items

  # ============================================================
  # NAVIGATION FROM CART
  # ============================================================

  Scenario: Continue shopping button returns to catalogue
    Given I am on the cart screen
    When I tap "Continue Shopping"
    Then I should be navigated to the catalogue screen

  Scenario: Proceed to checkout with items
    Given I have items in cart
    When I tap "Proceed to Checkout"
    Then I should be navigated to the checkout screen

  Scenario: Cannot checkout with empty cart
    Given my cart is empty
    Then "Proceed to Checkout" button should be disabled

  # ============================================================
  # CART PERSISTENCE
  # ============================================================

  Scenario: Cart persists across sessions
    Given I have items in cart
    When I logout
    And I login again as the same retailer
    Then my cart should still contain the same items

  Scenario: Cart syncs across devices
    Given I have items in cart on device A
    When I login on device B
    Then I should see the same cart items

  # ============================================================
  # EDGE CASES
  # ============================================================

  Scenario: Handle item no longer available in pincode
    Given I have an item in cart
    When that item becomes unavailable in my pincode
    And I view my cart
    Then I should see a warning for that item
    And I should be prompted to remove it

  Scenario: Price changes reflected in cart
    Given I have items in cart
    When the price of an item changes
    And I view my cart
    Then I should see the updated price
    And totals should recalculate
