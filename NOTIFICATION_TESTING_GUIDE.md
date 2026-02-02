# Notification System Testing Guide

## Current Status

✅ **Database**: notifications table exists, push_tokens table created
✅ **Bell Icon**: Implemented with badge
✅ **Notification Screens**: Created for all roles
✅ **Edge Function**: Deployed successfully
✅ **Code Integration**: Notification triggers added to order flow
✅ **Test Notification**: Successfully created (1 unread for operations user)

## Issues Found

### 1. Order Notification Not Created
**Problem**: When you placed order `ORD-20260202-51713`, no notification was created.

**Root Cause**: The notification code was added AFTER you placed the order. The app needs to be reloaded with the new code.

**Solution**: 
1. Stop the Expo dev server
2. Run `npm install` (to install expo-notifications and expo-device)
3. Clear Metro bundler cache: `npx expo start --clear`
4. Reload app on device
5. Place a NEW order to test

### 2. Push Notification Setup Error
**Error**: `No "projectId" found`

**Root Cause**: Expo Go requires explicit projectId for push notifications in development.

**Solution**: Already fixed in code. After `npm install`, this will work.

---

## Step-by-Step Testing Instructions

### Step 1: Install Dependencies & Restart

```bash
# Stop current Expo server (Ctrl+C)
npm install
npx expo start --clear
```

### Step 2: Test Bell Icon & Badge

**Expected Result**: 
- Bell icon appears above hamburger menu
- Badge shows "1" (from test notification we created)
- Red dot visible on bell icon

**How to Test**:
1. Open app as Operations user (user_id: `82a1eb1b-995e-4fe5-b2ed-0ca60d204651`)
2. Look at top right corner
3. You should see bell icon with badge showing "1"

**If badge doesn't show**:
- Check console for errors
- Verify you're logged in as the operations user
- Check network tab for Supabase query

### Step 3: Test Notifications Screen

**How to Test**:
1. Tap the bell icon
2. Should navigate to notifications screen
3. Should see 1 notification: "Test Notification"
4. Tap notification → should navigate to order details
5. Notification should be marked as read
6. Badge should disappear from bell icon

### Step 4: Test Order Placed Notification

**How to Test**:
1. Login as **Retailer** account
2. Add items to cart
3. Go to checkout
4. Place a NEW order
5. **Switch to Operations/Admin account**
6. Check bell icon → badge should show "1" (or "2" if test notification still unread)
7. Open notifications screen
8. Should see: "New Order Received - Order #ORD-XXXXXXX from [Business Name]"
9. Tap notification → should navigate to order details

**Debug if not working**:
```sql
-- Check if notification was created
SELECT * FROM notifications WHERE type = 'new_order' ORDER BY created_at DESC LIMIT 1;

-- Check if staff_users query works
SELECT user_id FROM staff_users WHERE role IN ('admin', 'operations') AND status = 'active';
```

### Step 5: Test Shipment Notification

**How to Test**:
1. Login as **Operations/Admin** account
2. Go to Orders → Select an order
3. Create a shipment
4. **Switch to Retailer account**
5. Check bell icon → should show badge
6. Open notifications
7. Should see: "Order Shipped - Your order #ORD-XXXXXXX has been shipped"
8. Tap notification → should navigate to order details

### Step 6: Test Cancel Order Notification

**How to Test**:
1. Login as **Operations/Admin** account
2. Go to Orders → Select an order
3. Cancel the order with a reason
4. **Switch to Retailer account**
5. Check bell icon → should show badge
6. Open notifications
7. Should see: "Order Cancelled - Order #ORD-XXXXXXX has been cancelled. Reason: [reason]"

### Step 7: Test Mark as Read

**How to Test**:
1. Have unread notifications
2. Tap a notification
3. It should be marked as read (background changes from gray to white)
4. Badge count should decrease
5. Switch to "Unread" tab → notification should disappear
6. Switch to "All" tab → notification should still be there but marked as read

### Step 8: Test Mark All as Read

**How to Test**:
1. Have multiple unread notifications
2. Tap "Mark all as read" button
3. All notifications should be marked as read
4. Badge should disappear from bell icon
5. "Unread" tab should be empty

### Step 9: Test Real-time Updates

**How to Test**:
1. Open notifications screen on one device/account
2. Use Supabase dashboard to insert a notification manually:

```sql
INSERT INTO notifications (user_id, type, title, body, data, is_read)
VALUES (
  'YOUR_USER_ID_HERE',
  'custom',
  'Real-time Test',
  'This should appear immediately',
  '{}'::jsonb,
  false
);
```

