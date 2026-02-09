Feature: Admin Full Access Verification
  As an admin
  I have access to all system features
  So that I can manage the entire application

  Background:
    Given I am logged in as admin "ghazalpansari@gmail.com"

  # ============================================================
  # ADMIN HAS ALL OPERATIONS CAPABILITIES
  # ============================================================

  Scenario: Admin can access all operations features
    Then I should be able to access:
      | Feature                  | Access |
      | Order Management         | yes    |
      | Items Management         | yes    |
      | Seller Management        | yes    |
      | Category Management      | yes    |
      | Payment Recording        | yes    |
      | Invoice Generation       | yes    |

  Scenario: Admin can process orders
    Given there is a placed order
    When I open order processing
    Then I should be able to:
      | Create shipments       |
      | Add freight charges    |
      | Generate invoices      |
      | Cancel orders          |

  Scenario: Admin can manage items
    When I open Items management
    Then I should be able to:
      | Add new items          |
      | Edit existing items    |
      | Bulk upload items      |
      | Adjust inventory       |
      | Activate/deactivate    |

  Scenario: Admin can manage categories
    When I open category management
    Then I should be able to:
      | Add categories         |
      | Edit categories        |
      | Delete empty categories|
      | Add subcategories      |
      | Set discounts          |

  Scenario: Admin can approve/reject retailers
    When I open Seller Management
    And I view pending applications
    Then I should be able to:
      | Approve applications   |
      | Reject applications    |
      | Set credit limits      |

  Scenario: Admin can record payments
    When I view a seller's details
    Then I should be able to record payments

  # ============================================================
  # ADMIN-ONLY FEATURES
  # ============================================================

  Scenario: Admin can access dashboard
    When I tap "Dashboard" in navigation
    Then I should see the dashboard with metrics
    Note: Operations users CANNOT access dashboard

  Scenario: Admin can manage users
    When I tap "User Management" in navigation
    Then I should see the user management screen
    Note: Operations users CANNOT access this

  Scenario: Admin can create other admins
    When I open User Management
    And I tap "Add User"
    Then I can create users with role:
      | Admin      |
      | Operations |
      | Sales      |
      | Retailer   |

  Scenario: Admin can send notifications to sellers
    When I view a seller's details
    Then I should have option to send custom notification

  # ============================================================
  # ADMIN RESTRICTIONS (SELF)
  # ============================================================

  Scenario: Admin cannot delete self
    When I try to delete my own account
    Then action should be blocked
    And I should see appropriate error

  Scenario: Admin cannot change own role
    When I try to change my own role
    Then role field should be disabled
    Or action should be blocked

  # ============================================================
  # COMPLETE PERMISSION MATRIX
  # ============================================================

  Scenario: Verify complete admin permission matrix
    Then admin should have these permissions:
      | Feature              | View | Create | Edit | Delete | Process |
      | Dashboard            | yes  | -      | -    | -      | -       |
      | Catalogue            | yes  | -      | -    | -      | -       |
      | Items                | yes  | yes    | yes  | yes    | -       |
      | Categories           | yes  | yes    | yes  | yes    | -       |
      | Orders               | yes  | -      | -    | -      | yes     |
      | Shipments            | yes  | yes    | -    | -      | -       |
      | Invoices             | yes  | yes    | -    | -      | -       |
      | Sellers (Pending)    | yes  | -      | -    | -      | yes     |
      | Sellers (Approved)   | yes  | -      | yes  | no     | -       |
      | Credit Limits        | yes  | -      | yes  | -      | -       |
      | Payments             | yes  | yes    | -    | -      | -       |
      | Users (Admin)        | yes  | yes    | yes  | yes    | -       |
      | Users (Ops)          | yes  | yes    | yes  | yes    | -       |
      | Users (Sales)        | yes  | yes    | yes  | yes    | -       |
      | Users (Retailer)     | yes  | yes    | yes  | yes    | -       |
      | Notifications        | yes  | yes    | -    | yes    | -       |
      | Settings (own)       | yes  | -      | yes  | -      | -       |

  # ============================================================
  # COMPARISON: ADMIN VS OPERATIONS
  # ============================================================

  Scenario: Admin has more access than Operations
    Then admin has these that operations does NOT have:
      | Dashboard access           |
      | User Management access     |
      | Create Admin users         |
      | Create Operations users    |
      | Create Sales users         |
      | View all system metrics    |

  Scenario: Both Admin and Operations can
    Then both roles can:
      | Process orders           |
      | Manage items             |
      | Manage categories        |
      | Approve/reject retailers |
      | Record payments          |
      | Edit credit limits       |
      | View seller details      |
