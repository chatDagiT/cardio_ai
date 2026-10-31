"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Doctor = {
  id: number;
  name: string;
  email: string;
};

type Patient = {
  id: number;
  name: string;
  date_of_birth?: string;
  sex?: string;
  phone?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeDashboard() {
      const token = window.localStorage.getItem("cardioai_token");
      const doctorData = window.localStorage.getItem("cardioai_doctor");

      // No login information
      if (!token || !doctorData) {
        router.replace("/login");
        return;
      }

      let parsedDoctor: Doctor;

      // Read doctor information
      try {
        parsedDoctor = JSON.parse(doctorData);
      } catch {
        window.localStorage.removeItem("cardioai_doctor");
        window.localStorage.removeItem("cardioai_token");

        router.replace("/login");
        return;
      }

      // Load patients from backend
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/patients",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Token expired/invalid
        if (response.status === 401) {
          window.localStorage.removeItem("cardioai_token");
          window.localStorage.removeItem("cardioai_doctor");

          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load patients.");
        }

        const data = await response.json();

        setDoctor(parsedDoctor);
        setPatients(data.patients ?? []);
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, [router]);

  function logout() {
    window.localStorage.removeItem("cardioai_token");
    window.localStorage.removeItem("cardioai_doctor");

    router.replace("/login");
  }

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Cardio<span className="text-cyan-400">AI</span>
          </h1>

          <p className="mt-3 text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold">
              Cardio<span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-sm text-slate-400">
              Doctor Dashboard
            </p>
          </div>

          {/* Doctor information + logout */}
          <div className="flex items-center gap-5">
            {doctor && (
              <div className="hidden text-right sm:block">
                <p className="font-medium">
                  Dr. {doctor.name}
                </p>

                <p className="text-xs text-slate-400">
                  {doctor.email}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Page heading */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold">
            Dashboard
          </h2>

          <p className="mt-2 text-slate-400">
            Manage patients and cardiovascular assessments.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* Total patients */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Patients
            </p>

            <p className="mt-3 text-4xl font-bold">
              {patients.length}
            </p>
          </div>

          {/* Assessments */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Assessments
            </p>

            <p className="mt-3 text-4xl font-bold">
              —
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Assessment statistics coming soon
            </p>
          </div>

          {/* System status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              System Status
            </p>

            <p className="mt-3 font-semibold text-green-400">
              ● Online
            </p>
          </div>
        </div>

        {/* Patients */}
        <section className="mt-10">
          {/* Section heading */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">
                Patients
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Your registered patients
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/patients/new")}
              className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              + Add Patient
            </button>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              Loading patients...
            </div>
          ) : patients.length === 0 ? (
            /* No patients */
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
              <div className="text-4xl">
                👤
              </div>

              <h4 className="mt-4 text-lg font-semibold">
                No patients yet
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Add your first patient to begin an assessment.
              </p>

              <button
                type="button"
                onClick={() => router.push("/patients/new")}
                className="mt-6 rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Add First Patient
              </button>
            </div>
          ) : (
            /* Patient table */
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-800 bg-slate-950">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Patient
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Sex
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Date of Birth
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Phone
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {patients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="border-b border-slate-800 last:border-0 hover:bg-slate-800/50"
                      >
                        {/* Patient */}
                        <td className="px-6 py-5">
                          <p className="font-medium">
                            {patient.name}
                          </p>

                          <p className="text-xs text-slate-500">
                            Patient #{patient.id}
                          </p>
                        </td>

                        {/* Sex */}
                        <td className="px-6 py-5 text-slate-300">
                          {patient.sex || "—"}
                        </td>

                        {/* Date of birth */}
                        <td className="px-6 py-5 text-slate-300">
                          {patient.date_of_birth || "—"}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-5 text-slate-300">
                          {patient.phone || "—"}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/patients/${patient.id}/assessment`
                              )
                            }
                            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
                          >
                            Assessment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}