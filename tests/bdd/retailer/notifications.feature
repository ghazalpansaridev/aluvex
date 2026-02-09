Feature: Retailer Notifications
  As a retailer
  I want to receive and manage notifications
  So that I stay informed about my orders and account

  Background:
    Given I am logged in as approved retailer "fittmart-seller-approved4@mailinator.com"

  # ============================================================
  # NOTIFICATION BELL / BADGE
  # ============================================================

  Scenario: Notification bell visible in header
    When I am on any screen
    Then I should see notification bell icon in the header

  Scenario: Unread notification badge
    Given I have 3 unread notifications
    Then notification bell should show badge with "3"

  Scenario: Badge updates on new notification
    Given I have 0 unread notifications
    When I receive a new notification
    Then badge should appear showing "1"

  Scenario: Badge clears when all read
    Given I have unread notifications
    When I mark all as read
    Then badge should disappear

  # ============================================================
  # NOTIFICATION PANEL
  # ============================================================

  Scenario: Open notification panel
    When I tap the notification bell
    Then notification panel should open
    And I should see list of recent notifications

  Scenario: Notification shows correct information
    Given I have notifications
    When I open notification panel
    Then each notification should show:
      | element     | displayed |
      | Icon        | yes       |
      | Title       | yes       |
      | Description | yes       |
      | Timestamp   | yes       |
      | Read status | yes       |

  Scenario: Unread notifications visually distinct
    Given I have both read and unread notifications
    When I view notification panel
    Then unread notifications should be highlighted
    And read notifications should appear dimmed

  # ============================================================
  # NOTIFICATION PAGE
  # ============================================================

  Scenario: Navigate to full notifications page
    When I tap "Notifications" in navigation menu
    Then I should see full notifications page
    And I should see all my notifications

  Scenario: Filter unread notifications
    Given I have read and unread notifications
    When I toggle "Unread only" filter
    Then I should see only unread notifications

  Scenario: Filter by date range
    Given I have notifications from different dates
    When I filter by date range
    Then I should see only notifications from that range

  Scenario: Mark all as read
    Given I have unread notifications
    When I tap "Mark all as read"
    Then all notifications should be marked as read
    And badge should clear

  Scenario: Clear all notifications
    Given I have notifications
    When I tap "Clear all"
    Then I should see confirmation dialog
    When I confirm
    Then all notifications should be removed

  # ============================================================
  # NOTIFICATION TYPES - RETAILER
  # ============================================================

  Scenario: Account approved notification
    Given my account was just approved
    Then I should receive notification:
      | field       | value                      |
      | Type        | Account Status             |
      | Title       | Account Approved           |
      | Description | Your account has been approved |

  Scenario: Account rejected notification
    Given my account was rejected
    Then I should receive notification with rejection reason

  Scenario: Order placed confirmation notification
    When I place an order
    Then I should receive notification:
      | field       | value                      |
      | Type        | Order                      |
      | Title       | Order Placed               |
      | Description | Order #XXX placed successfully |

  Scenario: Order shipped notification
    Given my order is shipped
    Then I should receive notification:
      | field       | value                       |
      | Type        | Order                       |
      | Title       | Order Shipped               |
      | Description | Shipment created for order #XXX |

  Scenario: Order cancelled notification
    Given my order is cancelled
    Then I should receive notification with cancellation reason

  Scenario: Payment recorded notification
    Given admin records a payment for me
    Then I should receive notification:
      | field       | value                      |
      | Type        | Payment                    |
      | Title       | Payment Recorded           |
      | Description | Payment of ₹X recorded     |

  Scenario: Credit limit updated notification
    Given my credit limit is updated
    Then I should receive notification about the change

  # ============================================================
  # NOTIFICATION ACTIONS
  # ============================================================

  Scenario: Tap notification navigates to relevant page
    Given I have an order shipped notification
    When I tap that notification
    Then I should be navigated to that order's details page

  Scenario: Auto-mark as read on tap
    Given I have an unread notification
    When I tap to view it
    Then it should be automatically marked as read

  Scenario: Swipe to delete notification
    Given I have a notification
    When I swipe left on that notification
    Then I should see delete option
    When I tap delete
    Then notification should be removed

  # ============================================================
  # PUSH NOTIFICATIONS
  # ============================================================

  Scenario: Receive push notification when app in background
    Given app is in background
    When I receive a notification
    Then push notification should appear on device

  Scenario: Tap push notification opens app to relevant screen
    Given app is in background
    When I receive order shipped push notification
    And I tap the push notification
    Then app should open to order details screen

  # ============================================================
  # NOTIFICATION SETTINGS
  # ============================================================

  Scenario: Push notifications enabled by default
    When I check notification settings
    Then push notifications should be enabled

  Scenario: Disable push notifications
    When I disable push notifications in settings
    Then I should not receive push notifications
    But in-app notifications should still work

  # ============================================================
  # NOTIFICATION RETENTION
  # ============================================================

  Scenario: Notifications stored for 30 days
    Given I have a notification from 31 days ago
    Then it should be automatically removed

  Scenario: Recent notifications visible
    Given I have notifications from the past 30 days
    Then all of them should be visible
