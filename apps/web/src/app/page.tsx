"use client";

import React, { useState, useMemo } from "react";

interface Report {
  id: string;
  category: string;
  code: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  image: string;
  severity: number;
  priority: "P1 Critical" | "P2 Normal";
  submitter: string;
  aiScore: number;
  exifValidated: boolean;
  duplicateWarning?: string;
  slaText: string;
  slaBreach?: boolean;
  status: "SUBMITTED" | "UNDER REVIEW" | "APPROVED" | "IN PROGRESS" | "RESOLVED";
  featureDetection: string;
  authority: string;
  trustRatio: number;
  totalSubmitted: number;
  approvedCount: number;
  rejectedCount: number;
  remarks: string;
}

const INITIAL_REPORTS: Report[] = [
  {
    id: "1",
    category: "Broken Streetlight",
    code: "TRC-DEL-1108",
    description: "Entire junction light pole unseated with naked live terminals accessible to pedestrians.",
    location: "Mehrauli-Badarpur Rd, Saket Junction, New Delhi",
    latitude: 28.5244,
    longitude: 77.1855,
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    severity: 9.5,
    priority: "P1 Critical",
    submitter: "Karan Johar",
    aiScore: 94,
    exifValidated: true,
    slaText: "2.7h breach imminent",
    slaBreach: true,
    status: "SUBMITTED",
    featureDetection: "Exposed Electrical Conduit & Structural Fracture",
    authority: "State Electricity Transmission Board (@PowerDiscom)",
    trustRatio: 100,
    totalSubmitted: 2,
    approvedCount: 2,
    rejectedCount: 0,
    remarks: "Immediate life-safety hazard flagged."
  },
  {
    id: "2",
    category: "Drainage Issue",
    code: "TRC-DEL-1042",
    description: "Blocked subterranean stormwater drain producing backward blackwater surge onto arterial carriageway.",
    location: "Ring Rd Service Road, Rohini Sector 7, Delhi",
    latitude: 28.7041,
    longitude: 77.1025,
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80",
    severity: 8.7,
    priority: "P1 Critical",
    submitter: "Vikram Malhotra",
    aiScore: 99,
    exifValidated: true,
    slaText: "6.5h remaining",
    status: "APPROVED",
    featureDetection: "Severe Silt Clogging & Backwater Inundation",
    authority: "Municipal Water Supply & Sewerage Board",
    trustRatio: 100,
    totalSubmitted: 5,
    approvedCount: 5,
    rejectedCount: 0,
    remarks: "High priority drainage obstruction."
  },
  {
    id: "3",
    category: "Pothole",
    code: "TRC-DEL-0481",
    description: "Deep cavity in right lane after cloudburst. Heavy transit vehicles braking abruptly causing risk.",
    location: "Outer Circle, Near Shivaji Stadium, Connaught Place, New Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    severity: 9.2,
    priority: "P1 Critical",
    submitter: "Aakash Verma",
    aiScore: 96,
    exifValidated: true,
    slaText: "18.2h remaining",
    status: "UNDER REVIEW",
    featureDetection: "Asphalt Layer Degradation & Base Pit Exposure",
    authority: "Public Works Department (PWD Roads Division)",
    trustRatio: 100,
    totalSubmitted: 3,
    approvedCount: 3,
    rejectedCount: 0,
    remarks: "Arterial road traffic bottleneck hazard."
  },
  {
    id: "4",
    category: "Garbage Dump",
    code: "TRC-NOI-0924",
    description: "Municipal solid waste spillover across commercial sidewalk and preschool approach road.",
    location: "Block B Commercial Belt, Sector 18, Noida",
    latitude: 28.5355,
    longitude: 77.3910,
    image: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    severity: 8.1,
    priority: "P2 Normal",
    submitter: "Pooja Sharma",
    aiScore: 91,
    exifValidated: true,
    duplicateWarning: "Duplicate Match (35m)",
    slaText: "21.6h remaining",
    status: "SUBMITTED",
    featureDetection: "Illegal Open Bio-Waste Accumulation",
    authority: "Sanitation & Solid Waste Management Authority",
    trustRatio: 100,
    totalSubmitted: 1,
    approvedCount: 1,
    rejectedCount: 0,
    remarks: "Commercial sidewalk transit blocked."
  }
];