3. Notification should appear in the list immediately (no refresh needed)
4. Badge should update on bell icon

### Step 10: Test Push Notifications (Physical Device Only)

**Prerequisites**: 
- Must use physical device (iOS or Android)
- Must build a development build (not Expo Go) OR use EAS Build

**How to Test**:
1. Login on physical device
2. Grant notification permissions when prompted
3. Check database for push token:

```sql
SELECT * FROM push_tokens WHERE user_id = 'YOUR_USER_ID';
```

4. Send test push via Expo Push Tool: https://expo.dev/notifications
5. Use the expo_push_token from database
6. Notification should appear in system tray
7. Tap notification → app should open

---

## Common Issues & Solutions

### Issue 1: Bell Icon Not Showing
**Check**:
- Is GlobalDrawer being rendered?
- Is user logged in?
- Check console for errors in useNotifications hook

### Issue 2: Badge Shows Wrong Count
**Check**:
- Verify RLS policies allow user to read their notifications
- Check Supabase query in network tab
- Verify user_id matches between auth.users and notifications

### Issue 3: Notifications Not Created on Order
**Check**:
- Verify app code is reloaded (stop/start Expo)
- Check console for errors in createOrder function
- Verify staff_users table has active admin/ops users
- Check Edge Function logs

### Issue 4: Navigation Not Working
**Check**:
- Verify related_entity_type and related_entity_id in notification data
- Check route names match your app structure
- Verify user has permission to access the route

### Issue 5: Push Notifications Not Working
**Check**:
- Using physical device (not simulator for iOS)
- Permissions granted
- Push token saved to database
- Edge Function successfully calling Expo Push API
- Check Edge Function logs for errors

---

## Manual Testing Queries

### Insert Test Notification for Operations User
```sql
INSERT INTO notifications (user_id, type, title, body, data, is_read)
VALUES (
  '82a1eb1b-995e-4fe5-b2ed-0ca60d204651',
  'new_order',
  'Test Order Notification',
  'Order #ORD-TEST-12345 from Test Retailer',
  '{"related_entity_type": "order", "related_entity_id": "b16cf0c9-b000-41d4-b82f-ec24c9d316ae"}'::jsonb,
  false
);
```

### Insert Test Notification for Retailer
```sql
-- First get retailer's user_id
SELECT user_id FROM retailers WHERE id = '7fb70cd7-bb03-4cda-a1f6-c5c2448abadd';

-- Then insert notification (replace USER_ID)
INSERT INTO notifications (user_id, type, title, body, data, is_read)
VALUES (
  'RETAILER_USER_ID_HERE',
  'order_shipped',
  'Test Shipment Notification',
  'Your order #ORD-20260202-51713 has been shipped',
  '{"related_entity_type": "order", "related_entity_id": "b16cf0c9-b000-41d4-b82f-ec24c9d316ae"}'::jsonb,
  false
);
```

### Check Unread Count
```sql
SELECT COUNT(*) as unread_count 
FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
AND is_read = false;
```

### View All Notifications for User
```sql
SELECT id, type, title, body, is_read, created_at 
FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC;
```

### Clear All Notifications
```sql
DELETE FROM notifications WHERE user_id = 'YOUR_USER_ID';
```

---

## Next Steps

1. **Immediate**: Run `npm install` and restart Expo
2. **Test**: Place a new order and verify notification appears
3. **Test**: Create shipment and verify retailer gets notification
4. **Test**: All other notification types
5. **Build**: Create development build for push notification testing
6. **Implement**: Add notification triggers for:
   - Payment recording (when feature is built)
   - Retailer approval/rejection (when seller management is built)
   - New retailer registration (when registration flow is updated)

---

## Admin/Ops Users in Your Database

| Name | User ID | Role | Status |
|------|---------|------|--------|
| Jagdish Khaitan | c000d902-5fb9-4413-b5a2-71e6f80f06ee | operations | active |
| F L | 9c4b42a0-1ba9-4b84-9cd2-3684cb5c66c6 | operations | active |

Both should receive notifications when orders are placed.

---

## Debugging Commands

```bash
# View Edge Function logs
# (Use Supabase MCP or dashboard)

# Test Edge Function directly
curl -X POST 'https://pcbeiqmfjettsmpnhsxv.supabase.co/functions/v1/send-notification' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "82a1eb1b-995e-4fe5-b2ed-0ca60d204651",
    "type": "custom",
    "title": "Test from curl",
    "body": "Testing Edge Function"
  }'
```
