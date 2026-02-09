Feature: Operations - Payment Recording
  As an operations team member
  I want to record offline payments from retailers
  So that I can track their credit balance

  Background:
    Given I am logged in as operations user "fittmart-ops@mailinator.com"

  # ============================================================
  # ACCESS PAYMENT RECORDING
  # ============================================================

  Scenario: Access payment recording from seller details
    Given I am viewing seller "ghazal" details
    Then I should see "Record Payment" section

  Scenario: View current dues before recording
    Given seller has outstanding dues ₹15,000
    And credit limit ₹50,000
    When I view payment recording section
    Then I should see:
      | Current outstanding dues | ₹15,000 |
      | Credit limit             | ₹50,000 |
      | Available credit         | ₹35,000 |

  # ============================================================
  # PAYMENT RECORDING FORM
  # ============================================================

  Scenario: Payment recording form fields
    When I view payment recording form
    Then I should see fields:
      | field              | required |
      | Payment amount     | yes      |
      | Payment date       | yes      |
      | Reference/Notes    | no       |

  Scenario: Payment amount validation
    When I enter payment amount "abc"
    Then I should see validation error for numeric input

  Scenario: Payment date defaults to today
    When I open payment recording form
    Then date should default to today's date

  Scenario: Cannot select future date
    When I try to select a future date
    Then it should not be allowed
    Or I should see validation error

  # ============================================================
  # PAYMENT PREVIEW
  # ============================================================

  Scenario: Preview shows effect of payment
    Given current outstanding dues are ₹15,000
    And available credit is ₹35,000
    When I enter payment amount ₹5,000
    Then preview should show:
      | Outstanding after payment | ₹10,000 |
      | Available credit after    | ₹40,000 |

  Scenario: Payment exceeds outstanding dues
    Given outstanding dues are ₹5,000
    When I enter payment ₹10,000
    Then preview should show:
      | Outstanding after payment | ₹0       |
      | Available credit after    | increases by ₹10,000 |
    And this should be allowed (adds to available credit)

  # ============================================================
  # RECORD PAYMENT
  # ============================================================

  Scenario: Successfully record payment
    Given I am on payment recording section
    When I enter:
      | Payment amount | ₹5,000              |
      | Payment date   | 2026-02-03          |
      | Reference      | Cash payment REF001 |
    And I tap "Record Payment"
    Then payment should be recorded
    And I should see success message

  Scenario: Payment creates credit transaction
    When I record a payment
    Then a credit transaction should be created in retailer's history
    With type "Credit"
    And description "Payment recorded"

  Scenario: Available credit updated immediately
    Given outstanding dues are ₹15,000
    When I record payment of ₹5,000
    Then outstanding dues should become ₹10,000
    And available credit should increase by ₹5,000

  Scenario: Retailer receives notification
    When I record a payment
    Then retailer should receive:
      | Push notification |
      | In-app notification |
      | Email |

  Scenario: Payment reference stored
    When I record payment with reference "Check #12345"
    Then that reference should be stored
    And visible in transaction history

  # ============================================================
  # PAYMENT NOT LINKED TO ORDERS
  # ============================================================

  Scenario: Payment adjusts overall dues
    When I record a payment
    Then it should adjust overall outstanding dues
    And NOT be linked to a specific order

  Scenario: Multiple orders with one payment
    Given retailer has dues from multiple orders
    When I record a payment
    Then it reduces total outstanding
    And is not applied to specific order

  # ============================================================
  # RECENT PAYMENT HISTORY
  # ============================================================

  Scenario: View recent payments in seller details
    Given I am viewing seller details
    Then I should see recent payment history
    With last 10 transactions

  Scenario: View all transactions
    When I tap "View All" on payment history
    Then I should see full transaction history
    For that retailer

  # ============================================================
  # EDGE CASES
  # ============================================================

  Scenario: Record payment for seller with no credit limit
    Given seller has no credit limit assigned
    When I record a payment
    Then payment should still be recorded
    And outstanding dues should decrease

  Scenario: Payment amount validation - max digits
    When I try to enter amount with more than 10 digits
    Then input should be limited
    Or I should see validation error

  Scenario: Payment amount allows 2 decimal places
    When I enter payment amount ₹5,000.50
    Then it should be accepted
