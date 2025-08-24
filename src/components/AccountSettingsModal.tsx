import { useState } from 'react';
import { X, User, Lock, Settings, Save, Eye, EyeOff, Bell, Palette, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { changePassword, changeEmail, sendPasswordResetEmail } from '../services/authService';
import toast from 'react-hot-toast';

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'profile' | 'security' | 'preferences';

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { user, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: user?.fullName || '',
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: user?.email || '',
  });

  const [preferencesData, setPreferencesData] = useState({
    theme: user?.preferences?.theme || 'dark',
    language: user?.preferences?.language || 'en',
    emailNotifications: Boolean(user?.preferences?.notifications?.email ?? true),
    pushNotifications: Boolean(user?.preferences?.notifications?.push ?? true),
    marketingEmails: false,
    weeklyReports: true,
  });

  if (!isOpen || !user) return null;

  const handleProfileUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        fullName: `${profileData.firstName} ${profileData.lastName}`,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdating(true);
    try {
      await changePassword(securityData.currentPassword, securityData.newPassword);
      toast.success('Password updated successfully!');
      setSecurityData({
        ...securityData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async () => {
    if (securityData.newEmail === user.email) {
      toast.error('New email must be different from current email');
      return;
    }
    if (!securityData.currentPassword) {
      toast.error('Please enter your current password to change email');
      return;
    }

    setIsUpdating(true);
    try {
      await changeEmail(securityData.newEmail, securityData.currentPassword);
      toast.success('Email change request sent! Check your new email for verification.');
      setSecurityData({
        ...securityData,
        currentPassword: '',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change email';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsUpdating(true);
    try {
      await sendPasswordResetEmail(user.email);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send password reset email';
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateProfile({
        preferences: {
          theme: preferencesData.theme as 'light' | 'dark' | 'auto',
          language: preferencesData.language,
          notifications: {
            email: preferencesData.emailNotifications,
            push: preferencesData.pushNotifications,
          },
        },
      });
      toast.success('Preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Profile Information</h3>
                
                {/* User Info Display */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {user.firstName ? user.firstName[0] : user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white">{user.fullName}</h4>
                      <p className="text-gray-400">{user.email}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-0.5 rounded-full text-white font-bold">
                          {user.subscription.plan.toUpperCase()}
                        </span>
                        {!user.isEmailVerified && (
                          <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded-full text-white font-bold ml-2">
                            EMAIL NOT VERIFIED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>

                {/* Email Display */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">To change your email, use the Security tab</p>
                </div>

                {/* Update Button */}
                <button
                  onClick={handleProfileUpdate}
                  disabled={isUpdating}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdating ? 'Updating...' : 'Update Profile'}</span>
                </button>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Security Settings</h3>

                {/* Email Verification Status */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">Email Verification</h4>
                      <p className="text-gray-400 text-sm">
                        Status: {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${user.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  </div>
                </div>

                {/* Change Email Section */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-4">Change Email Address</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Current Email</label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">New Email</label>
                      <input
                        type="email"
                        value={securityData.newEmail}
                        onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                        placeholder="Enter new email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                      <input
                        type="password"
                        value={securityData.currentPassword}
                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                        placeholder="Enter your current password to confirm"
                      />
                    </div>
                    <button
                      onClick={handleEmailChange}
                      disabled={isUpdating || securityData.newEmail === user.email || !securityData.currentPassword}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Sending...' : 'Change Email'}
                    </button>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-4">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors pr-12"
                          placeholder="Enter your current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors pr-12"
                          placeholder="Enter new password (min 6 characters)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors pr-12"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePasswordChange}
                        disabled={isUpdating || !securityData.currentPassword || !securityData.newPassword || !securityData.confirmPassword}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Updating...' : 'Change Password'}
                      </button>
                      <button
                        onClick={handlePasswordReset}
                        disabled={isUpdating}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? 'Sending...' : 'Reset via Email'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">App Preferences</h3>

                {/* Theme Settings */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Theme
                  </h4>
                  <select
                    value={preferencesData.theme}
                    onChange={(e) => setPreferencesData({ ...preferencesData, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                {/* Language Settings */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Language
                  </h4>
                  <select
                    value={preferencesData.language}
                    onChange={(e) => setPreferencesData({ ...preferencesData, language: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                {/* Notification Settings */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-white font-medium mb-4 flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notifications
                  </h4>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-white">Email Notifications</span>
                      <input
                        type="checkbox"
                        checked={preferencesData.emailNotifications}
                        onChange={(e) => setPreferencesData({ ...preferencesData, emailNotifications: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white">Push Notifications</span>
                      <input
                        type="checkbox"
                        checked={preferencesData.pushNotifications}
                        onChange={(e) => setPreferencesData({ ...preferencesData, pushNotifications: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white">Marketing Emails</span>
                      <input
                        type="checkbox"
                        checked={preferencesData.marketingEmails}
                        onChange={(e) => setPreferencesData({ ...preferencesData, marketingEmails: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-white">Weekly Reports</span>
                      <input
                        type="checkbox"
                        checked={preferencesData.weeklyReports}
                        onChange={(e) => setPreferencesData({ ...preferencesData, weeklyReports: e.target.checked })}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Update Button */}
                <button
                  onClick={handlePreferencesUpdate}
                  disabled={isUpdating}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdating ? 'Updating...' : 'Update Preferences'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 