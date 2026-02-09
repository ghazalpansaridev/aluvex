Feature: Guest User Experience
  As a guest user (not logged in)
  I want to browse the catalogue and view product details
  So that I can explore products before registering

  Background:
    Given the app is launched
    And I am not logged in

  # ============================================================
  # CATALOGUE BROWSING
  # ============================================================

  Scenario: Guest can view catalogue with all active items
    When I navigate to the catalogue screen
    Then I should see the catalogue screen
    And I should see product cards displayed
    And each product card should show:
      | element          | visible |
      | product image    | yes     |
      | product name     | yes     |
      | MRP price        | yes     |
      | discounted price | no      |
      | add to cart      | no      |

  Scenario: Guest sees MRP only without discounts
    Given I am on the catalogue screen
    When I view any product card
    Then I should see the MRP price displayed
    And I should NOT see any discounted price
    And I should NOT see any "Save" amount

  Scenario: Guest can search products by name
    Given I am on the catalogue screen
    When I tap the search bar
    And I enter "Ceramic Tile" in the search input
    Then I should see filtered results containing "Ceramic Tile"

  Scenario: Guest can search products by SKU
    Given I am on the catalogue screen
    When I tap the search bar
    And I enter "TIL-001" in the search input
    Then I should see the product "Ceramic Floor Tile 12x12 White"

  Scenario: Guest can filter by category
    Given I am on the catalogue screen
    When I tap the filter button
    And I select category "Bathroom Fittings"
    And I apply the filters
    Then I should see only products from "Bathroom Fittings" category

  Scenario: Guest can filter by subcategory
    Given I am on the catalogue screen
    When I tap the filter button
    And I select category "Bathroom Fittings"
    And I select subcategory "Tiles"
    And I apply the filters
    Then I should see only tile products

  Scenario: Guest can sort products by price low to high
    Given I am on the catalogue screen
    When I tap the sort dropdown
    And I select "Price: Low to High"
    Then products should be sorted by price ascending

  Scenario: Guest can sort products by price high to low
    Given I am on the catalogue screen
    When I tap the sort dropdown
    And I select "Price: High to Low"
    Then products should be sorted by price descending

  Scenario: Guest can toggle between grid and list view
    Given I am on the catalogue screen
    When I tap the view toggle button
    Then the view should switch between grid and list layout

  # ============================================================
  # PRODUCT DETAILS
  # ============================================================

  Scenario: Guest can view product details
    Given I am on the catalogue screen
    When I tap on the product "Ceramic Floor Tile 12x12 White"
    Then I should see the product details screen
    And I should see the product name "Ceramic Floor Tile 12x12 White"
    And I should see the product SKU "TIL-001"
    And I should see product images

  Scenario: Guest sees only MRP on product details
    Given I am viewing product details for "Round Wash Basin 18"
    Then I should see MRP "₹2,500"
    And I should NOT see discounted price
    And I should NOT see savings amount

  Scenario: Guest can view product image gallery
    Given I am viewing product details for any product with multiple images
    When I swipe on the product image
    Then I should see the next image in the gallery
    And I should see image pagination indicators

  Scenario: Guest can zoom product images
    Given I am viewing product details
    When I tap on the product image
    Then the image should zoom or open in full screen

  Scenario: Guest sees disabled Add to Cart button
    Given I am viewing product details
    Then the "Add to Cart" button should be disabled or show "Login to Purchase"
    When I tap the "Add to Cart" button
    Then I should see a message "Please register as Retailer to Add Items to Cart"

  Scenario: Guest sees disabled quantity selector
    Given I am viewing product details
    Then the quantity selector should be disabled
    When I tap on the quantity selector
    Then I should see a message "Please register as Retailer to Add Qty"

  Scenario: Guest sees disabled favorites button
    Given I am viewing product details
    When I tap the favorites/heart icon
    Then I should see a message "Please register as Retailer to Add Items to Favorite item"

  Scenario: Guest can see related items
    Given I am viewing product details for a tile product
    Then I should see a "Related Items" section
    And related items should be from the same category

  # ============================================================
  # NAVIGATION - RESTRICTED ACCESS
  # ============================================================

  Scenario: Guest navigation menu shows limited options
    Given I am on any screen
    When I open the navigation menu (hamburger icon)
    Then I should see menu options:
      | option            | visible |
      | Catalogue         | yes     |
      | Register New User | yes     |
      | Contact Us        | yes     |
      | Login             | yes     |
      | Orders History    | no      |
      | Cart              | no      |
      | Payments          | no      |
      | Settings          | no      |
      | Dashboard         | no      |

  Scenario: Guest cannot access cart
    Given I am a guest user
    When I try to access the cart screen directly
    Then I should be redirected to login screen
    Or I should see a prompt to login

  Scenario: Guest cannot access orders
    Given I am a guest user
    When I try to access orders history
    Then I should be redirected to login screen

  # ============================================================
  # REGISTRATION INITIATION
  # ============================================================

  Scenario: Guest can initiate registration from catalogue
    Given I am on the catalogue screen
    When I tap "Login to Purchase" or "Register" button
    Then I should see the registration option

  Scenario: Guest can initiate registration from navigation
    Given I am on any screen
    When I open the navigation menu
    And I tap "Register New User"
    Then I should see the registration screen with step 1

  Scenario: Guest can navigate to login from navigation
    Given I am on any screen
    When I open the navigation menu
    And I tap "Login"
    Then I should see the login screen

  # ============================================================
  # CONTACT US
  # ============================================================

  Scenario: Guest can access Contact Us page
    Given I am a guest user
    When I navigate to Contact Us
    Then I should see company contact information
    And I should see support email
    And I should see support phone numbers
    And I should see business hours

  Scenario: Guest can view sales person contacts
    Given I am on the Contact Us page
    Then I should see a list of sales persons
    And each entry should show name, region, phone, and email

  Scenario: Guest can submit contact form
    Given I am on the Contact Us page
    When I fill in the contact form:
      | field   | value               |
      | Name    | Test Guest          |
      | Email   | guest@test.com      |
      | Phone   | 9876543210          |
      | Subject | Product Inquiry     |
      | Message | I need information  |
    And I tap Submit
    Then I should see a confirmation message

  # ============================================================
  # ERROR STATES
  # ============================================================

  Scenario: Guest sees empty state when no products match filter
    Given I am on the catalogue screen
    When I search for "xyznonexistent123"
    Then I should see an empty state message
    And I should see option to clear filters or search

  Scenario: Guest sees loading state while catalogue loads
    Given I navigate to the catalogue screen
    Then I should see loading indicators (skeletons)
    Until products are loaded
