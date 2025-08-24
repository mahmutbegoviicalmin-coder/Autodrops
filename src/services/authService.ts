import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignIn,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, LoginCredentials, RegisterCredentials } from '../contexts/AuthContext';

// Convert Firebase user to our User type
export const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Get additional user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    firstName: userData?.firstName || firebaseUser.displayName?.split(' ')[0] || '',
    lastName: userData?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
    fullName: firebaseUser.displayName || `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
    avatar: firebaseUser.photoURL || '',
    isEmailVerified: firebaseUser.emailVerified,
    subscription: userData?.subscription || {
      plan: 'free',
      status: 'active',
    },
    preferences: userData?.preferences || {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        push: true,
      },
    },
    lastLogin: new Date().toISOString(),
    createdAt: userData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Sign up with email and password
export const signUpWithEmailAndPassword = async (credentials: RegisterCredentials): Promise<User> => {
  try {
    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );

    // Update the user's display name
    await updateProfile(firebaseUser, {
      displayName: `${credentials.firstName} ${credentials.lastName}`,
    });

    // Save additional user data to Firestore
    const userData = {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      email: credentials.email,
      subscription: {
        plan: 'free',
        status: 'active',
      },
      preferences: {
        theme: 'dark',
        language: 'en',
        notifications: {
          email: true,
          push: true,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Send email verification
    await sendEmailVerification(firebaseUser);

    return mapFirebaseUserToUser(firebaseUser);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Sign in with email and password
export const signInWithEmailAndPassword = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const { user: firebaseUser } = await firebaseSignIn(
      auth,
      credentials.email,
      credentials.password
    );

    // Update last login time in Firestore
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return mapFirebaseUserToUser(firebaseUser);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    // Update Firestore document
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(doc(db, 'users', userId), updateData);

    // Update Firebase Auth profile if needed
    if (auth.currentUser && (data.firstName || data.lastName)) {
      const displayName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
      if (displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
    }
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Change user password
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update password
    await updatePassword(auth.currentUser, newPassword);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Change user email
export const changeEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Re-authenticate user with current password
    const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update email
    await updateEmail(auth.currentUser, newEmail);

    // Send verification email to new address
    await sendEmailVerification(auth.currentUser);

    // Update user document in Firestore
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      email: newEmail,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    const provider = new GoogleAuthProvider();
    // Request additional permissions
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Create or update user document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // New user - create user document
      const nameParts = user.displayName?.split(' ') || ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await setDoc(userDocRef, {
        firstName,
        lastName,
        email: user.email,
        subscription: {
          plan: 'free',
          status: 'active',
        },
        preferences: {
          theme: 'dark',
          language: 'en',
          notifications: {
            email: true,
            push: true,
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: 'google',
      });
    } else {
      // Existing user - update last login
      await updateDoc(userDocRef, {
        updatedAt: new Date().toISOString(),
      });
    }

    return user;
  } catch (error) {
    const authError = error as AuthError;
    throw new Error(getAuthErrorMessage(authError.code));
  }
};

// Convert Firebase auth error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-email':
      return 'Please enter a valid email address';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/invalid-credential':
      return 'Invalid credentials. Please check your email and password';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled';
    case 'auth/popup-blocked':
      return 'Popup was blocked by the browser. Please allow popups and try again';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open';
    case 'auth/unauthorized-domain':
      return 'Unauthorized domain. Add your domain (e.g., localhost) under Firebase Console > Authentication > Settings > Authorized domains';
    case 'auth/operation-not-supported-in-this-environment':
      return 'This sign-in method is not supported in your environment. Try a different browser or disable popup/cookie blockers';
    case 'auth/operation-not-allowed':
      return 'Sign-in provider not enabled. Enable Google provider under Firebase Console > Authentication > Sign-in method';
    case 'auth/configuration-not-found':
      return 'Google Sign-In not configured. Make sure Google provider is enabled and your Firebase web app config (.env) is set';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method';
    default:
      return 'An error occurred. Please try again';
  }
}; 