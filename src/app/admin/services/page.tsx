"use client";

import { useState, useEffect, useCallback } from "react";

interface EcosystemService {
  id: string;
  icon: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  url: string;
  categories: string[];
  comingSoon: boolean;
  order: number;
}

const ALL_CATEGORIES = ["earn", "play", "build", "vote"];

const EMPTY_SERVICE: EcosystemService = {
  id: "",
  icon: "\uD83D\uDD17",
  nameKo: "",
  nameEn: "",
  descKo: "",
  descEn: "",
  url: "",
  categories: [],
  comingSoon: false,
  order: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<EcosystemService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingService, setEditingService] = useState<EcosystemService | null>(null);
  const [dirty, setDirty] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      setServices(data);
    } catch (e) {
      console.error("Failed to load services", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(services),
      });
      if (res.ok) {
        setDirty(false);
        alert("Saved!");
      } else {
        alert("Save failed");
      }
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    const newService: EcosystemService = {
      ...EMPTY_SERVICE,
      id: `service-${Date.now()}`,
      order: services.length,
    };
    setEditingService(newService);
  };

  const handleEditSave = (updated: EcosystemService) => {
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
    setEditingService(null);
    setDirty(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this service?")) return;
    setServices((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
    setDirty(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= services.length) return;
    setServices((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Ecosystem Services Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Manage services shown on /explore</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              + Add Service
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dirty
                  ? "bg-cyan-600 text-white hover:bg-cyan-500"
                  : "bg-white/5 text-gray-600 cursor-not-allowed"
              }`}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {dirty && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-yellow-900/30 border border-yellow-700/40 text-yellow-300 text-sm">
            Unsaved changes
          </div>
        )}

        {/* Table */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-left">
                <th className="px-4 py-3 w-12">#</th>
                <th className="px-4 py-3 w-12">Icon</th>
                <th className="px-4 py-3">Name (KO)</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3 w-24">Status</th>
                <th className="px-4 py-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, i) => (
                <tr key={service.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-3 text-xl">{service.icon}</td>
                  <td className="px-4 py-3 font-medium">{service.nameKo || service.nameEn}</td>
                  <td className="px-4 py-3">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline truncate block max-w-[200px]"
                    >
                      {service.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {service.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-gray-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {service.comingSoon ? (
                      <span className="text-yellow-500 text-xs font-medium">Coming Soon</span>
                    ) : (
                      <span className="text-green-500 text-xs font-medium">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleMove(i, "up")}
                        disabled={i === 0}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => handleMove(i, "down")}
                        disabled={i === services.length - 1}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        &#9660;
                      </button>
                      <button
                        onClick={() => setEditingService({ ...service })}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                        title="Edit"
                      >
                        &#9998;
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1 rounded hover:bg-red-900/30 text-gray-400 hover:text-red-400"
                        title="Delete"
                      >
                        &#10005;
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No services. Click &quot;+ Add Service&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingService && (
        <EditModal
          service={editingService}
          onSave={handleEditSave}
          onCancel={() => setEditingService(null)}
        />
      )}
    </div>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────

function EditModal({
  service,
  onSave,
  onCancel,
}: {
  service: EcosystemService;
  onSave: (s: EcosystemService) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EcosystemService>(service);

  const update = <K extends keyof EcosystemService>(key: K, value: EcosystemService[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
      >
        <h2 className="text-lg font-bold mb-6">
          {service.nameKo || service.nameEn ? "Edit Service" : "Add Service"}
        </h2>

        {/* Icon */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">Icon (emoji)</span>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => update("icon", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {/* Name KO */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">Name (KO)</span>
          <input
            type="text"
            value={form.nameKo}
            onChange={(e) => update("nameKo", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {/* Name EN */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">Name (EN)</span>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => update("nameEn", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {/* Desc KO */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">Description (KO)</span>
          <textarea
            value={form.descKo}
            onChange={(e) => update("descKo", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none resize-none"
          />
        </label>

        {/* Desc EN */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">Description (EN)</span>
          <textarea
            value={form.descEn}
            onChange={(e) => update("descEn", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none resize-none"
          />
        </label>

        {/* URL */}
        <label className="block mb-4">
          <span className="text-sm text-gray-400 mb-1 block">URL</span>
          <input
            type="text"
            value={form.url}
            onChange={(e) => update("url", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:border-cyan-500 focus:outline-none"
          />
        </label>

        {/* Categories */}
        <div className="mb-4">
          <span className="text-sm text-gray-400 mb-2 block">Categories</span>
          <div className="flex gap-2 flex-wrap">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  form.categories.includes(cat)
                    ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/40"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.comingSoon}
            onChange={(e) => update("comingSoon", e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 accent-cyan-500"
          />
          <span className="text-sm text-gray-300">Coming Soon</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 text-sm font-medium"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
