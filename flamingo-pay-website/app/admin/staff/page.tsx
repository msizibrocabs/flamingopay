"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminGate } from "../_components/AdminGate";
import { AdminNav } from "../_components/AdminNav";

type StaffMember = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "manager" | "staff";
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  deactivatedAt?: string;
};

export default function StaffPage() {
  return (
    <AdminGate requirePermission="manage_staff">
      <AdminNav />
      <Inner />
    </AdminGate>
  );
}

function Inner() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  async function fetchStaff() {
    try {
      const res = await fetch("/api/admin/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  return (
    <main className="min-h-dvh bg-flamingo-cream">
      <div className="mx-auto max-w-4xl px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display text-2xl font-extrabold text-flamingo-dark">
              Staff Management
            </h1>
            <p className="mt-1 text-sm text-flamingo-dark/60">
              Add employees, assign roles, control access
            </p>
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowAdd(true)}
            className="btn-pink rounded-2xl border-2 border-flamingo-dark px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide"
          >
            + Add staff
          </motion.button>
        </div>

        {/* Role legend */}
        <div className="mt-6 flex flex-wrap gap-3">
          <RoleBadge role="owner" label="Owner" desc="Full access + staff management" />
          <RoleBadge role="manager" label="Manager" desc="Approve merchants + compliance" />
          <RoleBadge role="staff" label="Staff" desc="View-only access" />
        </div>

        {/* Staff list */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-flamingo-dark/50">Loading staff…</div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-flamingo-dark/20 py-12 text-center text-flamingo-dark/50">
              No staff accounts yet. Add your first team member above.
            </div>
          ) : (
            staff.map(m => (
              <StaffCard key={m.id} member={m} onUpdate={fetchStaff} />
            ))
          )}
        </div>
      </div>

      {/* Add staff modal */}
      <AnimatePresence>
        {showAdd && (
          <AddStaffModal
            onClose={() => setShowAdd(false)}
            onCreated={() => { setShowAdd(false); fetchStaff(); }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── Components ───

function RoleBadge({ role, label, desc }: { role: string; label: string; desc: string }) {
  const colors: Record<string, string> = {
    owner: "bg-flamingo-pink text-white border-flamingo-pink-deep",
    manager: "bg-flamingo-butter text-flamingo-dark border-flamingo-dark/20",
    staff: "bg-white text-flamingo-dark border-flamingo-dark/20",
  };
  return (
    <div className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${colors[role] ?? colors.staff}`}>
      <span className="text-xs font-extrabold uppercase tracking-wider">{label}</span>
      <span className="text-xs opacity-70">{desc}</span>
    </div>
  );
}

function StaffCard({ member, onUpdate }: { member: StaffMember; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.role);
  const [saving, setSaving] = useState(false);

  const roleColors: Record<string, string> = {
    owner: "bg-flamingo-pink text-white",
    manager: "bg-flamingo-butter text-flamingo-dark",
    staff: "bg-flamingo-cream text-flamingo-dark",
  };

  async function updateRole() {
    setSaving(true);
    try {
      await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      onUpdate();
      setEditing(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function toggleActive() {
    setSaving(true);
    try {
      await fetch(`/api/admin/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !member.active }),
      });
      onUpdate();
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border-2 border-flamingo-dark bg-white p-4 shadow-[0_4px_0_0_#1A1A2E] ${!member.active ? "opacity-60" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border-2 border-flamingo-dark bg-flamingo-cream">
            <span className="text-sm font-extrabold text-flamingo-dark">
              {member.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-flamingo-dark">{member.name}</span>
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${roleColors[member.role]}`}>
                {member.role}
              </span>
              {!member.active && (
                <span className="rounded-lg bg-red-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                  Deactivated
                </span>
              )}
            </div>
            <p className="text-xs text-flamingo-dark/60">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg border border-flamingo-dark/20 px-2.5 py-1 text-xs font-bold text-flamingo-dark/70 hover:bg-flamingo-cream"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
              member.active
                ? "border-red-200 text-red-500 hover:bg-red-50"
                : "border-green-200 text-green-600 hover:bg-green-50"
            }`}
          >
            {member.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex items-end gap-3 border-t border-flamingo-dark/10 pt-4">
              <label className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-flamingo-dark/60">Role</span>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as typeof role)}
                  className="mt-1 block w-full rounded-lg border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2 text-sm font-bold text-flamingo-dark"
                >
                  <option value="owner">Owner</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </label>
              <button
                onClick={updateRole}
                disabled={saving || role === member.role}
                className="btn-pink rounded-xl border-2 border-flamingo-dark px-4 py-2 text-sm font-extrabold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save role"}
              </button>
            </div>

            <div className="mt-3 flex gap-4 text-[10px] text-flamingo-dark/50">
              <span>Joined: {new Date(member.createdAt).toLocaleDateString()}</span>
              {member.lastLoginAt && (
                <span>Last login: {new Date(member.lastLoginAt).toLocaleDateString()}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddStaffModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create staff member.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-flamingo-dark/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border-2 border-flamingo-dark bg-white p-6 shadow-[0_8px_0_0_#1A1A2E]"
      >
        <h2 className="display text-xl font-extrabold text-flamingo-dark">Add staff member</h2>
        <p className="mt-1 text-xs text-flamingo-dark/60">
          They&apos;ll use these credentials to sign into the admin console.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Full name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5 text-sm font-semibold text-flamingo-dark outline-none"
              placeholder="e.g. Thabo Mokoena"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5 text-sm font-semibold text-flamingo-dark outline-none"
              placeholder="thabo@flamingopay.co.za"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">Role</span>
            <select
              value={role}
              onChange={e => setRole(e.target.value as typeof role)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5 text-sm font-bold text-flamingo-dark"
            >
              <option value="manager">Manager — approve merchants + compliance</option>
              <option value="staff">Staff — view-only access</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-flamingo-dark/70">
              Temporary password
            </span>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-flamingo-dark bg-flamingo-cream px-3 py-2.5 text-sm font-semibold text-flamingo-dark outline-none"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
            <p className="mt-1 text-[10px] text-flamingo-dark/50">
              Share this with them securely. They can change it after signing in.
            </p>
          </label>

          {error && (
            <p className="rounded-lg bg-flamingo-pink-soft px-3 py-2 text-sm font-semibold text-flamingo-pink-deep">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border-2 border-flamingo-dark bg-white px-4 py-3 text-sm font-extrabold text-flamingo-dark shadow-[0_3px_0_0_#1A1A2E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-pink flex-1 rounded-2xl border-2 border-flamingo-dark px-4 py-3 text-sm font-extrabold uppercase tracking-wide disabled:opacity-70"
            >
              {loading ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