export default function TraceDashboard() {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [activeTab, setActiveTab] = useState<"queue" | "map" | "analytics">("queue");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [reviewModalReport, setReviewModalReport] = useState<Report | null>(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredReports = useMemo(() => {
    return reports.filter(item => {
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchQuery =
        searchQuery.trim() === "" ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchCategory && matchQuery;
    });
  }, [reports, statusFilter, selectedCategory, searchQuery]);

  const countTotal = reports.length;
  const countNeedsModeration = reports.filter(r => r.status === "SUBMITTED" || r.status === "UNDER REVIEW").length;
  const countActiveDispatched = reports.filter(r => r.status === "APPROVED" || r.status === "IN PROGRESS").length;
  const countResolved = reports.filter(r => r.status === "RESOLVED").length;

  const openReviewModal = (report: Report) => {
    setReviewModalReport(report);
    setRemarksInput(report.remarks);
    setRejectionReason("");
  };

  const handleApproveAndEnqueue = () => {
    if (!reviewModalReport) return;
    const targetId = reviewModalReport.id;
    setReports(prev =>
      prev.map(r => (r.id === targetId ? { ...r, status: "APPROVED", remarks: remarksInput } : r))
    );
    showToast(`✓ Incident ${reviewModalReport.code} approved! Escalation enqueued for ${reviewModalReport.authority}`);
    setReviewModalReport(null);
  };

  const handleReject = () => {
    if (!reviewModalReport) return;
    const targetId = reviewModalReport.id;
    setReports(prev => prev.filter(r => r.id !== targetId));
    showToast(`✕ Incident ${reviewModalReport.code} rejected: ${rejectionReason || "Criteria not met"}`);
    setReviewModalReport(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0b1320] text-white text-xs px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2">
          <span className="text-emerald-400 font-bold">●</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#0b1320] text-white px-8 py-3 flex items-center justify-between shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* EXACT MATCH TRACE PIN EYE LOGO */}
          <div className="h-11 w-11 rounded-2xl bg-[#162234] border border-slate-700/60 flex items-center justify-center p-2 shadow-inner">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* Outer Pin Outline */}
              <path
                d="M50 12C33.43 12 20 25.43 20 42C20 62 47 85 48.5 86.2C49.4 86.9 50.6 86.9 51.5 86.2C53 85 80 62 80 42C80 25.43 66.57 12 50 12Z"
                stroke="#ffffff"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Green Camera Eye */}
              <circle cx="50" cy="42" r="16" fill="#10b981" />
              {/* Lens Glint */}
              <circle cx="45" cy="37" r="4.5" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-wider text-white leading-none">TRACE</h1>
            <p className="text-[9px] font-bold text-emerald-400 tracking-widest uppercase mt-1">
              CAPTURE · VERIFY · TRACE · ACCOUNTABILITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5 bg-[#162234] p-1 rounded-xl border border-slate-700/40">
            <button
              onClick={() => setActiveTab("queue")}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                activeTab === "queue" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Prioritized Review Queue
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                activeTab === "map" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              City GIS Map
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                activeTab === "analytics" ? "bg-emerald-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              Compliance Analytics
            </button>
          </nav>

          <div className="flex items-center gap-2.5 bg-[#162234] px-3.5 py-1.5 rounded-xl border border-slate-700/50">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
              A
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Aditi (Admin)</p>
              <p className="text-[10px] text-slate-400">Authorized Municipal Moderator</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-7xl mx-auto p-8 space-y-6">
        {activeTab === "queue" && (
          <>
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div
                onClick={() => setStatusFilter("ALL")}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between h-28 cursor-pointer hover:border-slate-400 transition"
              >
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Queue Total</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-extrabold text-slate-900">{countTotal}</span>
                  <span className="text-xs text-slate-400 font-medium">Total reports</span>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("SUBMITTED")}
                className="bg-white rounded-2xl p-5 border-2 border-amber-200 shadow-sm flex flex-col justify-between h-28 cursor-pointer hover:bg-amber-50/40 transition"
              >
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Needs Moderation (SLA Active)
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-extrabold text-amber-600">{countNeedsModeration}</span>
                  <span className="text-xs text-amber-600 font-medium">Pending Decision</span>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("APPROVED")}
                className="bg-white rounded-2xl p-5 border border-blue-200 shadow-sm flex flex-col justify-between h-28 cursor-pointer hover:bg-blue-50/40 transition"
              >
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Active Dispatched</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-extrabold text-blue-600">{countActiveDispatched}</span>
                  <span className="text-xs text-blue-600 font-medium">Field Resolution</span>
                </div>
              </div>

              <div
                onClick={() => setStatusFilter("RESOLVED")}
                className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between h-28 cursor-pointer hover:bg-emerald-50/40 transition"
              >
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Verified Resolved</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-4xl font-extrabold text-emerald-600">{countResolved}</span>
                  <span className="text-xs text-emerald-600 font-medium">Closed & Audited</span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {["ALL", "SUBMITTED", "UNDER REVIEW", "APPROVED", "IN PROGRESS", "RESOLVED"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      statusFilter === tab ? "bg-[#0b1320] text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="w-80 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ID, category, coordinates..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl px-3.5 py-2.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Priority Model Info */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span>Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Broken Streetlight">Broken Streetlight</option>
                    <option value="Drainage Issue">Drainage Issue</option>
                    <option value="Pothole">Pothole</option>
                    <option value="Garbage Dump">Garbage Dump</option>
                  </select>
                </div>
              </div>
              <div>
                <span>Queue Priority Model: </span>
                <strong className="text-slate-700">Severity Score + Age (Oldest-First)</strong>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-4 px-4 w-10 text-center">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </th>
                    <th className="py-4 px-4">Live Evidence & Location</th>
                    <th className="py-4 px-4">Severity & Submitter</th>
                    <th className="py-4 px-4">AI Verification (TruFor)</th>
                    <th className="py-4 px-4">SLA Countdown</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredReports.map(report => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4 text-center">
                        <input type="checkbox" className="rounded border-slate-300" />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={report.image}
                              alt={report.category}
                              className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                            />
                            <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-bold shadow">
                              ✓
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{report.category}</span>
                              <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                                {report.code}
                              </span>
                            </div>
                            <p className="text-slate-500 line-clamp-1 mt-0.5 max-w-sm">{report.description}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                              📍 {report.location}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-sm">{report.severity}</span>
                          <span className="text-slate-400 text-[11px]">/ 10</span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              report.priority === "P1 Critical"
                                ? "bg-rose-100 text-rose-600"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {report.priority}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-1">
                          Submitter: <span className="font-medium text-slate-700">{report.submitter}</span>
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                          <span>✨ AI Verified: {report.aiScore}%</span>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-medium mt-1">✓ Live Camera EXIF Validated</p>
                        {report.duplicateWarning && (
                          <p className="text-[10px] text-amber-600 font-bold mt-0.5">⚠ {report.duplicateWarning}</p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${
                            report.slaBreach
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {report.slaText}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider ${
                            report.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : report.status === "APPROVED" || report.status === "IN PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => openReviewModal(report)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                        >
                          Side-by-Side Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Map Tab */}
        {activeTab === "map" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">City Spatial Geo-Grid</h2>
                <p className="text-xs text-slate-500">Live GPS telemetry from field citizen captures</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Spatial Clustering Active
              </span>
            </div>
            <div className="h-96 w-full rounded-xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-800">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="z-10 text-center space-y-3">
                <div className="inline-block p-4 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xl animate-pulse">
                  📍 4 Verified Coordinates Active
                </div>
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  <p>TRC-DEL-1108: 28.5244° N, 77.1855° E (Saket)</p>
                  <p>TRC-DEL-1042: 28.7041° N, 77.1025° E (Rohini)</p>
                  <p>TRC-DEL-0481: 28.6139° N, 77.2090° E (Connaught Place)</p>
                  <p>TRC-NOI-0924: 28.5355° N, 77.3910° E (Noida Sec 18)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">TruFor Tamper Detection Accuracy</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Camera Live Feed Validation</span>
                    <span className="text-emerald-600">98.4%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[98.4%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>EXIF Timestamp GPS Concordance</span>
                    <span className="text-emerald-600">94.1%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[94.1%]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Recaptured Screen Tampering Thwarted</span>
                    <span className="text-indigo-600">100%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[100%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Municipal Department SLA Speed</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Road Transport & Potholes (PWD)</span>
                  <span className="font-bold text-slate-900">4.2 hrs avg</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Electrical & Streetlights (MCD)</span>
                  <span className="font-bold text-slate-900">2.8 hrs avg</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Drainage & Flood Response</span>
                  <span className="font-bold text-slate-900">6.1 hrs avg</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Forensic Inspection Modal */}
      {reviewModalReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-7 overflow-y-auto space-y-6">
              {/* Left Image & Right Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-5 space-y-2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                    <img
                      src={reviewModalReport.image}
                      alt="Capture Evidence"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
                      <span>✨ AI Verified Genuine</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                    <span className="text-emerald-700 font-medium">✓ In-App Live Camera Only (Anti-Gallery Enforced)</span>
                    <button className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-0.5">
                      Inspect Full Resolution ↗
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-700 font-medium">
                      <strong>Feature Detection:</strong> {reviewModalReport.featureDetection}
                    </p>
                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        GPS Metadata: <strong className="text-emerald-600">LIVE MATCH</strong>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        Screenshot Check: <strong className="text-emerald-600">CLEAN LIVE CAPTURE</strong>
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      DUPLICATE PROXIMITY MATCH (100M RADIUS BUFFER)
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      No overlapping incidents within 150m spatial radius in the past 14 days.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      REVERSE GEOCODED LOCATION & COORDINATES
                    </h5>
                    <p className="text-xs text-slate-800 font-semibold mt-1">{reviewModalReport.location}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Latitude: {reviewModalReport.latitude.toFixed(4)}, Longitude: {reviewModalReport.longitude.toFixed(4)}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      SUBMITTER CREDIBILITY HISTORY
                    </h5>
                    <div className="grid grid-cols-4 text-xs font-semibold">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Total Submitted</span>
                        <span className="text-slate-800">{reviewModalReport.totalSubmitted}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Approved</span>
                        <span className="text-emerald-600">{reviewModalReport.approvedCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Rejected</span>
                        <span className="text-slate-600">{reviewModalReport.rejectedCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Trust Ratio</span>
                        <span className="text-emerald-600 font-bold">{reviewModalReport.trustRatio}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reassign Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Reassign Category:</label>
                  <select
                    value={reviewModalReport.category}
                    onChange={e =>
                      setReviewModalReport(prev => (prev ? { ...prev, category: e.target.value } : null))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  >
                    <option value="Broken Streetlight">Broken Streetlight</option>
                    <option value="Drainage Issue">Drainage Issue</option>
                    <option value="Pothole">Pothole</option>
                    <option value="Garbage Dump">Garbage Dump</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Reassign Authority:</label>
                  <select
                    value={reviewModalReport.authority}
                    onChange={e =>
                      setReviewModalReport(prev => (prev ? { ...prev, authority: e.target.value } : null))
                    }
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
                  >
                    <option value="State Electricity Transmission Board (@PowerDiscom)">
                      State Electricity Transmission Board (@PowerDiscom)
                    </option>
                    <option value="Municipal Water Supply & Sewerage Board">
                      Municipal Water Supply & Sewerage Board
                    </option>
                    <option value="Public Works Department (PWD Roads Division)">
                      Public Works Department (PWD Roads Division)
                    </option>
                    <option value="Sanitation & Solid Waste Management Authority">
                      Sanitation & Solid Waste Management Authority
                    </option>
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Add Internal Remarks:</label>
                <input
                  type="text"
                  value={remarksInput}
                  onChange={e => setRemarksInput(e.target.value)}
                  placeholder="Enter remarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Public Escalation Worker Banner */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <span className="text-blue-600 font-bold">☍</span>
                <span>
                  <strong>Public Escalation Worker:</strong> Approving this complaint enqueues a background Redis
                  worker to publish the complaint on X with coordinates and photo, tagging{" "}
                  <strong>@PowerDiscom</strong>.
                </span>
              </div>

              {/* Rejection Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rejection Reason (Required if rejecting):
                </label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter reason: Duplicate report, non-actionable image, outside municipal jurisdiction..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400"
                />
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      showToast("ℹ Notice requested from submitter.");
                      setReviewModalReport(null);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    Request More Info
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-4 py-2.5 rounded-xl transition"
                  >
                    Reject Complaint
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReviewModalReport(null)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-2 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveAndEnqueue}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                  >
                    <span>✓</span>
                    <span>Approve & Enqueue Public Post</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}