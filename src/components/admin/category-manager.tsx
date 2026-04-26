"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  _count: { images: number };
  parent: { name: string } | null;
}

interface AdminCategoryManagerProps {
  initialCategories: Category[];
}

export function AdminCategoryManager({ initialCategories }: AdminCategoryManagerProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const parentCategories = categories.filter((c) => !c.parentId);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc || undefined,
          parentId: newParentId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
        setCreating(false);
        setNewName("");
        setNewDesc("");
        setNewParentId("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (slug: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await fetch(`/api/categories/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      router.refresh();
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this category? Images in this category will be affected.")) return;
    setLoading(true);
    try {
      await fetch(`/api/categories/${slug}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)} className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-4 space-y-3">
          <h3 className="font-semibold text-neutral-900">New Category</h3>
          <Input
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">Parent Category</label>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">None (top-level)</option>
              {parentCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} loading={loading} size="sm">Create</Button>
            <Button variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Categories table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Parent</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Images</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-neutral-50/50">
                <td className="px-4 py-3">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 px-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(cat.slug)}
                        className="h-7 w-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-7 w-7 rounded-lg bg-neutral-50 text-neutral-500 flex items-center justify-center hover:bg-neutral-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-medium text-neutral-900">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{cat.slug}</td>
                <td className="px-4 py-3 text-neutral-500">{cat.parent?.name ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{cat._count.images}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.slug)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
