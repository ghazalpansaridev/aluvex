Feature: Retailer Favorites Management
  As a retailer
  I want to save my favorite products
  So that I can quickly find and reorder them

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # ADD TO FAVORITES
  # ============================================================

  Scenario: Add item to favorites from catalogue
    Given I am on the catalogue screen
    When I tap the heart icon on product "Ceramic Floor Tile 12x12 White"
    Then the item should be added to my favorites
    And the heart icon should become filled/active
    And I should see success feedback

  Scenario: Add item to favorites from product details
    Given I am viewing product details for "Round Wash Basin 18""
    When I tap the favorites/heart button
    Then the item should be added to my favorites
    And the heart icon should become filled

  Scenario: Heart icon state reflects favorite status
    Given "Ceramic Floor Tile 12x12 White" is in my favorites
    When I view the catalogue
    Then the heart icon for that product should be filled/active
    And other products should have unfilled heart icons

  # ============================================================
  # REMOVE FROM FAVORITES
  # ============================================================

  Scenario: Remove item from favorites via heart icon
    Given "Ceramic Floor Tile 12x12 White" is in my favorites
    When I tap the filled heart icon on that product
    Then the item should be removed from my favorites
    And the heart icon should become unfilled

  Scenario: Remove item from favorites screen
    Given I am on the favorites screen
    And I have "Ceramic Floor Tile 12x12 White" in favorites
    When I tap the remove button or heart icon on that item
    Then it should be removed from favorites list

  # ============================================================
  # VIEW FAVORITES
  # ============================================================

  Scenario: Navigate to favorites screen
    When I tap "Favorites" in the navigation menu
    Then I should see the favorites screen
    And I should see my favorited items

  Scenario: Favorites list shows product information
    Given I have items in favorites
    When I view the favorites screen
    Then each item should show:
      | field          | displayed |
      | Product image  | yes       |
      | Product name   | yes       |
      | Price          | yes (discounted) |
      | Add to Cart    | yes       |

  Scenario: Empty favorites state
    Given I have no items in favorites
    When I view the favorites screen
    Then I should see empty state illustration
    And message "No favorites yet"
    And option to browse catalogue

  # ============================================================
  # ACTIONS FROM FAVORITES
  # ============================================================

  Scenario: Add favorite item to cart
    Given I am on the favorites screen
    And I have "Ceramic Floor Tile 12x12 White" in favorites
    When I tap "Add to Cart" on that item
    Then the item should be added to my cart
    And I should see success feedback

  Scenario: View product details from favorites
    Given I am on the favorites screen
    When I tap on a favorite item card
    Then I should be navigated to product details for that item

  # ============================================================
  # FAVORITES PERSISTENCE
  # ============================================================

  Scenario: Favorites persist across sessions
    Given I have added items to favorites
    When I logout
    And I login again
    Then my favorites should still contain the same items

  Scenario: Favorites sync across devices
    Given I have favorites on device A
    When I login on device B
    Then I should see the same favorites

  # ============================================================
  # FAVORITES AND AVAILABILITY
  # ============================================================

  Scenario: Favorite item becomes unavailable
    Given I have a favorite item
    When that item becomes unavailable in my pincode
    Then the item should still appear in favorites
    But "Add to Cart" should be disabled
    And I should see availability message

  Scenario: Favorite item goes out of stock
    Given I have a favorite item
    When that item goes out of stock
    Then the item should still appear in favorites
    But with stock status indicator
