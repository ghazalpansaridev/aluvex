Feature: Sales Person - Retailer Registration
  As a sales person
  I want to register retailers on their behalf
  So that I can help onboard new customers in the field

  Background:
    Given I am logged in as sales person "sales@mailinator.com"

  # ============================================================
  # REGISTRATION FORM ACCESS
  # ============================================================

  Scenario: Access retailer registration form
    When I tap "Register New User" in navigation menu
    Then I should see the retailer registration form

  Scenario: Registration form has same fields as self-registration
    When I open retailer registration form
    Then I should see all the standard registration fields:
      | step | fields                                              |
      | 1    | Email                                               |
      | 2    | Business Name, Type, GST, PAN, Address, Pincode     |
      | 3    | Owner Name, DOB, Phone, Alternate Phone             |
      | 4    | Documents, Terms acceptance                         |

  # ============================================================
  # STEP 1: EMAIL
  # ============================================================

  Scenario: Enter retailer email
    When I am on step 1 of registration
    And I enter email "new-retailer-by-sales@mailinator.com"
    And I tap Continue
    Then I should proceed to Step 2

  Scenario: Existing email shows appropriate message
    When I enter email of existing approved retailer
    Then I should see "Account already exists, please login"

  Scenario: Pending email shows verification message
    When I enter email of pending retailer
    Then I should see "Verification in Progress" message

  # ============================================================
  # STEP 2: BUSINESS INFORMATION
  # ============================================================

  Scenario: Fill business information
    Given I am on Step 2 of registration
    When I fill in:
      | field            | value                  |
      | Business Name    | Sales Registered Store |
      | Business Type    | Trader                 |
      | GST Number       | 29ABCDE1234F1Z5        |
      | PAN Number       | ABCDE1234F             |
      | Business Address | 456 Sales Street       |
      | Pincode          | 560001                 |
    Then City should auto-fill to "Bangalore"
    And State should auto-fill to "Karnataka"
    And I can proceed to Step 3

  Scenario: Validation same as self-registration
    When I enter invalid GST number
    Then I should see GST validation error
    When I enter invalid PAN
    Then I should see PAN validation error

  # ============================================================
  # STEP 3: OWNER INFORMATION
  # ============================================================

  Scenario: Fill owner information
    Given I am on Step 3 of registration
    When I fill in:
      | field        | value        |
      | Owner Name   | Store Owner  |
      | Owner DOB    | 1985-05-15   |
      | Owner Phone  | 9876543210   |
    And OTP is verified
    Then I can proceed to Step 4

  Scenario: Phone OTP verification required
    When I enter owner phone number
    And I tap Verify
    Then OTP should be sent to that number
    And I must enter valid OTP to proceed

  # ============================================================
  # STEP 4: DOCUMENTS & SUBMIT
  # ============================================================

  Scenario: Accept terms and submit
    Given I am on Step 4 of registration
    When I check Terms & Conditions
    And I tap Submit
    Then retailer application should be created
    And status should be "Pending Approval"

  Scenario: Email sent to new retailer
    When I successfully submit registration
    Then welcome email should be sent to retailer email
    And email should contain temporary password or login instructions

  # ============================================================
  # SALES PERSON RESTRICTIONS
  # ============================================================

  Scenario: Sales person cannot approve application
    Given I have registered a new retailer
    Then I should NOT be able to approve that application directly
    And I should see message that application requires backend approval

  Scenario: Status remains pending after registration
    When I complete registration for a retailer
    Then retailer status should be "Pending Approval"
    And retailer cannot place orders until approved

  # ============================================================
  # SUCCESS FLOW
  # ============================================================

  Scenario: Confirmation shown after successful registration
    When I successfully register a retailer
    Then I should see confirmation message
    And I should see that approval is pending
    And I should have option to register another retailer

  Scenario: Can register multiple retailers
    When I register retailer A
    And I register retailer B
    Then both should appear as pending applications
