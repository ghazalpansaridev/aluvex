Feature: Retailer Catalogue Experience
  As an approved retailer
  I want to browse the catalogue with discounted prices
  So that I can find and purchase products at wholesale rates

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"
    And my registered pincode is "560001"

  # ============================================================
  # DISCOUNTED PRICING
  # ============================================================

  Scenario: Retailer sees discounted prices on catalogue
    When I navigate to the catalogue screen
    Then I should see product cards with:
      | element              | visible |
      | MRP (strikethrough)  | yes     |
      | Final Price          | yes     |
      | Discount percentage  | optional|

  Scenario: Verify discount calculation for Basin products (15% off)
    Given I am on the catalogue screen
    When I view product "Round Wash Basin 18"" with SKU "BAS-001"
    Then I should see MRP "₹2,500" with strikethrough
    And I should see final price "₹2,125"
    And the discount should be 15%

  Scenario: Verify discount calculation for Tile products (12% off)
    Given I am on the catalogue screen
    When I view product "Ceramic Floor Tile 12x12 White" with SKU "TIL-001"
    Then I should see MRP "₹450" with strikethrough
    And I should see final price "₹396"
    And the discount should be 12%

  Scenario: Subcategory discount overrides category discount
    # Basin subcategory has 15% discount while Bathroom Fittings category has 12%
    Given I am viewing a Basin product
    Then the applied discount should be 15% (subcategory)
    And NOT 12% (category)

  # ============================================================
  # PINCODE-BASED AVAILABILITY
  # ============================================================

  Scenario: Retailer sees only items available in their pincode
    Given I am logged in with pincode "560001"
    When I view the catalogue
    Then I should only see items available in pincode "560001"
    And I should NOT see items restricted to other pincodes

  Scenario: Item unavailable message for wrong pincode
    Given there is an item not available in my pincode
    When I try to view or add that item
    Then I should see message "Item unavailable at your location"

  # ============================================================
  # ADD TO CART
  # ============================================================

  Scenario: Retailer can add item to cart from catalogue
    Given I am on the catalogue screen
    When I tap "Add to Cart" on product "Ceramic Floor Tile 12x12 White"
    Then item should be added to cart
    And I should see success toast/animation
    And cart badge should update

  Scenario: Cart badge shows item count
    Given I have 0 items in cart
    When I add "Ceramic Floor Tile 12x12 White" to cart
    Then cart badge should show "1"
    When I add "Round Wash Basin 18"" to cart
    Then cart badge should show "2"

  # ============================================================
  # FAVORITES
  # ============================================================

  Scenario: Retailer can add item to favorites
    Given I am on the catalogue screen
    When I tap the heart icon on product "Ceramic Floor Tile 12x12 White"
    Then the item should be added to favorites
    And the heart icon should be filled/active

  Scenario: Retailer can remove item from favorites
    Given "Ceramic Floor Tile 12x12 White" is in my favorites
    When I tap the filled heart icon on that product
    Then the item should be removed from favorites
    And the heart icon should be unfilled/inactive

  # ============================================================
  # SEARCH AND FILTER
  # ============================================================

  Scenario: Search products by name
    Given I am on the catalogue screen
    When I tap the search bar
    And I type "Basin"
    Then I should see only products containing "Basin" in name

  Scenario: Search products by SKU
    Given I am on the catalogue screen
    When I search for "BAS-001"
    Then I should see "Round Wash Basin 18""

  Scenario: Filter by single category
    Given I am on the catalogue screen
    When I open filters
    And I select category "Bathroom Fittings"
    And I apply filters
    Then all visible products should be from "Bathroom Fittings"

  Scenario: Filter by multiple categories
    Given I am on the catalogue screen
    When I open filters
    And I select categories "Bathroom Fittings" and "Kitchen Fittings"
    And I apply filters
    Then I should see products from both categories

  Scenario: Filter by subcategory
    Given I am on the catalogue screen
    When I open filters
    And I select category "Bathroom Fittings"
    And I select subcategory "Basin"
    And I apply filters
    Then I should only see basin products

  Scenario: Filter by price range
    Given I am on the catalogue screen
    When I open filters
    And I set price range ₹500 to ₹1000
    And I apply filters
    Then all visible products should have final price between ₹500 and ₹1000

  Scenario: Clear all filters
    Given I have applied multiple filters
    When I tap "Clear All" or reset filters
    Then all filters should be removed
    And I should see the full catalogue

  Scenario: Active filters displayed as chips
    Given I have applied filter for category "Bathroom Fittings"
    Then I should see a filter chip showing "Bathroom Fittings"
    When I tap the X on the chip
    Then that filter should be removed

  # ============================================================
  # SORTING
  # ============================================================

  Scenario: Sort by name A-Z
    Given I am on the catalogue screen
    When I tap sort dropdown
    And I select "Name A-Z"
    Then products should be sorted alphabetically ascending

  Scenario: Sort by name Z-A
    Given I am on the catalogue screen
    When I tap sort dropdown
    And I select "Name Z-A"
    Then products should be sorted alphabetically descending

  Scenario: Sort by price low to high
    Given I am on the catalogue screen
    When I tap sort dropdown
    And I select "Price: Low to High"
    Then products should be sorted by final price ascending

  Scenario: Sort by price high to low
    Given I am on the catalogue screen
    When I tap sort dropdown
    And I select "Price: High to Low"
    Then products should be sorted by final price descending

  Scenario: Sort by newest first
    Given I am on the catalogue screen
    When I tap sort dropdown
    And I select "Newest First"
    Then products should be sorted by creation date descending

  # ============================================================
  # VIEW MODES
  # ============================================================

  Scenario: Toggle to list view
    Given I am on the catalogue screen in grid view
    When I tap the list view toggle
    Then products should be displayed in list format
    And each row should show more details

  Scenario: Toggle to grid view
    Given I am on the catalogue screen in list view
    When I tap the grid view toggle
    Then products should be displayed in grid format
    And each card should be compact

  # ============================================================
  # PAGINATION / INFINITE SCROLL
  # ============================================================

  Scenario: Load more products on scroll
    Given I am on the catalogue screen
    And there are more than 20 products
    When I scroll to the bottom
    Then more products should load
    And I should see loading indicator during fetch

  Scenario: Pagination shows correct count
    Given there are 46 total products
    When I view the catalogue
    Then I should initially see 20 products
    And scrolling should reveal more products

  # ============================================================
  # EMPTY STATES
  # ============================================================

  Scenario: Empty state when no products match search
    Given I am on the catalogue screen
    When I search for "xyznonexistent123"
    Then I should see empty state illustration
    And message "No products found"
    And option to clear search

  Scenario: Empty state when no products match filters
    Given I am on the catalogue screen
    When I apply filters that match no products
    Then I should see empty state
    And option to clear filters
