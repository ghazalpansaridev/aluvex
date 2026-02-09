Feature: Sales Person - Navigation and Restrictions
  As a sales person
  I have limited access to the app
  So that I can only perform my designated tasks

  Background:
    Given I am logged in as sales person "sales@mailinator.com"

  # ============================================================
  # CATALOGUE ACCESS
  # ============================================================

  Scenario: Can view catalogue
    When I navigate to "Catalogue"
    Then I should see all items in the catalogue

  Scenario: Can view product details
    When I view product details for any item
    Then I should see full product information

  Scenario: Cannot add items to cart
    When I view product details
    Then "Add to Cart" button should be disabled
    When I tap it
    Then I should see message "Please register as Retailer to Add Items to Cart"

  Scenario: Cannot add to favorites
    When I tap the heart icon on a product
    Then I should see message about retailer registration required

  Scenario: Quantity selector disabled
    When I view product details
    And I tap quantity selector
    Then I should see message "Please register as Retailer to Add Qty"

  # ============================================================
  # RESTRICTED AREAS
  # ============================================================

  Scenario: Cannot access dashboard
    When I try to navigate to dashboard
    Then I should be denied access
    Or dashboard should not be in navigation menu

  Scenario: Cannot access item management
    When I try to navigate to Items management
    Then I should be denied access
    Or Items should not be in navigation menu

  Scenario: Cannot access seller management
    When I try to navigate to Seller Management
    Then I should be denied access
    Or Seller Management should not be in navigation menu

  Scenario: Cannot access user management
    When I try to navigate to User Management
    Then I should be denied access
    Or User Management should not be in navigation menu

  Scenario: Cannot edit credit limits
    Then I should NOT have any option to edit credit limits

  Scenario: Cannot record payments
    Then I should NOT have any option to record payments

  # ============================================================
  # ALLOWED ACCESS
  # ============================================================

  Scenario: Can view all retailers (list view only)
    Given seller list is accessible to sales
    When I try to view retailers
    Then I should see list of all retailers
    But NOT be able to edit them

  Scenario: Can access Contact Us
    When I navigate to "Contact Us"
    Then I should see the contact page
    And I should be able to submit contact form

  Scenario: Can access Settings
    When I navigate to "Settings"
    Then I should see my profile settings
    And I can update my own profile

  Scenario: Can access Notifications
    When I navigate to "Notifications"
    Then I should see my notifications

  # ============================================================
  # NOTIFICATIONS FOR SALES
  # ============================================================

  Scenario: Receive notification on new order
    When a new order is placed
    Then I should receive notification about it

  Scenario: Receive notification on retailer approval
    Given I registered a retailer
    When that retailer is approved
    Then I should receive notification about approval

  Scenario: Receive notification on retailer rejection
    Given I registered a retailer
    When that retailer is rejected
    Then I should receive notification about rejection
