Feature: Operations - Seller/Retailer Management
  As an operations team member
  I want to manage retailers and approve applications
  So that I can onboard new customers and maintain accounts

  Background:
    Given I am logged in as operations user "fittmart-ops@mailinator.com"

  # ============================================================
  # SELLER LIST
  # ============================================================

  Scenario: Access seller management
    When I tap "Seller Management" in navigation menu
    Then I should see the seller management screen
    And I should see tabs for different statuses

  Scenario: Seller list has status tabs
    When I view seller management
    Then I should see tabs:
      | Pending Approval |
      | Approved         |
      | Rejected         |

  Scenario: Pending tab shows pending applications
    When I tap "Pending Approval" tab
    Then I should see all pending retailer applications

  Scenario: Approved tab shows approved retailers
    When I tap "Approved" tab
    Then I should see all approved retailers
    With their credit limit and outstanding dues

  Scenario: Rejected tab shows rejected applications
    When I tap "Rejected" tab
    Then I should see all rejected applications

  Scenario: Seller list shows information
    When I view seller list
    Then each seller should show:
      | field           | displayed |
      | Retailer ID     | yes       |
      | Business name   | yes       |
      | Owner name      | yes       |
      | Email           | yes       |
      | Phone           | yes       |
      | Pincode         | yes       |
      | GST number      | yes       |
      | PAN number      | yes       |
      | Application date| yes       |

  Scenario: Approved sellers show financial info
    When I view approved sellers
    Then each should also show:
      | Credit limit     |
      | Outstanding dues |

  Scenario: Filter sellers by search
    When I search for "ghazal"
    Then I should see sellers matching "ghazal" in name/email/GST

  Scenario: Filter sellers by pincode
    When I filter by pincode "560001"
    Then I should see only sellers from that pincode

  # ============================================================
  # RETAILER APPROVAL
  # ============================================================

  Scenario: View pending application details
    Given there is a pending application
    When I tap "View Details" on that application
    Then I should see full application details:
      | All submitted information |
      | Application date          |
      | Applied by (Self/Sales)   |

  Scenario: Approve application
    Given I am viewing a pending application
    When I tap "Approve"
    Then I should see credit limit input (optional)
    When I set credit limit to ₹50,000
    And I confirm approval
    Then retailer status should change to "Approved"
    And retailer should receive email notification

  Scenario: Approve without credit limit
    Given I am approving an application
    When I leave credit limit empty
    And I confirm approval
    Then retailer should be approved
    And credit limit should be null

  Scenario: Reject application
    Given I am viewing a pending application
    When I tap "Reject"
    Then I should see rejection reason input (required)
    When I enter reason "Incomplete documentation"
    And I confirm rejection
    Then retailer status should change to "Rejected"
    And retailer should receive email with rejection reason

  Scenario: Rejection reason required
    When I try to reject without reason
    Then I should see error "Rejection reason required"

  Scenario: Quick approve from list
    Given I am on pending sellers list
    When I tap quick "Approve" button on a seller
    Then approval dialog should appear
    And I can approve without viewing full details

  Scenario: Quick reject from list
    Given I am on pending sellers list
    When I tap quick "Reject" button on a seller
    Then rejection dialog should appear with reason input

  # ============================================================
  # SELLER DETAILS (APPROVED)
  # ============================================================

  Scenario: View approved seller details
    When I tap on an approved seller
    Then I should see seller details screen with:
      | section             | displayed |
      | Business details    | yes       |
      | Owner details       | yes       |
      | Application details | yes       |
      | Account details     | yes       |
      | Credit info         | yes       |
      | Payment section     | yes       |
      | Order history       | yes       |

  Scenario: Edit seller business details
    Given I am viewing seller details
    When I tap "Edit" on business details
    Then I can update:
      | Business name    |
      | Business address |
      | Pincode          |
    When I save changes
    Then details should be updated

  Scenario: Edit seller owner details
    Given I am viewing seller details
    When I tap "Edit" on owner details
    Then I can update:
      | Owner name |
      | Phone      |
      | Email      |
    When I save changes
    Then details should be updated

  # ============================================================
  # CREDIT LIMIT MANAGEMENT
  # ============================================================

  Scenario: View current credit limit
    Given seller has credit limit ₹50,000
    When I view seller details
    Then I should see:
      | Current credit limit | ₹50,000 |

  Scenario: Edit credit limit
    Given I am viewing seller details
    When I tap "Edit" on credit limit
    And I change to ₹75,000
    And I tap Update
    Then credit limit should update
    And change should be logged

  Scenario: Credit limit history
    When I view credit limit section
    Then I should see history log showing:
      | Who changed     |
      | When changed    |
      | From what value |
      | To what value   |

  Scenario: Credit limit applies immediately
    When I update credit limit
    Then new limit should apply immediately
    And retailer's available credit should recalculate

  # ============================================================
  # CHANGE SELLER STATUS
  # ============================================================

  Scenario: Change status dropdown
    Given I am viewing an approved seller
    When I tap "Change Status"
    Then I should see options:
      | Approved |
      | Rejected |
      | Inactive |

  Scenario: Reject previously approved seller
    When I change status to "Rejected"
    Then I should provide rejection reason
    When I confirm
    Then seller cannot login anymore

  Scenario: Deactivate seller
    When I change status to "Inactive"
    And I confirm
    Then seller account is deactivated
    And seller cannot login

  Scenario: Status change triggers notification
    When I change seller status
    Then seller should receive email notification

  # ============================================================
  # ORDER HISTORY (FROM SELLER DETAILS)
  # ============================================================

  Scenario: View seller's recent orders
    Given I am viewing seller details
    Then I should see recent orders section
    With last 5 orders from this seller

  Scenario: View all seller orders
    When I tap "View All Orders"
    Then I should see filtered order list
    Showing only this seller's orders

  # ============================================================
  # ACTIVITY LOG
  # ============================================================

  Scenario: View seller activity log
    Given I am viewing seller details
    Then I should see activity log showing:
      | Orders placed    |
      | Payments received|
      | Profile updates  |
    With timestamps
