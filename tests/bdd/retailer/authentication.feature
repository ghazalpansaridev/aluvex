Feature: Retailer Authentication
  As a retailer
  I want to register, login, and manage my account access
  So that I can use the Fittmart platform

  # ============================================================
  # REGISTRATION - STEP 1: EMAIL CHECK
  # ============================================================

  Scenario: New email proceeds to registration form
    Given I am on the registration screen
    When I enter email "new-retailer-test@mailinator.com"
    And I tap Continue
    Then I should proceed to Step 2 (Business Information)

  Scenario: Existing approved email shows account exists message
    Given I am on the registration screen
    When I enter email "fittmart-seller-approved4@mailinator.com"
    And I tap Continue
    Then I should see message "Account already exists, please login"
    And I should see a link to login page

  Scenario: Existing pending email shows verification in progress
    Given I am on the registration screen
    When I enter email "fittmart-seller-approved5@mailinator.com"
    And I tap Continue
    Then I should see "Verification in Progress" page
    And I should see message about application being reviewed

  Scenario: Invalid email format shows validation error
    Given I am on the registration screen
    When I enter email "invalid-email"
    And I tap Continue
    Then I should see email validation error

  # ============================================================
  # REGISTRATION - STEP 2: BUSINESS INFORMATION
  # ============================================================

  Scenario: Business information form has required fields
    Given I am on Step 2 of registration
    Then I should see the following fields:
      | field            | required | type       |
      | Business Name    | yes      | text       |
      | Business Type    | yes      | dropdown   |
      | GST Number       | no       | text       |
      | PAN Number       | yes      | text       |
      | Business Address | yes      | textarea   |
      | Pincode          | yes      | numeric    |
      | City             | yes      | auto-fill  |
      | State            | yes      | auto-fill  |

  Scenario: Pincode auto-fills city and state
    Given I am on Step 2 of registration
    When I enter pincode "560001"
    Then the city field should auto-fill with "Bangalore"
    And the state field should auto-fill with "Karnataka"

  Scenario: Business type dropdown shows correct options
    Given I am on Step 2 of registration
    When I tap the Business Type dropdown
    Then I should see options:
      | Trader      |
      | Fabricator  |
      | Builder     |
      | Architect   |
      | Other       |

  Scenario: GST number validation (15 characters)
    Given I am on Step 2 of registration
    When I enter GST number "ABC123"
    And I try to proceed
    Then I should see GST validation error "GST must be 15 characters"

  Scenario: Valid GST number accepted
    Given I am on Step 2 of registration
    When I enter GST number "29ABCDE1234F1Z5"
    Then no GST validation error should appear

  Scenario: PAN number validation (10 characters format)
    Given I am on Step 2 of registration
    When I enter PAN number "12345"
    And I try to proceed
    Then I should see PAN validation error

  Scenario: Valid PAN number accepted
    Given I am on Step 2 of registration
    When I enter PAN number "ABCDE1234F"
    Then no PAN validation error should appear

  Scenario: Pincode validation (6 digits)
    Given I am on Step 2 of registration
    When I enter pincode "12345"
    And I try to proceed
    Then I should see pincode validation error "Pincode must be 6 digits"

  # ============================================================
  # REGISTRATION - STEP 3: OWNER INFORMATION
  # ============================================================

  Scenario: Owner information form has required fields
    Given I am on Step 3 of registration
    Then I should see the following fields:
      | field                   | required |
      | Owner Name              | yes      |
      | Owner Birth Date        | yes      |
      | Owner Phone             | yes      |
      | Alternate Contact       | no       |

  Scenario: Phone number triggers OTP verification
    Given I am on Step 3 of registration
    When I enter phone number "9876543210"
    And I tap Verify
    Then I should see OTP input screen

  Scenario: Phone number validation (10 digits)
    Given I am on Step 3 of registration
    When I enter phone number "12345"
    Then I should see validation error for phone number

  # ============================================================
  # REGISTRATION - STEP 4: DOCUMENTS & SUBMIT
  # ============================================================

  Scenario: Documents upload is optional
    Given I am on Step 4 of registration
    Then document uploads should not be mandatory
    And I should see placeholder text for PAN and GST documents

  Scenario: Terms and conditions must be accepted
    Given I am on Step 4 of registration
    And I have not checked Terms & Conditions
    Then the Submit button should be disabled

  Scenario: Successful registration shows verification page
    Given I have completed all registration steps with valid data
    When I accept Terms & Conditions
    And I tap Submit
    Then I should see "Verification in Progress" page
    And I should see message about application being processed

  # ============================================================
  # LOGIN
  # ============================================================

  Scenario: Successful login for approved retailer
    Given I am on the login screen
    When I enter email "fittmart-seller-approved4@mailinator.com"
    And I enter valid password
    And I tap Login
    Then I should be logged in
    And I should see the catalogue screen
    And I should see discounted prices

  Scenario: Pending retailer can login with restricted access
    Given I am on the login screen
    When I login as pending retailer "fittmart-seller-approved5@mailinator.com"
    Then I should be logged in
    And I should see verification in progress message
    And I should NOT be able to add items to cart

  Scenario: Invalid credentials show error
    Given I am on the login screen
    When I enter email "fittmart-seller-approved4@mailinator.com"
    And I enter wrong password "wrongpassword"
    And I tap Login
    Then I should see error "Invalid credentials"

  Scenario: Email validation on login
    Given I am on the login screen
    When I enter invalid email "notanemail"
    Then I should see email validation error

  Scenario: Password visibility toggle
    Given I am on the login screen
    When I enter password "testpass123"
    Then password should be masked
    When I tap the show/hide password toggle
    Then password should be visible

  Scenario: Remember me functionality
    Given I am on the login screen
    When I check "Remember me"
    And I login successfully
    And I logout and return to login screen
    Then email field should be pre-filled

  # ============================================================
  # FORGOT PASSWORD
  # ============================================================

  Scenario: Forgot password sends reset link
    Given I am on the login screen
    When I tap "Forgot Password"
    And I enter email "fittmart-seller-approved4@mailinator.com"
    And I tap "Send Reset Link"
    Then I should see confirmation message
    And reset link should be sent to email

  Scenario: Password reset form validation
    Given I am on password reset form
    When I enter new password "weak"
    Then I should see password strength indicator showing weak
    And I should see password requirements message

  Scenario: Password must meet complexity requirements
    Given I am on password reset form
    Then password must have:
      | requirement              |
      | Minimum 8 characters     |
      | At least one uppercase   |
      | At least one lowercase   |
      | At least one number      |
      | At least one special char|

  Scenario: Confirm password must match
    Given I am on password reset form
    When I enter new password "StrongPass1!"
    And I enter confirm password "DifferentPass1!"
    And I tap Reset Password
    Then I should see error "Passwords do not match"

  # ============================================================
  # SESSION MANAGEMENT
  # ============================================================

  Scenario: Session auto-logout after 30 minutes inactivity
    Given I am logged in as a retailer
    When I remain inactive for 30 minutes
    Then I should be automatically logged out
    And I should see the login screen

  Scenario: Logout functionality
    Given I am logged in as a retailer
    When I open the navigation menu
    And I tap "Logout"
    Then I should be logged out
    And I should see the login screen
