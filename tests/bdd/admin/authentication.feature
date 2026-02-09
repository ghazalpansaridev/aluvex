Feature: Admin Authentication
  As an admin
  I want to login with full system access
  So that I can manage all aspects of the application

  # ============================================================
  # LOGIN
  # ============================================================

  Scenario: Successful login for admin
    Given I am on the login screen
    When I enter email "ghazalpansari@gmail.com"
    And I enter valid password
    And I tap Login
    Then I should be logged in as admin
    And I should see the dashboard

  Scenario: Admin navigation menu shows all options
    Given I am logged in as admin "ghazalpansari@gmail.com"
    When I open the navigation menu
    Then I should see menu options:
      | option            | visible |
      | Dashboard         | yes     |
      | Catalogue         | yes     |
      | Order Management  | yes     |
      | Items             | yes     |
      | Seller Management | yes     |
      | User Management   | yes     |
      | Settings          | yes     |
      | Notifications     | yes     |
      | Contact Us        | yes     |
      | Logout            | yes     |

  Scenario: Admin has full access
    Given I am logged in as admin
    Then I should have access to:
      | Dashboard with metrics     |
      | All operations features    |
      | User management            |
      | All seller management      |
      | All item management        |
      | All order processing       |

  # ============================================================
  # SESSION
  # ============================================================

  Scenario: Session timeout
    Given I am logged in as admin
    When I remain inactive for 30 minutes
    Then I should be automatically logged out

  Scenario: Logout
    Given I am logged in as admin
    When I tap Logout from navigation menu
    Then I should be logged out
    And I should see the login screen
