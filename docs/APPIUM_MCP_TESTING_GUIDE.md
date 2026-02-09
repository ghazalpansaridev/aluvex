# Appium MCP Testing Guide for React Native Expo Apps

This guide covers setting up AI-powered mobile testing using Claude Code with Appium MCP for the Fittmart app.

---

## Table of Contents

1. [Overview](#overview)
2. [How Claude Understands Your App](#how-claude-understands-your-app)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Building Your Expo App for Testing](#building-your-expo-app-for-testing)
6. [Appium MCP Configuration](#appium-mcp-configuration)
7. [Adding TestIDs to Components](#adding-testids-to-components)
8. [Testing Workflow](#testing-workflow)
9. [Common Testing Scenarios](#common-testing-scenarios)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Appium MCP?

Appium MCP (Model Context Protocol) is a bridge that allows AI assistants like Claude to control mobile devices through Appium. Instead of writing test scripts, you describe what you want to test in natural language.

### Do I Need to Build/Package the App?

**Yes.** Appium cannot connect to Expo's development server or Expo Go directly. You need a standalone build:

| Build Type | Use Case | Command |
|------------|----------|---------|
| Development Build | Debug testing with dev tools | `npx expo run:ios` / `npx expo run:android` |
| Preview Build | Testing release-like behavior | `eas build --profile preview --platform ios` |
| Release Build | Final testing before production | `eas build --profile production` |

**Recommended for testing:** Development build - fastest iteration, includes debugging capabilities.

---

## How Claude Understands Your App

Claude uses multiple inputs to understand and test your app:

### 1. Screenshots (Visual Analysis)

Claude is multimodal - it can see and analyze images. When testing:

```
Claude takes screenshot → Analyzes visual layout → Identifies:
- Misaligned elements
- Overlapping components
- Text truncation
- Color contrast issues
- Missing elements
- Incorrect spacing
```

**Example issues Claude can spot:**
- Button text getting cut off
- Cards not aligned properly
- Images not loading (broken image placeholders)
- Wrong colors compared to design spec
- Elements outside safe area

### 2. Page Source XML (UI Hierarchy)

Appium provides the complete UI tree as XML:

```xml
<XCUIElementTypeApplication name="Fittmart">
  <XCUIElementTypeWindow>
    <XCUIElementTypeOther>
      <XCUIElementTypeTextField testID="phone-input" value="" />
      <XCUIElementTypeButton testID="login-button" label="Login" enabled="true" />
    </XCUIElementTypeOther>
  </XCUIElementTypeWindow>
</XCUIElementTypeApplication>
```

**What Claude extracts:**
- Element types (Button, TextField, Image, etc.)
- TestIDs and accessibility labels
- Current values and states
- Element positions (x, y, width, height)
- Enabled/disabled states
- Visibility status

### 3. Element Attributes

For each UI element, Claude can query:
- `testID` - Your custom identifier
- `accessibilityLabel` - Screen reader text
- `text` / `label` - Visible text content
- `value` - Current input value
- `enabled` - Interactive state
- `visible` - On-screen visibility
- `bounds` - Position and size

### 4. Combining with PRD/Specs

Claude can cross-reference what it sees against your specifications:

```
PRD says: "Login button should be disabled until valid phone number entered"
Claude checks:
1. Takes screenshot - sees button styling
2. Gets page source - checks `enabled` attribute
3. Enters invalid number - verifies button stays disabled
4. Enters valid number - verifies button becomes enabled
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| Node.js | v22+ | Runtime | `brew install node` |
| Java JDK | 8+ | Android tooling | `brew install openjdk` |
| Xcode | Latest | iOS builds & simulator | App Store |
| Android Studio | Latest | Android SDK & emulator | `brew install --cask android-studio` |
| Appium | 2.x | Automation server | `npm install -g appium` |
| Watchman | Latest | File watching | `brew install watchman` |

### Xcode Setup (iOS)

```bash
# Install command line tools
xcode-select --install

# Accept license
sudo xcodebuild -license accept

# Install iOS simulator (via Xcode)
# Open Xcode → Settings → Platforms → Download iOS Simulator
```

### Android Studio Setup

1. Open Android Studio
2. Go to Settings → Languages & Frameworks → Android SDK
3. Install:
   - Android SDK Platform (API 34 recommended)
   - Android SDK Build-Tools
   - Android Emulator
   - Intel HAXM (for Intel Macs) or configure for ARM

---

## Environment Setup

### 1. Shell Configuration

Add to `~/.zshrc` (or `~/.bash_profile`):

```bash
# Java
export JAVA_HOME=$(/usr/libexec/java_home)

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Optional: Increase Node memory for large builds
export NODE_OPTIONS="--max-old-space-size=8192"
```

Apply changes:
```bash
source ~/.zshrc
```

### 2. Verify Installation

```bash
# Check Node
node --version  # Should be v22+

# Check Java
java -version

# Check Android SDK
adb --version
emulator -list-avds

# Check Xcode
xcode-select -p
xcrun simctl list devices
```

### 3. Install Appium and Drivers

```bash
# Install Appium globally
npm install -g appium

# Verify installation
appium --version

# Install platform drivers
appium driver install uiautomator2  # Android
appium driver install xcuitest      # iOS

# Verify drivers
appium driver list --installed
```

### 4. iOS-Specific: WebDriverAgent Setup

For iOS testing, WebDriverAgent needs to be configured:

```bash
# Navigate to WebDriverAgent
cd ~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent

# Install dependencies
./Scripts/bootstrap.sh

# Open in Xcode to configure signing (first time only)
open WebDriverAgent.xcodeproj
```

In Xcode:
1. Select WebDriverAgentLib target → Signing & Capabilities
2. Set your Team (personal or organization)
3. Repeat for WebDriverAgentRunner target
4. Build once to verify (Cmd+B)

---

## Building Your Expo App for Testing

### Option A: Development Build (Recommended for Testing)

Development builds include React Native dev tools and are fastest for iteration.

#### iOS Development Build

```bash
# Generate native iOS project (first time)
npx expo prebuild --platform ios

# Build and run on simulator
npx expo run:ios

# Or specify a simulator
npx expo run:ios --device "iPhone 15 Pro"
```

**Build output location:**
```
ios/build/Build/Products/Debug-iphonesimulator/Fittmart.app
```

#### Android Development Build

```bash
# Generate native Android project (first time)
npx expo prebuild --platform android

# Build and run on emulator
npx expo run:android

# Or build APK without running
cd android && ./gradlew assembleDebug
```

**Build output location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Option B: EAS Build (For CI/CD or Physical Devices)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (first time)
eas build:configure

# Build for iOS simulator
eas build --profile development --platform ios

# Build for Android emulator
eas build --profile development --platform android
```

### Creating Test-Specific Build Profile

Add to `eas.json`:

```json
{
  "build": {
    "testing": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "APP_ENV": "testing"
      }
    }
  }
}
```

---

## Appium MCP Configuration

### 1. Add Appium MCP to Claude Code

**Quick method:**
```bash
claude mcp add appium-mcp -- npx -y appium-mcp@latest
```

**Manual method** - Create/edit `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "appium-mcp": {
      "command": "npx",
      "args": ["appium-mcp@latest"],
      "env": {
        "ANDROID_HOME": "/Users/YOUR_USERNAME/Library/Android/sdk",
        "CAPABILITIES_CONFIG": "/Users/YOUR_USERNAME/IdeaProjects/aluvex/appium-capabilities.json",
        "SCREENSHOTS_DIR": "/Users/YOUR_USERNAME/IdeaProjects/aluvex/test-screenshots"
      }
    }
  }
}
```

### 2. Create Capabilities Configuration

Create `appium-capabilities.json` in your project root:

```json
{
  "android": {
    "platformName": "Android",
    "appium:deviceName": "Pixel_7_API_34",
    "appium:platformVersion": "14",
    "appium:automationName": "UiAutomator2",
    "appium:app": "/Users/YOUR_USERNAME/IdeaProjects/aluvex/android/app/build/outputs/apk/debug/app-debug.apk",
    "appium:appPackage": "com.fittmart.app",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": false,
    "appium:fullReset": false,
    "appium:newCommandTimeout": 300,
    "appium:autoGrantPermissions": true
  },
  "ios": {
    "platformName": "iOS",
    "appium:deviceName": "iPhone 15 Pro",
    "appium:platformVersion": "17.4",
    "appium:automationName": "XCUITest",
    "appium:app": "/Users/YOUR_USERNAME/IdeaProjects/aluvex/ios/build/Build/Products/Debug-iphonesimulator/Fittmart.app",
    "appium:bundleId": "com.fittmart.app",
    "appium:noReset": false,
    "appium:fullReset": false,
    "appium:newCommandTimeout": 300,
    "appium:isHeadless": false,
    "appium:useNewWDA": false,
    "appium:wdaLaunchTimeout": 120000
  }
}
```

### 3. Create Screenshots Directory

```bash
mkdir -p test-screenshots
echo "test-screenshots/" >> .gitignore
```

### 4. Verify Configuration

Restart Claude Code and verify the MCP is loaded:
```bash
# In Claude Code, type:
/mcp
```

You should see `appium-mcp` listed as connected.

---

## Adding TestIDs to Components

TestIDs make element selection reliable. Add them to interactive elements.

### Basic Pattern

```tsx
// Before
<TouchableOpacity onPress={handleLogin}>
  <Text>Login</Text>
</TouchableOpacity>

// After
<TouchableOpacity
  testID="login-button"
  accessibilityLabel="Login to your account"
  onPress={handleLogin}
>
  <Text>Login</Text>
</TouchableOpacity>
```

### Naming Convention

Use kebab-case with component context:

```
screen-element-descriptor

Examples:
- login-phone-input
- login-submit-button
- home-product-card-{id}
- cart-item-quantity-{id}
- order-status-badge
```

### Common Components to Tag

```tsx
// Text Inputs
<TextInput
  testID="login-phone-input"
  accessibilityLabel="Phone number"
  placeholder="Enter phone number"
/>

// Buttons
<Pressable testID="login-submit-button">
  <Text>Continue</Text>
</Pressable>

// Lists (with dynamic IDs)
<FlashList
  data={products}
  renderItem={({ item }) => (
    <ProductCard
      testID={`product-card-${item.id}`}
      product={item}
    />
  )}
/>

// Navigation Elements
<TouchableOpacity testID="nav-cart-tab">
  <CartIcon />
</TouchableOpacity>

// Form Fields
<Controller
  name="quantity"
  render={({ field }) => (
    <TextInput
      testID="order-quantity-input"
      {...field}
    />
  )}
/>
```

### Screen-Level TestIDs

Add testIDs to screen containers for navigation verification:

```tsx
export default function LoginScreen() {
  return (
    <View testID="login-screen" style={styles.container}>
      {/* Screen content */}
    </View>
  );
}

export default function HomeScreen() {
  return (
    <View testID="home-screen" style={styles.container}>
      {/* Screen content */}
    </View>
  );
}
```

---

## Testing Workflow

### Starting a Test Session

1. **Start your simulator/emulator**

   ```bash
   # iOS Simulator
   open -a Simulator
   # Or via xcrun
   xcrun simctl boot "iPhone 15 Pro"

   # Android Emulator
   emulator -avd Pixel_7_API_34
   ```

2. **Build and install your app** (if not already done)

   ```bash
   # iOS
   npx expo run:ios

   # Android
   npx expo run:android
   ```

3. **Start Appium server** (in a separate terminal)

   ```bash
   appium
   # Should show: Appium REST http interface listener started on 0.0.0.0:4723
   ```

4. **In Claude Code, start a session**

   > "Start an Appium session on iOS simulator for testing the Fittmart app"

### Basic Test Commands

Once session is started, you can ask Claude to:

```
Navigation:
- "Take a screenshot of the current screen"
- "Get the page source to see all elements"
- "Find the login button and tap it"
- "Scroll down to find the checkout button"

Input:
- "Enter '9876543210' in the phone number field"
- "Clear the email input and type 'test@example.com'"

Verification:
- "Check if the submit button is enabled"
- "Verify the home screen is displayed"
- "Find all product cards on screen"

Complex Actions:
- "Navigate to the cart and verify item count"
- "Complete the login flow with phone 9876543210"
```

### Testing Against PRD

Point Claude to your specs:

> "Read the spec file at `.context/opus/specs/retailer-onboarding.md`, then test the complete retailer registration flow on iOS. Take screenshots at each step and verify the behavior matches the spec."

Claude will:
1. Read your specification
2. Navigate through the flow
3. Take screenshots at key points
4. Verify expected behavior
5. Report any discrepancies

---

## Common Testing Scenarios

### 1. Visual Layout Testing

```
"Take a screenshot of the product detail screen and analyze:
- Are all elements properly aligned?
- Is text readable and not truncated?
- Are images loading correctly?
- Is spacing consistent with Material Design guidelines?"
```

### 2. Form Validation Testing

```
"Test the registration form validation:
1. Submit with empty fields - verify error messages
2. Enter invalid phone format - verify error
3. Enter valid data - verify form submits"
```

### 3. Navigation Flow Testing

```
"Test the complete order flow:
1. From home, navigate to a product
2. Add to cart
3. Go to cart
4. Proceed to checkout
5. Verify order summary
Take screenshots at each step."
```

### 4. State Management Testing

```
"Test cart persistence:
1. Add 2 items to cart
2. Close the app
3. Reopen the app
4. Verify cart still has 2 items"
```

### 5. Error Handling Testing

```
"Test network error handling:
1. Enable airplane mode
2. Try to load products
3. Verify error message is displayed
4. Disable airplane mode
5. Pull to refresh
6. Verify products load"
```

### 6. Role-Based Access Testing

```
"Test retailer role restrictions:
1. Login as retailer (phone: 9876543210)
2. Verify admin menu is not visible
3. Try to navigate to /admin directly
4. Verify redirect to home"
```

---

## Troubleshooting

### Common Issues

#### 1. Appium Session Won't Start

**Symptoms:** Timeout when starting session

**Solutions:**
```bash
# Kill existing Appium processes
pkill -f appium

# Restart Appium with increased timeout
appium --session-override --relaxed-security

# Check if port 4723 is in use
lsof -i :4723
```

#### 2. iOS WebDriverAgent Issues

**Symptoms:** WDA build failures

**Solutions:**
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Re-run WebDriverAgent setup
cd ~/.appium/node_modules/appium-xcuitest-driver/node_modules/appium-webdriveragent
xcodebuild clean
./Scripts/bootstrap.sh
```

#### 3. Android Element Not Found

**Symptoms:** Elements visible but not found by testID

**Solutions:**
- Ensure `testID` is on the outermost touchable component
- Try using `accessibilityLabel` as fallback
- Use page source to verify actual element attributes

```tsx
// Sometimes wrapper is needed
<View testID="wrapper" accessible={true}>
  <TouchableOpacity>
    <Text>Button</Text>
  </TouchableOpacity>
</View>
```

#### 4. App Not Installing

**Symptoms:** App fails to install on device

**Solutions:**
```bash
# Android - clean and rebuild
cd android && ./gradlew clean && ./gradlew assembleDebug

# iOS - clean build folder
cd ios && xcodebuild clean && cd ..
npx expo run:ios
```

#### 5. Slow Test Execution

**Symptoms:** Tests taking too long

**Solutions:**
- Use `noReset: true` in capabilities to skip app reinstall
- Keep Appium server running between tests
- Use simulators instead of physical devices for faster iteration

### Debug Commands

```bash
# List connected Android devices
adb devices

# List iOS simulators
xcrun simctl list devices

# Check Appium logs
appium --log-level debug

# View real-time device logs
# iOS
xcrun simctl spawn booted log stream --level debug
# Android
adb logcat
```

### Useful Appium Inspector

For debugging element hierarchies, install Appium Inspector:

```bash
# Download from GitHub releases
# https://github.com/appium/appium-inspector/releases

# Or install via Homebrew (if available)
brew install --cask appium-inspector
```

Use it to:
- Inspect element hierarchies visually
- Find correct locator strategies
- Test element interactions manually

---

## Quick Reference

### Appium MCP Tools

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `start_session` | Start device session | "Start iOS session" |
| `end_session` | Close session | "End the current session" |
| `take_screenshot` | Capture screen | "Take a screenshot" |
| `get_page_source` | Get UI XML | "Show me the page source" |
| `find_element` | Locate element | "Find the login button" |
| `tap_element` | Tap on element | "Tap the submit button" |
| `enter_text` | Type into field | "Enter '12345' in phone input" |
| `scroll` | Scroll screen | "Scroll down" |
| `launch_app` | Launch by bundle ID | "Launch the app" |
| `boot_simulator` | Start iOS simulator | "Boot iPhone 15 Pro simulator" |

### TestID Cheat Sheet

```tsx
// Screens
testID="screen-name-screen"

// Buttons
testID="context-action-button"

// Inputs
testID="form-field-input"

// Lists
testID="list-name-list"

// List Items
testID={`item-type-${id}`}

// Cards
testID={`card-type-${id}`}

// Navigation
testID="nav-tab-name"
```

---

## Next Steps

1. **Set up the environment** following this guide
2. **Add testIDs** to your critical components
3. **Create a test plan** based on your PRD
4. **Run initial tests** on core user flows
5. **Iterate** based on discovered issues

For questions or issues, refer to:
- [Appium MCP GitHub](https://github.com/appium/appium-mcp)
- [Appium Documentation](https://appium.io/docs/en/latest/)
- [Expo Testing Guide](https://docs.expo.dev/develop/unit-testing/)
