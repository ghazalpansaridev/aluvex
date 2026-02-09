Feature: Operations - Item Management
  As an operations team member
  I want to manage products/items
  So that I can maintain the catalogue inventory

  Background:
    Given I am logged in as operations user "fittmart-ops@mailinator.com"

  # ============================================================
  # ITEM LIST VIEW
  # ============================================================

  Scenario: Access item management
    When I tap "Items" in navigation menu
    Then I should see the item management screen
    And I should see list of all items

  Scenario: Item list shows correct information
    When I view item list
    Then each item should show:
      | field           | displayed |
      | Item image      | yes       |
      | Item name       | yes       |
      | SKU/Code        | yes       |
      | Category        | yes       |
      | Subcategory     | yes       |
      | MRP             | yes       |
      | Final price     | yes       |
      | Current stock   | yes       |
      | Status          | yes       |

  Scenario: Filter items by category
    When I select filter for category "Bathroom Fittings"
    Then I should see only items from that category

  Scenario: Filter items by subcategory
    When I filter by subcategory "Tiles"
    Then I should see only tile products

  Scenario: Filter items by availability
    When I filter by "In Stock"
    Then I should see only items with stock > 0

  Scenario: Filter items by pincode
    When I filter by pincode "560001"
    Then I should see only items available in that pincode

  Scenario: Search items by name
    When I search for "Ceramic"
    Then I should see items containing "Ceramic" in name

  Scenario: Search items by SKU
    When I search for "TIL-001"
    Then I should see item with SKU "TIL-001"

  Scenario: Out of stock items show badge
    Given an item has current_stock = 0
    When I view item list
    Then that item should show "Out of Stock" badge

  Scenario: Inactive items marked in list
    Given an item has status "inactive"
    When I view item list
    Then that item should be visually marked as inactive

  # ============================================================
  # ADD NEW ITEM
  # ============================================================

  Scenario: Access add item form
    When I tap "Add Item" button
    Then I should see the add item form

  Scenario: Add item form has required fields
    When I view add item form
    Then I should see fields:
      | field              | required |
      | Item Name          | yes      |
      | Item Code/SKU      | yes      |
      | Description        | no       |
      | MRP                | yes      |
      | Unit               | yes      |
      | Category           | yes      |
      | Subcategory        | yes      |
      | Opening Stock      | yes      |
      | Min Stock Level    | no       |
      | Available Pincodes | yes      |
      | Images             | yes (min 1) |
      | Status             | yes      |

  Scenario: Unit dropdown options
    When I tap Unit dropdown
    Then I should see options:
      | Piece  |
      | Kg     |
      | Liter  |
      | Box    |
      | Packet |
      | Dozen  |

  Scenario: Category dropdown loads dynamically
    When I tap Category dropdown
    Then I should see all active categories

  Scenario: Subcategory filters by selected category
    When I select category "Bathroom Fittings"
    And I tap Subcategory dropdown
    Then I should see only subcategories of "Bathroom Fittings"

  Scenario: Pincode multi-select
    When I tap Available Pincodes field
    Then I should see multi-select for pincodes
    And I can select multiple pincodes

  Scenario: At least one pincode required
    When I try to save without selecting any pincode
    Then I should see error "At least one pincode required"

  Scenario: Upload item images
    When I tap image upload
    Then I should be able to select images
    And I can upload up to 5 images
    And each image must be max 5MB
    And formats allowed are JPG, PNG

  Scenario: At least one image required
    When I try to save without uploading any image
    Then I should see error "At least one image required"

  Scenario: SKU must be unique
    Given item with SKU "TIL-001" exists
    When I try to create item with same SKU
    Then I should see error "Item code already exists"

  Scenario: Successfully add new item
    When I fill all required fields with valid data
    And I upload at least one image
    And I tap Save
    Then item should be created
    And I should see success message
    And item should appear in list

  # ============================================================
  # EDIT ITEM
  # ============================================================

  Scenario: Access edit item form
    When I tap on an item to edit
    Then I should see edit form with pre-populated data

  Scenario: Edit item details
    Given I am editing item "TIL-001"
    When I change the name to "Updated Tile Name"
    And I tap Save
    Then name should be updated
    And I should see success message

  Scenario: Cannot change SKU after creation
    Given I am editing an existing item
    Then SKU field should be disabled/read-only

  Scenario: Inventory adjustment
    Given I am editing an item with stock 100
    When I add inventory adjustment of +50
    And I select reason "New Stock"
    And I tap Save
    Then current stock should become 150
    And adjustment should be logged

  Scenario: Inventory adjustment reasons
    When I make inventory adjustment
    Then I should select reason from:
      | New Stock |
      | Sold      |
      | Damaged   |
      | Returned  |
      | Other     |

  Scenario: Update images
    Given I am editing an item
    When I delete an existing image
    And I add a new image
    And I tap Save
    Then images should be updated

  Scenario: Change primary image
    Given item has multiple images
    When I select a different image as primary
    And I tap Save
    Then that image should become the primary display image

  Scenario: View update log
    Given I am editing an item
    Then I should see update log showing:
      | What changed |
      | Who changed  |
      | When changed |

  # ============================================================
  # BULK ITEM UPLOAD
  # ============================================================

  Scenario: Download Excel template
    When I tap "Bulk Upload" button
    And I tap "Download Template"
    Then Excel template should be downloaded
    And it should have columns for all item fields

  Scenario: Upload Excel file
    When I tap "Bulk Upload"
    And I upload a valid Excel file
    Then file should be validated
    And I should see preview of data

  Scenario: File validation errors
    When I upload Excel with invalid data
    Then I should see errors highlighted:
      | issue                    | shown |
      | Missing required fields  | yes   |
      | Invalid data types       | yes   |
      | Duplicate SKUs           | yes   |
      | Invalid categories       | yes   |
      | Invalid pincodes         | yes   |

  Scenario: Preview shows success/error count
    When I upload Excel file
    Then preview should show:
      | Rows to add       | count |
      | Rows with errors  | count |
      | Option to fix     | yes   |

  Scenario: Confirm and import
    Given I have uploaded valid Excel
    When I tap "Confirm and Import"
    Then items should be imported
    And I should see import summary

  Scenario: Import summary
    After import completes
    Then I should see:
      | Items added  | X |
      | Items failed | Y |
      | Download error log option |

  Scenario: Maximum 500 items per upload
    When I try to upload Excel with more than 500 rows
    Then I should see error about maximum limit

  Scenario: Uploaded items in draft until image added
    When I import items via Excel
    Then items should have status "draft"
    Until at least 1 image is uploaded for each

  # ============================================================
  # BULK ACTIONS
  # ============================================================

  Scenario: Export items to Excel
    When I tap "Export" button
    Then items should be exported to Excel
    And file should download

  Scenario: Bulk activate items
    When I select multiple items
    And I tap "Bulk Activate"
    Then selected items should be activated

  Scenario: Bulk deactivate items
    When I select multiple items
    And I tap "Bulk Deactivate"
    Then selected items should be deactivated

  Scenario: Bulk update inventory
    When I select multiple items
    And I tap "Bulk Update Inventory"
    Then I should see bulk inventory update form

  # ============================================================
  # PRICE AND DISCOUNT
  # ============================================================

  Scenario: Final price calculated from discount
    Given subcategory "Basin" has 15% discount
    When I view a basin item with MRP ₹2,500
    Then final price should show ₹2,125

  Scenario: Price changes apply immediately
    When I update MRP for an item
    Then new price should apply to future orders immediately
