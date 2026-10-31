"use client";

import { ChangeEvent, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

type ValidationError = {
  type: string;
  column: string;
  count: number;
  message: string;
};

type ValidationResult = {
  valid: boolean;
  message: string;
  filename: string;
  rows: number;
  columns: string[];
  required_columns: string[];
  missing_columns: string[];
  extra_columns: string[];
  target_distribution: Record<string, number>;
  errors: ValidationError[];
  preview: Record<string, unknown>[];
};

const MODEL_FEATURES = [
  "age",
  "sex",
  "cp",
  "trestbps",
  "chol",
  "fbs",
  "restecg",
  "thalach",
  "exang",
  "oldpeak",
  "slope",
  "ca",
  "thal",
];

export default function AdminModelPage() {
  const [file, setFile] =
    useState<File | null>(null);

  const [result, setResult] =
    useState<ValidationResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setError("");
    setResult(null);

    const selectedFile =
      event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setError(
        "Please select a CSV file."
      );

      setFile(null);

      return;
    }

    setFile(selectedFile);
  }

  async function validateCsv() {
    if (!file) {
      setError(
        "Please select a CSV file first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          `${API_URL}/admin/model/validate-csv`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "CSV validation failed."
        );
      }

      setResult(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        {/* Header */}

        <div className="mb-8">

          <p className="mb-2 text-sm font-medium text-cyan-400">
            ADMIN • MODEL MANAGEMENT
          </p>

          <h1 className="text-3xl font-bold">
            Cardiovascular Model
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Upload a cardiovascular dataset
            and validate it before using it
            for model training.
          </p>

        </div>

        {/* Warning */}

        <div className="mb-8 rounded-xl border border-amber-900/60 bg-amber-950/30 p-5">

          <h2 className="font-semibold text-amber-300">
            Training data management
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-200/80">
            This page is for model administration.
            It is separate from doctor patient
            assessments. Uploading a CSV here
            does not change the current model yet.
          </p>

        </div>

        {/* Upload */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

          <h2 className="text-xl font-bold">
            Upload Dataset
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Select a CSV file containing the
            13 model features and a target column.
          </p>

          {/* Required columns */}

          <div className="mt-6">

            <p className="mb-3 text-sm font-medium text-slate-300">
              Required columns
            </p>

            <div className="flex flex-wrap gap-2">

              {MODEL_FEATURES.map(
                (feature) => (
                  <span
                    key={feature}
                    className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300"
                  >
                    {feature}
                  </span>
                )
              )}

              <span className="rounded-md border border-cyan-800 bg-cyan-950/40 px-3 py-1.5 text-xs text-cyan-300">
                target
              </span>

            </div>

          </div>

          {/* File input */}

          <div className="mt-8">

            <label className="mb-2 block text-sm font-medium">
              CSV Dataset
            </label>

            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
            />

          </div>

          {/* Selected file */}

          {file && (

            <div className="mt-5 rounded-lg border border-slate-700 bg-slate-950 p-4">

              <p className="text-sm text-slate-400">
                Selected file
              </p>

              <p className="mt-1 font-semibold">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>

            </div>

          )}

          {/* Error */}

          {error && (

            <div className="mt-5 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>

          )}

          {/* Button */}

          <button
            type="button"
            onClick={validateCsv}
            disabled={!file || loading}
            className="mt-6 w-full rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Validating CSV..."
              : "Validate Dataset"}
          </button>

        </section>

        {/* Validation result */}

        {result && (

          <section className="mt-8">

            <div
              className={`rounded-2xl border p-6 ${
                result.valid
                  ? "border-green-900/60 bg-green-950/20"
                  : "border-red-900/60 bg-red-950/20"
              }`}
            >

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-xl font-bold">
                    {result.valid
                      ? "Dataset is valid"
                      : "Dataset has errors"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    {result.message}
                  </p>

                </div>

                <span
                  className={`rounded-full px-4 py-2 text-sm font-bold ${
                    result.valid
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {result.valid
                    ? "READY"
                    : "INVALID"}
                </span>

              </div>

            </div>

            {/* Statistics */}

            <div className="mt-5 grid gap-5 md:grid-cols-3">

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                <p className="text-sm text-slate-500">
                  Dataset rows
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.rows}
                </p>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                <p className="text-sm text-slate-500">
                  Columns
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.columns.length}
                </p>

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                <p className="text-sm text-slate-500">
                  Validation errors
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {result.errors.length}
                </p>

              </div>

            </div>

            {/* Target distribution */}

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-6">

              <h3 className="font-bold">
                Target Distribution
              </h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                <div className="rounded-lg bg-slate-950 p-4">

                  <p className="text-sm text-slate-500">
                    Target 0
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {result.target_distribution["0"] ??
                      0}
                  </p>

                </div>

                <div className="rounded-lg bg-slate-950 p-4">

                  <p className="text-sm text-slate-500">
                    Target 1
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {result.target_distribution["1"] ??
                      0}
                  </p>

                </div>

              </div>

            </div>

            {/* Missing columns */}

            {result.missing_columns.length >
              0 && (

              <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/20 p-6">

                <h3 className="font-bold text-red-300">
                  Missing columns
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">

                  {result.missing_columns.map(
                    (column) => (
                      <span
                        key={column}
                        className="rounded-md bg-red-950 px-3 py-1.5 text-xs text-red-300"
                      >
                        {column}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}

            {/* Extra columns */}

            {result.extra_columns.length >
              0 && (

              <div className="mt-5 rounded-xl border border-amber-900/60 bg-amber-950/20 p-6">

                <h3 className="font-bold text-amber-300">
                  Extra columns
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">

                  {result.extra_columns.map(
                    (column) => (
                      <span
                        key={column}
                        className="rounded-md bg-amber-950 px-3 py-1.5 text-xs text-amber-300"
                      >
                        {column}
                      </span>
                    )
                  )}

                </div>

              </div>

            )}

            {/* Errors */}

            {result.errors.length >
              0 && (

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="font-bold">
                  Validation Errors
                </h3>

                <div className="mt-4 space-y-3">

                  {result.errors.map(
                    (item, index) => (

                      <div
                        key={`${item.column}-${index}`}
                        className="rounded-lg border border-red-900/50 bg-red-950/20 p-4"
                      >

                        <p className="font-semibold text-red-300">
                          {item.column}
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          {item.message}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* Preview */}

            {result.preview.length >
              0 && (

              <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="font-bold">
                  Dataset Preview
                </h3>

                <div className="mt-4 overflow-x-auto">

                  <table className="min-w-full text-left text-sm">

                    <thead>

                      <tr className="border-b border-slate-800">

                        {result.required_columns.map(
                          (column) => (

                            <th
                              key={column}
                              className="whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                              {column}
                            </th>

                          )
                        )}

                      </tr>

                    </thead>

                    <tbody>

                      {result.preview.map(
                        (row, rowIndex) => (

                          <tr
                            key={rowIndex}
                            className="border-b border-slate-800/60"
                          >

                            {result.required_columns.map(
                              (column) => (

                                <td
                                  key={column}
                                  className="whitespace-nowrap px-3 py-3 text-slate-300"
                                >
                                  {String(
                                    row[column] ?? ""
                                  )}
                                </td>

                              )
                            )}

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            )}

          </section>

        )}

      </div>

    </main>
  );
}