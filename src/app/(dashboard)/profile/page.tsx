"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await api.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
        address: address || undefined,
      });
      await refreshUser();
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone || "");
    setAddress(user?.address || "");
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Profile</h1>
        <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
          Manage your farmer account details and personal preferences
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className="mb-6 p-4 rounded-xl text-sm font-medium animate-fade-in flex items-center gap-2"
          style={{
            background:
              message.type === "success"
                ? "rgba(102, 187, 106, 0.1)"
                : "rgba(239, 83, 80, 0.1)",
            border:
              message.type === "success"
                ? "1px solid rgba(102, 187, 106, 0.3)"
                : "1px solid rgba(239, 83, 80, 0.3)",
            color:
              message.type === "success"
                ? "var(--color-success)"
                : "var(--color-error)",
          }}
        >
          {message.type === "success" ? "✅" : "⚠️"} {message.text}
        </div>
      )}

      {/* 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Overview Card */}
        <div className="col-span-1">
          <div className="card overflow-hidden sticky top-6">
            <div 
              className="h-24 -mt-6 -mx-6 mb-6" 
              style={{
                background: "linear-gradient(135deg, rgba(64, 145, 108, 0.2), rgba(212, 163, 115, 0.2))",
                borderBottom: "1px solid var(--border)"
              }}
            />
            <div className="flex flex-col items-center text-center -mt-16 mb-6">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg mb-4 border-4 border-[var(--surface)]"
                style={{
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                  color: "white",
                }}
              >
                {user.full_name?.charAt(0).toUpperCase() || "F"}
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {user.full_name}
              </h2>
              <p className="text-sm font-medium mt-1" style={{ color: "var(--color-primary-light)" }}>
                {user.email}
              </p>
            </div>
            
            <div className="space-y-4 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Member Since
                </p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {new Date(user.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Account Role
                </p>
                <span className="badge badge-success text-xs px-2 py-1">Farm Owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form Card */}
        <div className="col-span-1 md:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-8 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-lg font-bold text-[var(--foreground)]">Personal Information</h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-ghost btn-sm"
                  id="profile-edit"
                  style={{ color: "var(--color-primary-light)" }}
                >
                  ✏️ Edit Details
                </button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="profile-name" className="input-label">
                    Full Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    className="input-field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    required
                    style={{ opacity: isEditing ? 1 : 0.7 }}
                  />
                </div>

                <div>
                  <label htmlFor="profile-phone" className="input-label">
                    Phone Number
                  </label>
                  <input
                    id="profile-phone"
                    type="tel"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                    style={{ opacity: isEditing ? 1 : 0.7 }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="profile-email" className="input-label">
                  Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="input-field max-w-md"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.5 }}
                />
                <p
                  className="text-xs mt-2 font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Email address cannot be changed. Contact support for assistance.
                </p>
              </div>

              <div>
                <label htmlFor="profile-address" className="input-label">
                  Farm Address
                </label>
                <textarea
                  id="profile-address"
                  className="input-field"
                  rows={4}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Enter your full farm address"
                  style={{ opacity: isEditing ? 1 : 0.7, resize: "vertical" }}
                />
              </div>

              {/* Action buttons */}
              {isEditing && (
                <div className="flex items-center gap-4 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary px-8"
                    id="profile-save"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-ghost"
                    id="profile-cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
