Feature: Sales Person Authentication
  As a sales person
  I want to login to the app
  So that I can register retailers and view orders

  # ============================================================
  # LOGIN
  # ============================================================

  Scenario: Successful login for sales person
    Given I am on the login screen
    When I enter email "sales@mailinator.com"
    And I enter valid password
    And I tap Login
    Then I should be logged in as sales person
    And I should see the appropriate home screen

  Scenario: Sales person navigation menu shows correct options
    Given I am logged in as sales person "sales@mailinator.com"
    When I open the navigation menu
    Then I should see menu options:
      | option            | visible |
      | Order Management  | yes     |
      | Catalogue         | yes     |
      | Register New User | yes     |
      | Settings          | yes     |
      | Notifications     | yes     |
      | Contact Us        | yes     |
      | Logout            | yes     |
      | Dashboard         | no      |
      | Items             | no      |
      | Seller Management | no      |
      | User Management   | no      |

  Scenario: Invalid credentials show error
    Given I am on the login screen
    When I enter email "sales@mailinator.com"
    And I enter wrong password
    And I tap Login
    Then I should see error "Invalid credentials"

  Scenario: Forgot password for sales person
    Given I am on the login screen
    When I tap "Forgot Password"
    And I enter email "sales@mailinator.com"
    And I tap "Send Reset Link"
    Then reset email should be sent

  # ============================================================
  # SESSION
  # ============================================================

  Scenario: Session timeout
    Given I am logged in as sales person
    When I remain inactive for 30 minutes
    Then I should be automatically logged out

  Scenario: Logout
    Given I am logged in as sales person
    When I tap Logout from navigation menu
    Then I should be logged out
    And I should see the login screen
