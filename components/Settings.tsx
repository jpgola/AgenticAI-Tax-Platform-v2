import React from 'react';
import { User } from '../types';
import { Button } from './Button';

interface SettingsProps {
  user: User;
}

export const Settings: React.FC<SettingsProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account preferences and notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Profile Information</h3>
            <div className="flex items-center gap-4 mb-6">
              <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full bg-slate-100" />
              <div>
                 <Button variant="outline" size="sm">Change Avatar</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  defaultValue={user.name}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  defaultValue={user.email}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button>Save Changes</Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Security</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="font-medium text-slate-700">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="border-t border-slate-100 my-2"></div>
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="font-medium text-slate-700">Password</p>
                        <p className="text-sm text-slate-500">Last changed 3 months ago.</p>
                    </div>
                    <Button variant="outline" size="sm">Update</Button>
                </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Notifications</h3>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="flex h-5 items-center">
                            <input id="comments" name="comments" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="comments" className="font-medium text-slate-700">Tax Updates</label>
                            <p className="text-slate-500">Get notified when IRS status changes.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="flex h-5 items-center">
                            <input id="candidates" name="candidates" type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="candidates" className="font-medium text-slate-700">Document Analysis</label>
                            <p className="text-slate-500">Alerts when AI finishes processing docs.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="flex h-5 items-center">
                            <input id="offers" name="offers" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="offers" className="font-medium text-slate-700">Marketing</label>
                            <p className="text-slate-500">Receive tips on how to save more.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                <p className="text-sm text-red-600 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                <Button variant="danger" size="sm">Delete Account</Button>
            </div>
        </div>
      </div>
    </div>
  );
};