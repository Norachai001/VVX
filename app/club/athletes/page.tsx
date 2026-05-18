"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Athlete = {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  faculty: string;
  sport: string;
  position: string;
  experience: string;
  achievement: string;
  status: "pending" | "approved" | "rejected";
  submittedToStaff?: boolean;
};

const STATUS_LABEL = {
  pending: { label: "รอพิจารณา", className: "bg-yellow-100 text-yellow-800" },
  approved: { label: "ผ่านการคัดเลือก", className: "bg-green-100 text-green-800" },
  rejected: { label: "ไม่ผ่าน", className: "bg-red-100 text-red-800" },
};

export default function ClubAthletesPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Hardcoding club for demo, in real app extract from session/URL
  const CLUB_NAME = "ฟุตบอล";

  useEffect(() => {
    fetch(`/api/registrations?club=${encodeURIComponent(CLUB_NAME)}`)
      .then(res => res.json())
      .then(data => {
        if (data.registrations) {
          // Filter out ones already submitted to staff
          setAthletes(data.registrations.filter((a: Athlete) => !a.submittedToStaff));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = athletes.filter((a) => {
    const matchSearch = `${a.firstName || ''} ${a.lastName || ''} ${a.studentId || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, status: "approved" } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`/api/registrations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      setAthletes((prev) => prev.map((a) => (a.id === id ? { ...a, status: "rejected" } : a)));
    } catch (err) {
      console.error(err);
    }
  };

  const pendingCount = athletes.filter((a) => a.status === "pending").length;

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายชื่อนักกีฬา</h1>
            <p className="text-gray-500 text-sm mt-1">ชมรม{CLUB_NAME} — รอพิจารณา {pendingCount} คน</p>
          </div>
          <button
            onClick={() => router.push("/club/review")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            ส่งต่อกิจการนิสิต
          </button>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรือรหัสนิสิต..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="pending">รอพิจารณา</option>
            <option value="approved">ผ่านการคัดเลือก</option>
            <option value="rejected">ไม่ผ่าน</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
              ไม่พบรายชื่อนักกีฬา
            </div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{a.firstName || '-'} {a.lastName || '-'}</span>
                    <span className="text-gray-400 text-sm">#{a.studentId || '-'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL[a.status]?.className}`}>
                      {STATUS_LABEL[a.status]?.label}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>{a.faculty || '-'} — {a.sport} ({a.position})</p>
                    <p>ประสบการณ์: {a.experience}</p>
                    {a.achievement && <p>ผลงาน: {a.achievement}</p>}
                  </div>
                </div>
                {a.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleReject(a.id)} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors">ไม่ผ่าน</button>
                    <button onClick={() => handleApprove(a.id)} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition-colors">ผ่าน</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}