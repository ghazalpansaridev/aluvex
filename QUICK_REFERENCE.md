# 🚀 iOS Build - Quick Reference

## Your iPhone UDID
```
00008120-0014758A0CF8A01E
```

## Build Command
```bash
npm run build:ios:dev
```

## After Build - Install Steps
1. Scan QR code with iPhone
2. Tap "Install"
3. Settings → General → Device Management → Trust
4. Launch Fittmart!

## Useful Commands
```bash
npm run build:ios:dev        # Build for iPhone
npm run device:list          # List devices
eas build:list              # Check build status
npm run update:dev "msg"     # Push JS updates
```

## Build Answers
- Use ghazalp account? → **Yes**
- Apple ID email? → **Your iCloud email**
- Apple ID password? → **Your password**
- Register devices? → **Yes**
- Device UDID? → **00008120-0014758A0CF8A01E**
- Generate certificate/profile? → **Yes**

## Important
- ⏰ Expires after 7 days
- 🔨 Build takes 15-20 minutes
- 🆓 Free with Apple ID
- 📱 Max 3 devices/week

## App Info
- **Name:** Fittmart
- **Bundle ID:** com.fittmart.app
- **Version:** 1.0.0
- **Account:** ghazalp
