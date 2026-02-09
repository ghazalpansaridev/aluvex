Feature: Retailer Payments and Credit Limit
  As a retailer
  I want to view my credit limit and payment history
  So that I can manage my account balance

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # CREDIT LIMIT DISPLAY - WITH CREDIT LIMIT
  # ============================================================

  Scenario: View payments page with credit limit assigned
    Given I have a credit limit of ₹50,000
    And outstanding dues of ₹15,000
    When I navigate to "Payments" from navigation menu
    Then I should see the payments screen
    And I should see credit limit summary card

  Scenario: Credit limit summary shows correct values
    Given I have:
      | field             | value    |
      | Credit limit      | ₹50,000  |
      | Outstanding dues  | ₹15,000  |
    When I view the payments screen
    Then credit summary should show:
      | field            | value    |
      | Total credit     | ₹50,000  |
      | Outstanding dues | ₹15,000  |
      | Available credit | ₹35,000  |

  Scenario: Available credit calculation
    Given credit limit is ₹50,000
    And outstanding dues is ₹15,000
    When I view payments screen
    Then available credit should be ₹35,000
    # Formula: Available = Credit Limit - Outstanding Dues

  Scenario: Last payment date displayed
    Given I have received payments
    When I view the payments screen
    Then I should see "Last payment date" in the summary card

  # ============================================================
  # CREDIT LIMIT DISPLAY - NO CREDIT LIMIT
  # ============================================================

  Scenario: View payments page without credit limit
    Given I have no credit limit assigned
    When I navigate to "Payments"
    Then I should see message "No credit limit assigned"
    And I should see "Please contact your account manager"

  Scenario: Payment history still visible without credit limit
    Given I have no credit limit assigned
    But I have payment transactions
    When I view payments screen
    Then I should still see transaction history
    But no credit summary card

  # ============================================================
  # PAYMENT HISTORY / TRANSACTION LOG
  # ============================================================

  Scenario: View payment transaction history
    Given I have payment transactions
    When I view the payments screen
    Then I should see transaction log table

  Scenario: Transaction entry shows correct fields
    Given I have transactions
    When I view transaction history
    Then each transaction should show:
      | field               | displayed |
      | Date & time         | yes       |
      | Transaction type    | yes       |
      | Description         | yes       |
      | Debit amount        | conditional |
      | Credit amount       | conditional |
      | Balance after       | yes       |

  Scenario: Debit transaction displayed correctly
    Given I have a debit transaction for order "ORD-20260203-07614"
    When I view transaction history
    Then I should see:
      | field       | value              |
      | Type        | Debit              |
      | Description | Order #ORD-20260203-07614 |
      | Debit       | amount shown       |
      | Credit      | -                  |

  Scenario: Credit transaction displayed correctly
    Given admin has recorded a payment of ₹5,000 for me
    When I view transaction history
    Then I should see:
      | field       | value                |
      | Type        | Credit               |
      | Description | Payment recorded     |
      | Debit       | -                    |
      | Credit      | ₹5,000               |

  Scenario: Transactions color coded by type
    When I view transaction history
    Then debit transactions should be in red/negative color
    And credit transactions should be in green/positive color

  Scenario: Click order number navigates to order
    Given I have a debit transaction linked to order "ORD-20260203-07614"
    When I tap the order number in that transaction
    Then I should be navigated to order details for that order

  # ============================================================
  # FILTERS ON TRANSACTION HISTORY
  # ============================================================

  Scenario: Filter transactions by date range
    Given I have transactions from different dates
    When I tap date range filter
    And I select date range
    Then I should see only transactions from that range

  Scenario: Filter transactions by type - Debit
    Given I have both debit and credit transactions
    When I filter by type "Debit"
    Then I should see only debit transactions

  Scenario: Filter transactions by type - Credit
    Given I have both debit and credit transactions
    When I filter by type "Credit"
    Then I should see only credit transactions

  Scenario: Show all transactions (default)
    When I view payments screen without filters
    Then I should see all transaction types

  # ============================================================
  # PAGINATION
  # ============================================================

  Scenario: Transactions paginated
    Given I have more than 20 transactions
    When I view transaction history
    Then I should see first 20 transactions
    When I scroll down
    Then more transactions should load

  # ============================================================
  # BALANCE TRACKING
  # ============================================================

  Scenario: Balance after each transaction shows running balance
    Given I have transactions
    When I view transaction history
    Then "Balance after" column should show cumulative balance
    And latest transaction should match current outstanding dues

  Scenario: Outstanding dues matches transaction sum
    Given outstanding dues is ₹15,000
    When I view transaction history
    Then sum of (debits - credits) should equal ₹15,000

  # ============================================================
  # REAL-TIME UPDATES
  # ============================================================

  Scenario: Pull to refresh updates balance
    Given my payment was just recorded by admin
    When I pull to refresh on payments screen
    Then balance should update to reflect new payment

  Scenario: Notification updates payment screen
    Given I am on payments screen
    When admin records a payment for me
    And I receive notification
    And I refresh the screen
    Then I should see the new credit transaction

  # ============================================================
  # EDGE CASES
  # ============================================================

  Scenario: Available credit shows zero if dues exceed limit
    Given credit limit is ₹10,000
    And outstanding dues is ₹15,000
    When I view payments screen
    Then available credit should show ₹0
    And NOT negative amount

  Scenario: Empty transaction history
    Given I am a new retailer with no transactions
    When I view payments screen
    Then I should see empty state for transaction history
    And message "No transactions yet"
