"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Assessment = {
  id: number;
  patient_id?: number;

  age: number;
  sex: number;
  cp: number;

  trestbps: number;
  chol: number;

  fbs: number;
  restecg: number;

  thalach: number;
  exang: number;

  oldpeak: number;

  slope: number;
  ca: number;
  thal: number;

  prediction?: number;
  probability?: number;

  risk_score?: number;
  risk_level?: string;

  created_at: string;
};


type Patient = {
  id: number;
  name: string;
};


type Analysis = {
  prediction: number;
  probability: number;
  risk_score?: number;
  risk_level?: string;
  prototype: boolean;
};


type AssessmentResponse = {
  message?: string;
  detail?: string;

  assessment?: Assessment;

  analysis?: Analysis;
};


/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL =
  "http://127.0.0.1:8000";


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export default function AssessmentPage() {

  const params = useParams();

  const router = useRouter();

  const patientId =
    String(params.id);


  /*
  |--------------------------------------------------------------------------
  | PATIENT
  |--------------------------------------------------------------------------
  */

  const [patient, setPatient] =
    useState<Patient | null>(null);

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);


  /*
  |--------------------------------------------------------------------------
  | MODEL INPUTS
  |--------------------------------------------------------------------------
  */

  const [age, setAge] =
    useState("");

  const [sex, setSex] =
    useState("");

  const [cp, setCp] =
    useState("");

  const [trestbps, setTrestbps] =
    useState("");

  const [chol, setChol] =
    useState("");

  const [fbs, setFbs] =
    useState("");

  const [restecg, setRestecg] =
    useState("");

  const [thalach, setThalach] =
    useState("");

  const [exang, setExang] =
    useState("");

  const [oldpeak, setOldpeak] =
    useState("");

  const [slope, setSlope] =
    useState("");

  const [ca, setCa] =
    useState("");

  const [thal, setThal] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | UI STATE
  |--------------------------------------------------------------------------
  */

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  function logout() {

    window.localStorage.removeItem(
      "cardioai_token"
    );

    window.localStorage.removeItem(
      "cardioai_doctor"
    );

    router.replace("/login");
  }


  /*
  |--------------------------------------------------------------------------
  | LOAD PATIENT + HISTORY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let cancelled = false;


    async function loadData() {

      const token =
        window.localStorage.getItem(
          "cardioai_token"
        );


      if (!token) {

        router.replace("/login");

        return;
      }


      try {

        setLoading(true);

        setError("");


        /*
        |--------------------------------------------------------------------------
        | Load patients
        |--------------------------------------------------------------------------
        */

        const patientsResponse =
          await fetch(
            `${API_URL}/patients`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        if (
          patientsResponse.status === 401
        ) {

          logout();

          return;
        }


        const patientsData =
          await patientsResponse.json();


        if (!patientsResponse.ok) {

          throw new Error(
            patientsData.detail ||
              "Failed to load patients."
          );
        }


        const foundPatient =
          patientsData.patients?.find(
            (item: Patient) =>
              String(item.id) ===
              patientId
          );


        if (!foundPatient) {

          throw new Error(
            "Patient not found."
          );
        }


        /*
        |--------------------------------------------------------------------------
        | Load assessment history
        |--------------------------------------------------------------------------
        */

        const assessmentsResponse =
          await fetch(
            `${API_URL}/patients/${patientId}/assessments`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        if (
          assessmentsResponse.status ===
          401
        ) {

          logout();

          return;
        }


        const assessmentsData =
          await assessmentsResponse.json();


        if (!assessmentsResponse.ok) {

          throw new Error(
            assessmentsData.detail ||
              "Failed to load assessment history."
          );
        }


        if (cancelled) {
          return;
        }


        setPatient(foundPatient);

        setAssessments(
          assessmentsData.assessments ?? []
        );


      } catch (err) {

        if (cancelled) {
          return;
        }


        if (err instanceof Error) {

          setError(err.message);

        } else {

          setError(
            "Failed to load patient data."
          );
        }


      } finally {

        if (!cancelled) {

          setLoading(false);
        }
      }
    }


    loadData();


    return () => {

      cancelled = true;
    };

  }, [patientId, router]);


  /*
  |--------------------------------------------------------------------------
  | SUBMIT ASSESSMENT
  |--------------------------------------------------------------------------
  */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();


    setError("");

    setAnalysis(null);


    const token =
      window.localStorage.getItem(
        "cardioai_token"
      );


    if (!token) {

      router.replace("/login");

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | Validate fields
    |--------------------------------------------------------------------------
    */

    if (
      age === "" ||
      sex === "" ||
      cp === "" ||
      trestbps === "" ||
      chol === "" ||
      fbs === "" ||
      restecg === "" ||
      thalach === "" ||
      exang === "" ||
      oldpeak === "" ||
      slope === "" ||
      ca === "" ||
      thal === ""
    ) {

      setError(
        "Please complete all 13 assessment fields."
      );

      return;
    }


    setSaving(true);


    try {

      /*
      |--------------------------------------------------------------------------
      | Send exactly the 13 model features
      |--------------------------------------------------------------------------
      */

      const response =
        await fetch(
          `${API_URL}/patients/${patientId}/assessments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({

              age:
                Number(age),

              sex:
                Number(sex),

              cp:
                Number(cp),

              trestbps:
                Number(trestbps),

              chol:
                Number(chol),

              fbs:
                Number(fbs),

              restecg:
                Number(restecg),

              thalach:
                Number(thalach),

              exang:
                Number(exang),

              oldpeak:
                Number(oldpeak),

              slope:
                Number(slope),

              ca:
                Number(ca),

              thal:
                Number(thal),

            }),
          }
        );


      const data: AssessmentResponse =
        await response.json();


      /*
      |--------------------------------------------------------------------------
      | Authentication error
      |--------------------------------------------------------------------------
      */

      if (
        response.status === 401
      ) {

        logout();

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Backend error
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {

        throw new Error(
          data.detail ||
            data.message ||
            "Failed to save assessment."
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Add assessment to history
      |--------------------------------------------------------------------------
      */

      if (data.assessment) {

        setAssessments(
          (current) => [
            data.assessment as Assessment,
            ...current,
          ]
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Show model result
      |--------------------------------------------------------------------------
      */

      if (data.analysis) {

        setAnalysis(
          data.analysis
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Clear form
      |--------------------------------------------------------------------------
      */

      setAge("");
      setSex("");
      setCp("");
      setTrestbps("");
      setChol("");
      setFbs("");
      setRestecg("");
      setThalach("");
      setExang("");
      setOldpeak("");
      setSlope("");
      setCa("");
      setThal("");


    } catch (err) {

      if (err instanceof Error) {

        setError(
          err.message
        );

      } else {

        setError(
          "Something went wrong."
        );
      }


    } finally {

      setSaving(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | DATE
  |--------------------------------------------------------------------------
  */

  function formatDate(
    date: string
  ) {

    const parsedDate =
      new Date(date);


    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {

      return date;
    }


    return parsedDate.toLocaleString();
  }


  /*
  |--------------------------------------------------------------------------
  | RISK LEVEL
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | riskLevel can be undefined.
  |
  | Therefore:
  |
  | String(riskLevel ?? "")
  |
  | prevents:
  |
  | Cannot read properties of undefined
  | (reading 'toLowerCase')
  |
  |--------------------------------------------------------------------------
  */

  function getRiskLevel(
    riskLevel?: string,
    probability?: number
  ) {

    const level =
      String(
        riskLevel ?? ""
      ).toLowerCase();


    if (
      level === "high"
    ) {

      return "high";
    }


    if (
      level === "moderate" ||
      level === "medium"
    ) {

      return "moderate";
    }


    if (
      level === "low"
    ) {

      return "low";
    }


    /*
    |--------------------------------------------------------------------------
    | Fallback based on probability
    |--------------------------------------------------------------------------
    */

    if (
      typeof probability ===
        "number"
    ) {

      if (
        probability < 0.30
      ) {

        return "low";
      }


      if (
        probability < 0.70
      ) {

        return "moderate";
      }


      return "high";
    }


    return "unknown";
  }


  /*
  |--------------------------------------------------------------------------
  | RISK COLOR
  |--------------------------------------------------------------------------
  */

  function getRiskClasses(
    riskLevel?: string,
    probability?: number
  ) {

    const level =
      getRiskLevel(
        riskLevel,
        probability
      );


    if (level === "low") {

      return {

        container:
          "border-green-700/60 bg-green-950/30",

        label:
          "text-green-400",

        value:
          "text-green-300",

        dot:
          "bg-green-500",

      };
    }


    if (level === "moderate") {

      return {

        container:
          "border-yellow-700/60 bg-yellow-950/30",

        label:
          "text-yellow-400",

        value:
          "text-yellow-300",

        dot:
          "bg-yellow-400",

      };
    }


    if (level === "high") {

      return {

        container:
          "border-red-700/60 bg-red-950/30",

        label:
          "text-red-400",

        value:
          "text-red-300",

        dot:
          "bg-red-500",

      };
    }


    return {

      container:
        "border-slate-700 bg-slate-900",

      label:
        "text-slate-400",

      value:
        "text-white",

      dot:
        "bg-slate-500",

    };
  }


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

        <div className="mx-auto max-w-5xl">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">

            Loading patient data...

          </div>

        </div>

      </main>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (

    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

      <div className="mx-auto max-w-5xl">


        {/* Back */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/dashboard"
            )
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >

          ← Back to Dashboard

        </button>


        {/* Header */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold">

            Cardiovascular Assessment

          </h1>


          <p className="mt-2 text-slate-400">

            {patient
              ? `${patient.name} • Patient #${patient.id}`
              : `Patient #${patientId}`}

          </p>

        </div>


        {/* Error */}

        {error && (

          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">

            {error}

          </div>

        )}


        {/* =====================================================
            MODEL RESULT
        ====================================================== */}

        {analysis && (

          <section className="mb-8">


            <div className="mb-5">

              <h2 className="text-2xl font-bold">

                Cardiovascular Risk Assessment

              </h2>


              <p className="mt-1 text-sm text-slate-400">

                Result generated by the trained
                cardiovascular logistic-regression model.

              </p>

            </div>


            {(() => {

              const classes =
                getRiskClasses(
                  analysis.risk_level,
                  analysis.probability
                );


              const probability =
                Math.max(
                  0,
                  Math.min(
                    1,
                    analysis.probability
                  )
                );


              const percentage =
                (
                  probability * 100
                ).toFixed(1);


              const riskLevel =
                getRiskLevel(
                  analysis.risk_level,
                  analysis.probability
                );


              return (

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8">


                  {/* =================================================
                      TRAFFIC LIGHT
                  ================================================== */}

                  <div className="flex flex-col items-center">


                    <p className="mb-5 text-sm font-medium uppercase tracking-wider text-slate-400">

                      Model Risk Indicator

                    </p>


                    <div className="flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950 px-5 py-3">


                      {/* GREEN */}

                      <div
                        className={`h-5 w-5 rounded-full ${
                          riskLevel === "low"
                            ? "bg-green-500 shadow-lg shadow-green-500/50"
                            : "bg-slate-700"
                        }`}
                      />


                      {/* YELLOW */}

                      <div
                        className={`h-5 w-5 rounded-full ${
                          riskLevel === "moderate"
                            ? "bg-yellow-400 shadow-lg shadow-yellow-400/50"
                            : "bg-slate-700"
                        }`}
                      />


                      {/* RED */}

                      <div
                        className={`h-5 w-5 rounded-full ${
                          riskLevel === "high"
                            ? "bg-red-500 shadow-lg shadow-red-500/50"
                            : "bg-slate-700"
                        }`}
                      />

                    </div>


                    {/* Risk label */}

                    <div
                      className={`mt-6 w-full max-w-md rounded-2xl border p-6 text-center ${classes.container}`}
                    >

                      <p
                        className={`text-sm font-medium ${classes.label}`}
                      >

                        Risk Level

                      </p>


                      <p
                        className={`mt-2 text-4xl font-bold capitalize ${classes.value}`}
                      >

                        {riskLevel}

                      </p>


                      <p className="mt-3 text-sm text-slate-400">

                        Model probability

                      </p>


                      <p className="mt-1 text-3xl font-bold text-white">

                        {percentage}%

                      </p>

                    </div>

                  </div>


                  {/* =================================================
                      PREDICTION
                  ================================================== */}

                  <div className="mt-8 grid gap-5 md:grid-cols-2">


                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                      <p className="text-sm text-slate-400">

                        Model Prediction

                      </p>


                      <p className="mt-3 text-3xl font-bold text-cyan-400">

                        {analysis.prediction === 1
                          ? "Positive"
                          : "Negative"}

                      </p>

                    </div>


                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                      <p className="text-sm text-slate-400">

                        Model Probability

                      </p>


                      <p className="mt-3 text-3xl font-bold text-cyan-400">

                        {percentage}%

                      </p>

                    </div>


                  </div>


                  {/* Disclaimer */}

                  <div className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">

                    <p className="text-sm leading-6 text-amber-300">

                      Research/educational prototype only.
                      This machine-learning result is not
                      a medical diagnosis and must not replace
                      professional clinical judgment.

                    </p>

                  </div>

                </div>

              );

            })()}

          </section>

        )}


        {/* =====================================================
            NEW ASSESSMENT
        ====================================================== */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">


          <div className="mb-8">

            <h2 className="text-xl font-bold">

              New Assessment

            </h2>


            <p className="mt-1 text-sm text-slate-400">

              Enter the 13 features required by the
              trained cardiovascular model.

            </p>

          </div>


          <form onSubmit={handleSubmit}>


            <div className="grid gap-6 md:grid-cols-2">


              {/* AGE */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Age

                </label>


                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) =>
                    setAge(
                      e.target.value
                    )
                  }
                  required
                  placeholder="e.g. 45"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />

              </div>


              {/* SEX */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Sex

                </label>


                <select
                  value={sex}
                  onChange={(e) =>
                    setSex(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select sex

                  </option>


                  <option value="1">

                    Male

                  </option>


                  <option value="0">

                    Female

                  </option>

                </select>

              </div>


              {/* CP */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Chest Pain Type

                </label>


                <select
                  value={cp}
                  onChange={(e) =>
                    setCp(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select chest pain type

                  </option>


                  <option value="0">

                    0 — Typical Angina

                  </option>


                  <option value="1">

                    1 — Atypical Angina

                  </option>


                  <option value="2">

                    2 — Non-anginal Pain

                  </option>


                  <option value="3">

                    3 — Asymptomatic

                  </option>

                </select>

              </div>


              {/* RESTING BP */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Resting Blood Pressure

                </label>


                <input
                  type="number"
                  min="50"
                  max="300"
                  value={trestbps}
                  onChange={(e) =>
                    setTrestbps(
                      e.target.value
                    )
                  }
                  required
                  placeholder="e.g. 130"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />


                <p className="mt-1 text-xs text-slate-500">

                  mmHg

                </p>

              </div>


              {/* CHOLESTEROL */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Cholesterol

                </label>


                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={chol}
                  onChange={(e) =>
                    setChol(
                      e.target.value
                    )
                  }
                  required
                  placeholder="e.g. 200"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />


                <p className="mt-1 text-xs text-slate-500">

                  mg/dL

                </p>

              </div>


              {/* FBS */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Fasting Blood Sugar

                </label>


                <select
                  value={fbs}
                  onChange={(e) =>
                    setFbs(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">

                    No — ≤ 120 mg/dL

                  </option>


                  <option value="1">

                    Yes — &gt; 120 mg/dL

                  </option>

                </select>

              </div>


              {/* REST ECG */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Resting ECG

                </label>


                <select
                  value={restecg}
                  onChange={(e) =>
                    setRestecg(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">

                    0 — Normal

                  </option>


                  <option value="1">

                    1 — ST-T Wave Abnormality

                  </option>


                  <option value="2">

                    2 — Left Ventricular Hypertrophy

                  </option>

                </select>

              </div>


              {/* MAX HEART RATE */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Maximum Heart Rate

                </label>


                <input
                  type="number"
                  min="40"
                  max="250"
                  value={thalach}
                  onChange={(e) =>
                    setThalach(
                      e.target.value
                    )
                  }
                  required
                  placeholder="e.g. 150"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />

              </div>


              {/* EXANG */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Exercise-Induced Angina

                </label>


                <select
                  value={exang}
                  onChange={(e) =>
                    setExang(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">

                    No

                  </option>


                  <option value="1">

                    Yes

                  </option>

                </select>

              </div>


              {/* OLDPEAK */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  ST Depression (Oldpeak)

                </label>


                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={oldpeak}
                  onChange={(e) =>
                    setOldpeak(
                      e.target.value
                    )
                  }
                  required
                  placeholder="e.g. 1.0"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                />

              </div>


              {/* SLOPE */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  ST Segment Slope

                </label>


                <select
                  value={slope}
                  onChange={(e) =>
                    setSlope(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">

                    0 — Upsloping

                  </option>


                  <option value="1">

                    1 — Flat

                  </option>


                  <option value="2">

                    2 — Downsloping

                  </option>

                </select>

              </div>


              {/* CA */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Major Vessels (CA)

                </label>


                <select
                  value={ca}
                  onChange={(e) =>
                    setCa(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">0</option>

                  <option value="1">1</option>

                  <option value="2">2</option>

                  <option value="3">3</option>

                </select>

              </div>


              {/* THAL */}

              <div>

                <label className="mb-2 block text-sm font-medium">

                  Thalassemia

                </label>


                <select
                  value={thal}
                  onChange={(e) =>
                    setThal(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >

                  <option value="">

                    Select

                  </option>


                  <option value="0">

                    0

                  </option>


                  <option value="1">

                    1

                  </option>


                  <option value="2">

                    2 — Normal

                  </option>


                  <option value="3">

                    3 — Reversible Defect

                  </option>

                </select>

              </div>

            </div>


            {/* MODEL INFORMATION */}

            <div className="mt-8 rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-5">

              <h3 className="font-semibold text-cyan-300">

                Model Information

              </h3>


              <p className="mt-2 text-sm leading-6 text-slate-400">

                This assessment sends exactly the
                13 features used by the trained
                cardiovascular logistic-regression
                model.

              </p>


              <p className="mt-3 text-xs leading-5 text-slate-500">

                age • sex • chest pain type • resting
                blood pressure • cholesterol • fasting
                blood sugar • resting ECG • maximum
                heart rate • exercise-induced angina •
                ST depression • ST slope • major vessels
                • thalassemia

              </p>

            </div>


            {/* DISCLAIMER */}

            <div className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">

              <p className="text-sm text-amber-300">

                Research prototype only.
                This system does not provide a
                medical diagnosis.

              </p>

            </div>


            {/* BUTTONS */}

            <div className="mt-8 flex gap-4">


              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
                className="flex-1 rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:bg-slate-800"
              >

                Cancel

              </button>


              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {saving
                  ? "Running Model..."
                  : "Run Risk Assessment"}

              </button>

            </div>

          </form>

        </section>


        {/* =====================================================
            HISTORY
        ====================================================== */}

        <section className="mt-10">


          <div className="mb-5">

            <h2 className="text-2xl font-bold">

              Assessment History

            </h2>


            <p className="mt-1 text-sm text-slate-400">

              Previous cardiovascular assessments
              for this patient.

            </p>

          </div>


          {assessments.length === 0 ? (

            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center">

              <p className="text-slate-400">

                No previous assessments.

              </p>

            </div>

          ) : (

            <div className="space-y-5">


              {assessments.map(
                (
                  assessment,
                  index
                ) => {


                  const classes =
                    getRiskClasses(
                      assessment.risk_level,
                      assessment.probability
                    );


                  return (

                    <div
                      key={
                        assessment.id
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                    >


                      {/* Header */}

                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                        <h3 className="text-lg font-bold">

                          Assessment #
                          {assessments.length -
                            index}

                        </h3>


                        <p className="text-sm text-slate-500">

                          {formatDate(
                            assessment.created_at
                          )}

                        </p>

                      </div>


                      {/* Values */}

                      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Age

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.age}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Sex

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.sex === 1
                              ? "Male"
                              : "Female"}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Chest Pain Type

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.cp}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Resting BP

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.trestbps} mmHg

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Cholesterol

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.chol}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Fasting Blood Sugar

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.fbs === 1
                              ? "Yes"
                              : "No"}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Resting ECG

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.restecg}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Max Heart Rate

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.thalach}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Exercise Angina

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.exang === 1
                              ? "Yes"
                              : "No"}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Oldpeak

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.oldpeak}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Slope

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.slope}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Major Vessels

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.ca}

                          </p>

                        </div>


                        <div>

                          <p className="text-xs uppercase tracking-wide text-slate-500">

                            Thalassemia

                          </p>

                          <p className="mt-1 font-semibold">

                            {assessment.thal}

                          </p>

                        </div>


                        {/* Prediction */}

                        {assessment.prediction !==
                          undefined && (

                          <div>

                            <p className="text-xs uppercase tracking-wide text-slate-500">

                              Prediction

                            </p>

                            <p className="mt-1 font-semibold">

                              {assessment.prediction === 1
                                ? "Positive"
                                : "Negative"}

                            </p>

                          </div>

                        )}


                        {/* Probability */}

                        {assessment.probability !==
                          undefined && (

                          <div>

                            <p className="text-xs uppercase tracking-wide text-slate-500">

                              Probability

                            </p>

                            <p className="mt-1 font-semibold">

                              {(
                                assessment.probability *
                                100
                              ).toFixed(1)}
                              %

                            </p>

                          </div>

                        )}


                        {/* Risk */}

                        {assessment.risk_level && (

                          <div>

                            <p className="text-xs uppercase tracking-wide text-slate-500">

                              Risk Level

                            </p>

                            <p
                              className={`mt-1 font-semibold capitalize ${classes.value}`}
                            >

                              {assessment.risk_level}

                            </p>

                          </div>

                        )}

                      </div>


                    </div>

                  );

                }
              )}

            </div>

          )}

        </section>

      </div>

    </main>
  );
}