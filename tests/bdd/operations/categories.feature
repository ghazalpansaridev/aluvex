Feature: Operations - Category and Discount Management
  As an operations team member
  I want to manage categories, subcategories, and discounts
  So that I can organize products and set pricing

  Background:
    Given I am logged in as operations user "fittmart-ops@mailinator.com"

  # ============================================================
  # VIEW CATEGORIES
  # ============================================================

  Scenario: Access category management
    When I navigate to category management
    Then I should see list of all categories

  Scenario: Category list shows information
    When I view category list
    Then each category should show:
      | field            | displayed |
      | Category name    | yes       |
      | Discount percent | yes       |
      | Status           | yes       |
      | Items count      | yes       |

  # ============================================================
  # ADD CATEGORY
  # ============================================================

  Scenario: Add new category
    When I tap "Add Category"
    Then I should see add category form with:
      | field    | required |
      | Name     | yes      |
      | Discount | no       |
      | Status   | yes      |

  Scenario: Create category successfully
    When I fill in:
      | field    | value           |
      | Name     | New Category    |
      | Discount | 10              |
      | Status   | Active          |
    And I tap Save
    Then category should be created
    And I should see success message

  Scenario: Category name must be unique
    Given category "Bathroom Fittings" exists
    When I try to create category with same name
    Then I should see error "Category name already exists"

  # ============================================================
  # EDIT CATEGORY
  # ============================================================

  Scenario: Edit category discount
    Given category "Bathroom Fittings" has discount 12%
    When I edit the category
    And I change discount to 15%
    And I tap Save
    Then discount should be updated to 15%

  Scenario: Discount changes apply immediately
    When I update category discount
    Then all items in that category should reflect new pricing immediately

  Scenario: Deactivate category
    When I change category status to "Inactive"
    And I tap Save
    Then category should be inactive
    And it should not be visible to retailers in filters

  # ============================================================
  # DELETE CATEGORY
  # ============================================================

  Scenario: Cannot delete category with items
    Given category "Bathroom Fittings" has items assigned
    When I try to delete that category
    Then I should see error "Cannot delete category with items"

  Scenario: Delete empty category
    Given category has no items assigned
    When I tap Delete
    Then I should see confirmation dialog
    When I confirm
    Then category should be deleted

  # ============================================================
  # SUBCATEGORIES
  # ============================================================

  Scenario: View subcategories for a category
    When I expand category "Bathroom Fittings"
    Then I should see its subcategories:
      | Basin        |
      | Tiles        |
      | Glass Window |
      | Toilet       |

  Scenario: Add subcategory
    When I tap "Add Subcategory" under "Bathroom Fittings"
    Then I should see form with:
      | field           | required |
      | Name            | yes      |
      | Parent Category | yes (pre-filled) |
      | Discount        | no       |
      | Status          | yes      |

  Scenario: Create subcategory successfully
    When I fill subcategory form:
      | field           | value            |
      | Name            | Shower           |
      | Parent Category | Bathroom Fittings|
      | Discount        | 8                |
      | Status          | Active           |
    And I tap Save
    Then subcategory should be created

  Scenario: Subcategory discount overrides category
    Given category has 12% discount
    And subcategory has 15% discount
    When I view items in that subcategory
    Then 15% discount should apply (not 12%)

  Scenario: Subcategory with no discount uses category discount
    Given category has 12% discount
    And subcategory has no discount set
    When I view items in that subcategory
    Then 12% category discount should apply

  Scenario: Edit subcategory
    When I edit subcategory "Basin"
    And I change discount to 18%
    And I tap Save
    Then discount should be updated
    And all basin items should reflect new pricing

  Scenario: Cannot delete subcategory with items
    Given subcategory "Tiles" has items assigned
    When I try to delete it
    Then I should see error "Cannot delete subcategory with items"

  Scenario: Deactivate subcategory
    When I deactivate a subcategory
    Then it should not be visible in retailer filters
    But items remain associated

  # ============================================================
  # DISCOUNT VALIDATION
  # ============================================================

  Scenario: Discount must be between 0 and 100
    When I try to set discount to 150
    Then I should see validation error
    And discount should be capped at 100

  Scenario: Discount can have decimals
    When I set discount to 12.5
    Then it should be accepted
    And final prices should calculate with 12.5%

  Scenario: Discount 0 means no discount
    When I set discount to 0
    Then final price should equal MRP
