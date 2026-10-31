"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const token = localStorage.getItem("cardioai_token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/patients", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          name,
          date_of_birth: dateOfBirth || null,
          sex: sex || null,
          phone: phone || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create patient.");
      }

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-6 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold">
            Add Patient
          </h1>

          <p className="mt-2 text-slate-400">
            Create a patient record before starting a cardiovascular assessment.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >

          {/* Patient Name */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Patient Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter patient name"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Date of Birth */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Date of Birth
            </label>

            <input
  type="text"
  value={dateOfBirth}
  onChange={(event) => setDateOfBirth(event.target.value)}
  placeholder="YYYY-MM-DD"
  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
/>
          </div>

          {/* Sex */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Sex
            </label>

            <select
              value={sex}
              onChange={(event) => setSex(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              <option value="">Select sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Phone */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Phone
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="flex-1 rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Patient"}
            </button>

          </div>

        </form>

      </div>
    </main>
  );
}