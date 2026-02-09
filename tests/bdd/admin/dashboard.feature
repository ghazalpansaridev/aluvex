Feature: Admin Dashboard
  As an admin
  I want to view business metrics and KPIs
  So that I can monitor the health of the business

  Background:
    Given I am logged in as admin "ghazalpansari@gmail.com"

  # ============================================================
  # ACCESS DASHBOARD
  # ============================================================

  Scenario: Dashboard is default landing page for admin
    When I login as admin
    Then I should be taken to the dashboard screen

  Scenario: Access dashboard from navigation
    When I tap "Dashboard" in navigation menu
    Then I should see the dashboard screen

  # ============================================================
  # KEY METRICS CARDS
  # ============================================================

  Scenario: Dashboard shows key metric cards
    When I view the dashboard
    Then I should see metric cards for:
      | Total Orders        |
      | Total Revenue       |
      | Total Retailers     |
      | Pending Approvals   |
      | Outstanding Dues    |
      | Low Stock Items     |

  Scenario: Total Orders metric
    When I view Total Orders card
    Then I should see:
      | Current month count |
      | % change from previous month |

  Scenario: Total Revenue metric
    When I view Total Revenue card
    Then I should see:
      | Current month revenue in ₹ |
      | % change from previous month |

  Scenario: Total Retailers metric
    When I view Total Retailers card
    Then I should see:
      | Total count        |
      | Active retailers   |

  Scenario: Pending Approvals metric
    When I view Pending Approvals card
    Then I should see count of pending retailer applications
    And it should be clickable to navigate to pending list

  Scenario: Outstanding Dues metric
    When I view Outstanding Dues card
    Then I should see total outstanding amount in ₹

  Scenario: Low Stock Items metric
    When I view Low Stock Items card
    Then I should see count of items below minimum stock level
    And it should be clickable to view those items

  # ============================================================
  # CHARTS AND VISUALIZATIONS
  # ============================================================

  Scenario: Revenue trend chart
    When I view the dashboard
    Then I should see Revenue Trend line chart
    Showing last 12 months

  Scenario: Orders by status chart
    When I view the dashboard
    Then I should see Orders by Status pie chart
    With segments for:
      | Placed           |
      | Partially Shipped|
      | Shipped          |
      | Cancelled        |

  Scenario: Top 10 items by revenue
    When I view the dashboard
    Then I should see Top 10 Items bar chart
    Ranked by revenue

  Scenario: Top 10 retailers by order value
    When I view the dashboard
    Then I should see Top 10 Retailers bar chart
    Ranked by order value

  Scenario: Category-wise revenue
    When I view the dashboard
    Then I should see Category Revenue pie chart

  Scenario: Orders by pincode
    When I view the dashboard
    Then I should see Orders by Pincode bar chart
    For top 10 pincodes

  # ============================================================
  # DATE RANGE FILTERS
  # ============================================================

  Scenario: Filter by This Month
    When I select "This Month" filter
    Then all metrics should show data for current month

  Scenario: Filter by Last Month
    When I select "Last Month" filter
    Then all metrics should show data for previous month

  Scenario: Filter by Last 3 Months
    When I select "Last 3 Months" filter
    Then all metrics should aggregate 3 months data

  Scenario: Filter by Last 6 Months
    When I select "Last 6 Months" filter
    Then all metrics should aggregate 6 months data

  Scenario: Filter by Last Year
    When I select "Last Year" filter
    Then all metrics should show 12 months data

  Scenario: Custom date range
    When I select "Custom Date Range"
    And I set start date "2025-07-01"
    And I set end date "2025-12-31"
    Then all metrics should show data for that range

  # ============================================================
  # RECENT ACTIVITY
  # ============================================================

  Scenario: Latest orders section
    When I view the dashboard
    Then I should see "Latest Orders" section
    With last 10 orders and their status

  Scenario: Recent retailer approvals
    When I view the dashboard
    Then I should see recent approval activity

  Scenario: Low stock alerts
    When I view the dashboard
    Then I should see low stock alerts
    For items below minimum level

  # ============================================================
  # DRILL-DOWN
  # ============================================================

  Scenario: Click metric card to view details
    When I tap on a metric card
    Then I should be navigated to relevant detail screen

  Scenario: Click chart segment for details
    When I tap on a chart segment/bar
    Then I should see drill-down details
    Or navigate to filtered view

  # ============================================================
  # EXPORT
  # ============================================================

  Scenario: Export dashboard data to Excel
    When I tap "Export to Excel"
    Then dashboard data should be exported
    And Excel file should download

  Scenario: Export charts as images
    When I tap export on a chart
    Then chart should be exportable as image

  # ============================================================
  # REAL-TIME UPDATES
  # ============================================================

  Scenario: Dashboard refreshes periodically
    Given I am on the dashboard
    Then data should refresh every 5 minutes
    Or I can manually pull to refresh

  Scenario: Pull to refresh
    When I pull down on the dashboard
    Then data should refresh
    And I should see loading indicator
