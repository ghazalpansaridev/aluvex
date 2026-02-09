Feature: Sales Person - Catalogue View
  As a sales person
  I want to view the catalogue
  So that I can demonstrate products to potential retailers

  Background:
    Given I am logged in as sales person "sales@mailinator.com"

  # ============================================================
  # CATALOGUE ACCESS
  # ============================================================

  Scenario: Access catalogue
    When I tap "Catalogue" in navigation menu
    Then I should see the catalogue screen
    And I should see all active items (not filtered by pincode)

  Scenario: View all items regardless of pincode
    When I view the catalogue
    Then I should see items from all pincodes
    Note: Unlike retailers who see only their pincode items

  Scenario: Catalogue shows MRP
    When I view product listings
    Then I should see MRP pricing
    Note: Sales person sees MRP, not discounted prices

  # ============================================================
  # SEARCH AND FILTER
  # ============================================================

  Scenario: Search products
    When I search for "Ceramic"
    Then I should see matching products

  Scenario: Filter by category
    When I filter by category "Bathroom Fittings"
    Then I should see filtered results

  Scenario: Sort products
    When I sort by price
    Then products should be sorted accordingly

  # ============================================================
  # PRODUCT DETAILS
  # ============================================================

  Scenario: View product details
    When I tap on a product
    Then I should see product details screen
    And I should see full product information

  Scenario: Cannot add to cart
    When I view product details
    Then "Add to Cart" should be disabled
    When I tap it
    Then I should see message "Please register as Retailer to Add Items to Cart"

  Scenario: Cannot add to favorites
    When I tap the heart icon
    Then I should see message about retailer registration required

  Scenario: Quantity selector disabled
    When I tap quantity selector
    Then I should see message "Please register as Retailer to Add Qty"

  # ============================================================
  # DEMONSTRATE TO CUSTOMERS
  # ============================================================

  Scenario: View product images
    When I view product details
    Then I should be able to:
      | Swipe through images |
      | Zoom on images       |
      | View full gallery    |

  Scenario: View product description
    When I view product details
    Then I should see:
      | Product name        |
      | SKU                 |
      | Description         |
      | Category info       |
      | MRP pricing         |
