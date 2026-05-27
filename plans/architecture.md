# Architecture & Mobile Strategy

## Core Philosophy
- **Single App, Multiple Identities:** The app identifies the user (Parent, Teacher, Admin, etc.) strictly via their registered phone number.
- **Mobile-First (Android/iOS):** Designed for Capacitor/Cordova wrapping. UI elements must respect safe areas and touch targets.

## Technical Stack
- **Frontend:** Vanilla JS (Modularized), Tailwind CSS.
- **Persistence:** LocalStorage (Session) -> Firebase (Production).
- **Security:** OTP-based stateless authentication.

## View Hierarchy
- `Splash`: Initial branding and loading.
- `Auth`: Phone input and OTP verification.
- `Router`: Dynamic shell selection based on `user.role`.