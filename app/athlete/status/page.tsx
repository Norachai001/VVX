"use client";

import { useEffect, useState } from "react";

export default function AthleteStatusPage() {
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<any>(null);

  useEffect(() => {
    fetch("/api/registrations")
      .then((res) => res.json())
      .then((data) => {
        setRegistration(data.registration);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <h2 className="text-xl font-medium text-gray-900 mb-2">ไม่พบข้อมูลการสมัคร</h2>
          <p className="text-gray-500 text-sm">คุณยังไม่ได้ลงทะเบียนเป็นนักกีฬา</p>
        </div>
      </div>
    );
  }

  const isPending = registration.status === "pending";
  const isApproved = registration.status === "approved";
  const isRejected = registration.status === "rejected";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">สถานะการสมัคร</h1>
          <p className="text-gray-500 text-sm mt-1">ติดตามผลการพิจารณาของชมรม</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          {isPending && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⏳</span>
              </div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">อยู่ระหว่างการพิจารณา</h2>
              <p className="text-gray-500 text-sm">ชมรมกำลังตรวจสอบข้อมูลของคุณ กรุณารอการแจ้งผล</p>
            </>
          )}
          {isApproved && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-lg font-medium text-green-700 mb-1">อนุมัติแล้ว</h2>
              <p className="text-gray-500 text-sm">ยินดีด้วย! คุณได้รับการอนุมัติเป็นนักกีฬาแล้ว</p>
            </>
          )}
          {isRejected && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-lg font-medium text-red-700 mb-1">ไม่อนุมัติ</h2>
              <p className="text-gray-500 text-sm">เสียใจด้วย คุณไม่ผ่านการพิจารณา</p>
            </>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">ข้อมูลที่ส่งไป</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-gray-500">กีฬา</p>
              <p className="font-medium">{registration.sport}</p>
            </div>
            <div>
              <p className="text-gray-500">ตำแหน่ง</p>
              <p className="font-medium">{registration.position}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">ประสบการณ์</p>
              <p className="font-medium">{registration.experience}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}