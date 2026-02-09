# Fittmart BDD Test Suite for Appium MCP

This directory contains Behavior-Driven Development (BDD) style test scenarios for the Fittmart B2B wholesale e-commerce application. These tests are designed to be executed by Claude Code using Appium MCP server.

## Directory Structure

```
tests/bdd/
├── README.md                    # This file
├── test-data/
│   └── test-accounts.md         # Test accounts and sample data
├── guest/
│   └── guest.feature            # Guest user scenarios
├── retailer/
│   ├── authentication.feature   # Login, registration, password reset
│   ├── catalogue.feature        # Browse, search, filter products
│   ├── cart.feature             # Cart operations
│   ├── checkout.feature         # Order placement
│   ├── orders.feature           # Order history and details
│   ├── payments.feature         # Credit and payment history
│   ├── favorites.feature        # Favorites management
│   ├── profile.feature          # Profile settings
│   └── notifications.feature    # Notification center
├── sales/
│   ├── authentication.feature   # Sales person login
│   ├── catalogue.feature        # View catalogue (no cart)
│   ├── retailer-registration.feature # Register retailers
│   ├── orders.feature           # View orders (read-only)
│   └── navigation.feature       # Navigation restrictions
├── operations/
│   ├── authentication.feature   # Operations login
│   ├── items.feature            # Item management (CRUD)
│   ├── categories.feature       # Category/discount management
│   ├── orders.feature           # Order processing & shipments
│   ├── sellers.feature          # Seller management & approval
│   └── payments.feature         # Payment recording
└── admin/
    ├── authentication.feature   # Admin login
    ├── dashboard.feature        # Dashboard metrics
    ├── user-management.feature  # User CRUD operations
    └── full-access.feature      # Admin has all capabilities
```

## How to Use These Tests with Claude Code + Appium MCP

### Prerequisites

1. Appium MCP server configured in Claude Code
2. App built and installed on simulator/emulator
3. Simulator/emulator running

### Running Tests

Ask Claude to execute specific test scenarios:

```
"Run the retailer authentication tests from tests/bdd/retailer/authentication.feature"

"Execute the guest catalogue browsing scenarios"

"Test the complete order placement flow for retailer role"

"Run all admin dashboard tests and take screenshots at each step"
```

### Test Execution Pattern

For each scenario, Claude will:
1. Read the feature file
2. Start an Appium session
3. Execute each step (Given/When/Then)
4. Take screenshots at key checkpoints
5. Verify expected outcomes
6. Report pass/fail status

## Test Data

All test accounts, sample products, and expected data are documented in:
- `test-data/test-accounts.md`

## User Roles Covered

| Role | Features | Key Capabilities |
|------|----------|------------------|
| Guest | Browse catalogue, register | View MRP only, no cart |
| Retailer | Full shopping flow | Discounted prices, orders, payments |
| Sales | Register retailers, view orders | No cart, no order processing |
| Operations | Item/order/seller management | Process orders, record payments |
| Admin | Full access + dashboard | All operations + user management |

## Writing Additional Tests

Follow the Gherkin syntax:

```gherkin
Feature: Feature Name
  As a [role]
  I want to [action]
  So that [benefit]

  Background:
    Given common setup steps

  Scenario: Scenario name
    Given [precondition]
    When [action]
    Then [expected result]
    And [additional verification]
```

## TestID Mapping

Tests reference UI elements by testID. Key patterns:
- Screens: `{screen-name}-screen`
- Buttons: `{context}-{action}-button`
- Inputs: `{form}-{field}-input`
- Lists: `{list-name}-list`
- Cards: `{card-type}-{id}`
