import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import supportTicketsApi from "../api/supportTicketsApi";
import { baseUrl } from "../constants/Constant";
import { getAuthToken } from "../utils/auth";
import toast from "react-hot-toast";
import { useSubscription } from "../hooks/useSubscription";
import { ReadOnlyTooltip } from "@/components/ui/read-only-tooltip";

async function fetchTenantHospitals() {
  const url = `${baseUrl}/hospitals/tenant`;
  const r = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
    },
  });
  if (!r.ok) throw new Error("Failed to load hospitals");
  return r.json();
}

export default function TenantAdminFaq() {
  const user = useSelector((s) => s.auth.user);
  const tenantId = user?.tenant_id;
  const qc = useQueryClient();
  const { isReadOnly } = useSubscription();
  const [hospitalId, setHospitalId] = useState("");
  const [faqForm, setFaqForm] = useState({ category: "General", question: "", answer: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const hospitalsQuery = useQuery({
    queryKey: ["tenant-hospitals"],
    queryFn: () => fetchTenantHospitals(),
    enabled: !!tenantId,
  });

  const hospitals = useMemo(() => {
    const raw = hospitalsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.hospitals) return raw.hospitals;
    return [];
  }, [hospitalsQuery.data]);

  const faqQuery = useQuery({
    queryKey: ["support-faqs", hospitalId],
    queryFn: () =>
      supportTicketsApi.listFaqs({
        hospitalId: hospitalId || undefined,
      }),
    enabled: !!hospitalId,
  });

  const createFaq = useMutation({
    mutationFn: () => supportTicketsApi.createFaq(faqForm, hospitalId),
    onSuccess: () => {
      toast.success("FAQ added successfully");
      setFaqForm({ question: "", answer: "", category: "General" });
      qc.invalidateQueries({ queryKey: ["support-faqs", hospitalId] });
    },
    onError: (e) => toast.error(e.message || "Failed to add FAQ"),
  });

  const deleteFaq = useMutation({
    mutationFn: (id) => supportTicketsApi.deleteFaq(id),
    onSuccess: () => {
      toast.success("FAQ deleted");
      setDeleteConfirm(null);
      qc.invalidateQueries({ queryKey: ["support-faqs", hospitalId] });
    },
    onError: (e) => toast.error(e.message || "Failed to delete FAQ"),
  });

  const groupedFaqs = useMemo(() => {
    const list = faqQuery.data || [];
    const map = new Map();
    list.forEach((f) => {
      const cat = f.category || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(f);
    });
    return map;
  }, [faqQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hospital FAQs</h2>
        <p className="text-sm text-gray-500">Manage FAQs for individual hospitals.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-full max-w-sm">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Select Hospital
          </label>
          <select
            className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm"
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            <option value="">-- Choose a hospital --</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name || h.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hospitalsQuery.isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {hospitalId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add FAQ Form */}
          <div className="lg:col-span-1 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800 h-fit shadow-sm">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">Add New FAQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm"
                  placeholder="e.g. Booking, Payment..."
                  value={faqForm.category}
                  onChange={(e) => setFaqForm((s) => ({ ...s, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm"
                  placeholder="Enter question"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm((s) => ({ ...s, question: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Answer</label>
                <textarea
                  className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm min-h-[100px]"
                  placeholder="Enter detailed answer"
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm((s) => ({ ...s, answer: e.target.value }))}
                />
              </div>
              <ReadOnlyTooltip isReadOnly={isReadOnly}>
                <button
                  type="button"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-2 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                  disabled={!faqForm.question || !faqForm.answer || createFaq.isPending || isReadOnly}
                  onClick={() => createFaq.mutate()}
                >
                  {createFaq.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {createFaq.isPending ? "Saving..." : "Save FAQ"}
                </button>
              </ReadOnlyTooltip>
            </div>
          </div>

          {/* List FAQs */}
          <div className="lg:col-span-2 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm min-h-[300px]">
            <h3 className="font-semibold text-lg mb-4 text-gray-900 dark:text-gray-100">Existing FAQs</h3>
            
            {(faqQuery.isLoading || faqQuery.isFetching) && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-sm text-gray-500">Loading FAQs...</p>
              </div>
            )}
            
            {!faqQuery.isLoading && !faqQuery.isFetching && groupedFaqs.size === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                <p>No FAQs found for this hospital.</p>
                <p className="text-sm mt-1">Add one using the form.</p>
              </div>
            )}
            
            {!faqQuery.isLoading && !faqQuery.isFetching && groupedFaqs.size > 0 && (
              <div className="space-y-6">
                {[...groupedFaqs.entries()].map(([category, items]) => (
                  <div key={category}>
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                      {category}
                    </h4>
                    <div className="space-y-3">
                      {items.map((i) => {
                        console.log("TenantAdminFaq Rendering FAQ item:", i.id, "delete visible?");
                        return (
                          <div key={i.id} className="group p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">{i.question}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{i.answer}</p>
                            </div>
                            <ReadOnlyTooltip isReadOnly={isReadOnly}>
                              <button
                                type="button"
                                disabled={isReadOnly || deleteFaq.isPending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("TenantAdminFaq Delete clicked for:", i.id);
                                  setDeleteConfirm(i);
                                }}
                                className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                title="Delete FAQ"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </ReadOnlyTooltip>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Global Delete Confirm Modal overlay */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !deleteFaq.isPending && setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Delete FAQ</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleteFaq.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (deleteConfirm) deleteFaq.mutate(deleteConfirm.id);
                }}
                disabled={deleteFaq.isPending}
                className="px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleteFaq.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
