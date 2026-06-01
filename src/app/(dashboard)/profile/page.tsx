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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Manage your farmer account details
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className="mb-6 p-3 rounded-lg text-sm animate-fade-in"
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
          {message.text}
        </div>
      )}

      {/* Profile Card */}
      <div className="card">
        {/* Avatar Section */}
        <div className="flex items-center gap-4 mb-8 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              color: "white",
            }}
          >
            {user.full_name?.charAt(0).toUpperCase() || "F"}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {user.full_name}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-5">
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
            <label htmlFor="profile-email" className="input-label">
              Email Address
            </label>
            <input
              id="profile-email"
              type="email"
              className="input-field"
              value={user.email}
              disabled
              style={{ opacity: 0.5 }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Email cannot be changed
            </p>
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

          <div>
            <label htmlFor="profile-address" className="input-label">
              Address
            </label>
            <textarea
              id="profile-address"
              className="input-field"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your farm address"
              style={{ opacity: isEditing ? 1 : 0.7, resize: "vertical" }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  id="profile-save"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                  id="profile-cancel"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
                id="profile-edit"
              >
                Edit Profile
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
