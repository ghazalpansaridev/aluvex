Feature: Retailer Profile Settings
  As a retailer
  I want to manage my profile settings
  So that I can update my contact information and password

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # VIEW PROFILE
  # ============================================================

  Scenario: Navigate to settings/profile
    When I tap "Settings" in the navigation menu
    Then I should see the settings/profile screen

  Scenario: Profile shows current information
    When I view my profile settings
    Then I should see my current information:
      | field           | editable |
      | Name            | yes      |
      | Email           | yes      |
      | Phone           | yes      |
      | Business Name   | no       |
      | GST Number      | no       |
      | Business Address| no       |
      | Pincode         | no       |

  Scenario: Business details are read-only
    When I view my profile
    Then I should see my business details
    And they should be non-editable
    And I should see note "To update business details, please contact support"

  # ============================================================
  # UPDATE NAME
  # ============================================================

  Scenario: Update owner name
    Given my current name is "Test Owner"
    When I tap edit on name field
    And I change name to "Updated Owner"
    And I tap Save
    Then name should be updated to "Updated Owner"
    And I should see success message

  Scenario: Name validation - required
    When I try to save with empty name
    Then I should see validation error "Name is required"

  Scenario: Name validation - max length
    When I try to enter name longer than 100 characters
    Then input should be limited to 100 characters
    Or I should see validation error

  # ============================================================
  # UPDATE EMAIL
  # ============================================================

  Scenario: Update email address
    Given my current email is "fittmart-seller-approved4@mailinator.com"
    When I tap edit on email field
    And I enter new email "newemail@mailinator.com"
    And I tap Save
    Then verification email should be sent to new email
    And I should see message about email verification

  Scenario: Email validation - format
    When I try to save email "invalid-email"
    Then I should see validation error for email format

  Scenario: Email validation - uniqueness
    When I try to update to an email that already exists
    Then I should see error "Email already in use"

  # ============================================================
  # UPDATE PHONE
  # ============================================================

  Scenario: Update phone number
    Given my current phone is "9876543210"
    When I tap edit on phone field
    And I enter new phone "9988776655"
    Then OTP verification should be triggered

  Scenario: Phone update requires OTP verification
    When I enter new phone number
    And OTP is sent
    When I enter valid OTP
    Then phone number should be updated
    And I should see success message

  Scenario: Phone validation - format
    When I try to enter phone "12345"
    Then I should see validation error "Phone must be 10 digits"

  # ============================================================
  # CHANGE PASSWORD
  # ============================================================

  Scenario: Change password section visible
    When I view my profile settings
    Then I should see "Change Password" section
    With fields for current and new password

  Scenario: Change password successfully
    Given I am in Change Password section
    When I enter current password correctly
    And I enter new password "NewPass123!"
    And I enter confirm password "NewPass123!"
    And I tap "Change Password"
    Then password should be updated
    And I should see success message

  Scenario: Current password required
    When I try to change password without current password
    Then I should see error "Current password is required"

  Scenario: Current password validation
    When I enter incorrect current password
    And I try to change password
    Then I should see error "Current password is incorrect"

  Scenario: New password complexity requirements
    When I enter new password "weak"
    Then I should see password strength indicator showing "Weak"
    And I should see requirements:
      | requirement              |
      | Minimum 8 characters     |
      | At least one uppercase   |
      | At least one lowercase   |
      | At least one number      |
      | At least one special char|

  Scenario: Password confirmation must match
    When I enter new password "StrongPass1!"
    And I enter confirm password "DifferentPass1!"
    And I tap "Change Password"
    Then I should see error "Passwords do not match"

  Scenario: Cannot reuse recent passwords
    Given I have used password "OldPass123!" recently
    When I try to set new password to "OldPass123!"
    Then I should see error "Cannot reuse recent passwords"

  # ============================================================
  # SAVE CHANGES
  # ============================================================

  Scenario: Save button enabled on changes
    Given no changes have been made
    Then Save button should be disabled
    When I make a change to any field
    Then Save button should become enabled

  Scenario: Unsaved changes warning
    Given I have unsaved changes
    When I try to navigate away
    Then I should see warning about unsaved changes
    And option to save or discard

  Scenario: Success message on save
    When I save valid changes
    Then I should see success toast/message
    And changes should be reflected immediately

  Scenario: Error handling on save failure
    Given network is unavailable
    When I try to save changes
    Then I should see error message
    And changes should not be lost
