Feature: Operations User Authentication
  As an operations team member
  I want to login to the app
  So that I can manage inventory, orders, and sellers

  # ============================================================
  # LOGIN
  # ============================================================

  Scenario: Successful login for operations user
    Given I am on the login screen
    When I enter email "fittmart-ops@mailinator.com"
    And I enter valid password
    And I tap Login
    Then I should be logged in as operations user
    And I should see the appropriate home screen

  Scenario: Operations navigation menu shows correct options
    Given I am logged in as operations user "fittmart-ops@mailinator.com"
    When I open the navigation menu
    Then I should see menu options:
      | option            | visible |
      | Order Management  | yes     |
      | Catalogue         | yes     |
      | Items             | yes     |
      | Seller Management | yes     |
      | Settings          | yes     |
      | Notifications     | yes     |
      | Contact Us        | yes     |
      | Logout            | yes     |
      | Dashboard         | no      |
      | User Management   | no      |

  Scenario: Operations user cannot access dashboard
    Given I am logged in as operations user
    Then Dashboard should NOT be in my navigation menu
    And I should NOT be able to access dashboard

  Scenario: Operations user cannot add new staff users
    Given I am logged in as operations user
    Then User Management should NOT be in my navigation menu
    And I should NOT be able to create admin/ops/sales users

  # ============================================================
  # PENDING PASSWORD STATUS
  # ============================================================

  Scenario: First login with pending password status
    Given I am a new operations user with status "pending_password"
    When I login for the first time
    Then I should be prompted to set my password

  # ============================================================
  # SESSION
  # ============================================================

  Scenario: Session timeout
    Given I am logged in as operations user
    When I remain inactive for 30 minutes
    Then I should be automatically logged out

  Scenario: Logout
    Given I am logged in as operations user
    When I tap Logout from navigation menu
    Then I should be logged out
    And I should see the login screen
