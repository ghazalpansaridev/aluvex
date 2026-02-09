Feature: Admin User Management
  As an admin
  I want to manage all user accounts
  So that I can control access to the application

  Background:
    Given I am logged in as admin "ghazalpansari@gmail.com"

  # ============================================================
  # USER LIST
  # ============================================================

  Scenario: Access user management
    When I tap "User Management" in navigation menu
    Then I should see the user management screen

  Scenario: User list shows all user types
    When I view user list
    Then I should see users of all roles:
      | Admin      |
      | Operations |
      | Sales      |
      | Retailer   |

  Scenario: Filter users by role
    When I filter by role "Sales"
    Then I should see only sales users

  Scenario: Filter users by status
    When I filter by status "Active"
    Then I should see only active users

  Scenario: Search users by name or email
    When I search for "Abhishek"
    Then I should see users matching "Abhishek"

  Scenario: User list shows activity info
    When I view user list
    Then each user should show:
      | Name          |
      | Email         |
      | Role          |
      | Status        |
      | Last login    |
      | Registration date |

  # ============================================================
  # ADD SALES PERSON
  # ============================================================

  Scenario: Add new sales person
    When I tap "Add User"
    And I select role "Sales Person"
    Then I should see add sales person form

  Scenario: Sales person form fields
    When I fill add sales person form:
      | field    | required |
      | Name     | yes      |
      | Email    | yes      |
      | Phone    | yes      |
      | Password | yes      |
    And I tap Save
    Then sales person should be created
    And welcome email should be sent

  Scenario: Email uniqueness for new user
    Given "sales@mailinator.com" already exists
    When I try to create user with same email
    Then I should see error "Email already exists"

  # ============================================================
  # ADD ADMIN
  # ============================================================

  Scenario: Add new admin
    When I tap "Add User"
    And I select role "Admin"
    Then I should see add admin form

  Scenario: Successfully add admin
    When I fill admin form with valid data
    And I tap Save
    Then admin should be created
    And welcome email should be sent

  # ============================================================
  # ADD OPERATIONS USER
  # ============================================================

  Scenario: Add new operations user
    When I tap "Add User"
    And I select role "Operations"
    Then I should see add operations form

  Scenario: Successfully add operations user
    When I fill operations form with valid data
    And I tap Save
    Then operations user should be created
    And welcome email should be sent

  # ============================================================
  # ADD RETAILER (VIA ADMIN)
  # ============================================================

  Scenario: Add new retailer
    When I tap "Add User"
    And I select role "Retailer"
    Then I should see retailer registration form
    Same as regular registration form

  Scenario: Admin can pre-approve retailer
    When I add a retailer via admin
    Then I can choose to auto-approve
    And set credit limit during creation

  # ============================================================
  # EDIT USER
  # ============================================================

  Scenario: Edit user details
    When I tap on a user to edit
    Then I should see edit user form

  Scenario: Update user name
    When I edit user and change name
    And I tap Save
    Then name should be updated

  Scenario: Update user email
    When I edit user and change email
    Then email verification may be required
    When verified, email should update

  Scenario: Update user phone
    When I edit user and change phone
    And I tap Save
    Then phone should be updated

  Scenario: Reset user password
    When I tap "Reset Password" for a user
    Then password reset email should be sent to user

  Scenario: Change user role
    Given I am editing a sales person
    When I change role to "Operations"
    And I tap Save
    Then user role should be updated
    And user should have new permissions on next login

  Scenario: Cannot change own role
    When I try to edit my own account
    Then role field should be disabled
    And I should NOT be able to change my own role

  Scenario: Change user status
    When I change user status to "Inactive"
    And I tap Save
    Then user should be deactivated
    And user cannot login

  # ============================================================
  # DELETE USER
  # ============================================================

  Scenario: Delete user (soft delete)
    When I tap "Delete" on a user
    Then I should see confirmation dialog
    When I confirm
    Then user should be marked as inactive (soft delete)
    And user cannot login

  Scenario: Cannot delete myself
    When I try to delete my own account
    Then I should see error "Cannot delete your own account"
    Or delete button should be disabled

  # ============================================================
  # USER DETAILS
  # ============================================================

  Scenario: View user details
    When I tap on a user
    Then I should see user details:
      | All user information |
      | Activity logs        |
      | Last login           |
      | Registration date    |

  # ============================================================
  # NOTIFICATIONS
  # ============================================================

  Scenario: Email sent on account creation
    When I create a new user
    Then welcome email should be sent to user
    With login instructions

  Scenario: Email sent on role change
    When I change a user's role
    Then notification should be sent about role change
