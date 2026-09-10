# Zootic - Pet Meal Tracker

Arabic RTL mobile app for tracking animal meals and setting reminder notifications.

## Core Features
- Register animals (type, name, photo from camera/gallery)
- Log meals: animal, meal type, meal date, next meal date
- Set reminder minutes before next meal - schedules real local notification
- Filters: All / Today / Upcoming
- Add / Edit / Delete records
- Separate Animals directory page
- Fully Arabic RTL interface with Cairo font
- Zootic store link banner on home (opens zoo-tic.com)

## Storage
- All data stored locally via AsyncStorage (no backend, no auth)

## Notifications
- expo-notifications with local DATE trigger
- Automatically requests permission on first launch
- Reminder canceled + rescheduled on edit; canceled on delete

## Tech
- Expo Router (tabs + modal presentation)
- react-native-safe-area-context
- @react-native-community/datetimepicker
- expo-image-picker
- @react-native-vector-icons/ionicons
- I18nManager.forceRTL(true)
