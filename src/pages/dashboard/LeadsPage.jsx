import React, { useState, useEffect } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { Download, Inbox, User, Mail, Phone, Calendar, MessageSquare } from "lucide-react";

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await api.get("/leads");
        if (res.data?.success) {
          setLeads(res.data.leads || []);
        }
      } catch (err) {
        console.error("Error fetching leads:", err);
        toast.error("Failed to load leads list.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  const downloadCSV = () => {
    if (leads.length === 0) {
      toast.error("No leads available to download.");
      return;
    }

    const headers = ["Name", "Email", "Phone", "Message", "Submitted At"];
    const rows = leads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "—",
      lead.message || "—",
      new Date(lead.createdAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QrFolio_My_Leads_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Downloaded Successfully!");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            My Leads
          </h1>
          <p className="mt-2 text-slate-400">
            View, manage, and download inquiries captured from your public digital business card.
          </p>
        </div>
        <div>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-400"
          >
            <Download className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* STATS SECTION */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/10 text-primary-400">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Total Leads Captured
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {leads.length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-xl backdrop-blur">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
            Fetching your leads list...
          </div>
        ) : leads.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Inbox className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white">No leads captured yet</p>
            <p className="mt-1 text-sm text-slate-500">
              When visitors submit details on your public card, they will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Visitor</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Submitted Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leads.map((lead) => (
                  <tr key={lead._id} className="transition hover:bg-white/5">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                          <User className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-white">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 max-w-md">
                      <div className="flex items-start gap-2 text-sm text-slate-300">
                        <MessageSquare className="h-4 w-4 text-slate-500 mt-1 shrink-0" />
                        <span className="break-words leading-relaxed whitespace-pre-wrap">
                          {lead.message || <em className="text-slate-500">No message left</em>}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsPage;
