# Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter your project name (e.g., "clothingds-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Click on "Email/Password"
5. Enable "Email/Password" and click "Save"

## 3. Set Up Firestore Database

1. In your Firebase project console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" for development (you can secure it later)
4. Select a location for your database
5. Click "Done"

## 4. Get Your Firebase Configuration

1. In your Firebase project console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon `</>`
4. Register your app with a nickname (e.g., "ClothingDS Web")
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## 5. Update Environment Variables

Create a `.env` file in your project root and add your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 6. Security Rules (Optional for Production)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 7. Test Your Setup

1. Start your development server: `npm run dev`
2. Try creating a new account
3. Check Firebase Console > Authentication to see the new user
4. Check Firestore to see the user document created

## Troubleshooting

- If you see "Firebase not configured" errors, double-check your environment variables
- Make sure all environment variables start with `VITE_` for Vite to include them
- Restart your development server after changing environment variables 