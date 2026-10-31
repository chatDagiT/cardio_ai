export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="text-2xl font-bold">
            Cardio<span className="text-cyan-400">AI</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#about"
              className="text-sm text-slate-300 hover:text-white"
            >
              About
            </a>

            <a
              href="/login"
              className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Doctor Login
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">
            AI-powered cardiovascular risk assessment
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Intelligent tools for
            <span className="text-cyan-400"> cardiovascular risk </span>
            assessment.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-400">
            CardioAI is a clinical decision-support research platform designed
            to help healthcare professionals evaluate cardiovascular risk
            using patient information and machine-learning models.
          </p>

          <div className="mt-10 flex gap-4">
            <a
              href="/login"
              className="rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Doctor Login
            </a>

            <a
              href="#about"
              className="rounded-lg border border-slate-700 px-6 py-3 font-semibold text-white hover:bg-slate-900"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="about" className="border-t border-slate-800 bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold">
            Built for clinical decision support
          </h2>

          <p className="mt-4 max-w-2xl text-slate-400">
            The platform will combine a secure application, a machine-learning
            model, and a backend API.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              title="Patient Assessment"
              description="Enter relevant patient information through a structured assessment form."
            />

            <Feature
              title="Machine Learning"
              description="Use a trained model to estimate cardiovascular risk from patient features."
            />

            <Feature
              title="Clinical Support"
              description="Present model results to healthcare professionals as decision-support information."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <h3 className="font-semibold text-amber-300">
            Research and decision-support prototype
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            This platform is being developed as a research and educational
            prototype. Model outputs are not a medical diagnosis and should
            not replace professional clinical assessment.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-7xl px-6 text-sm text-slate-500">
          © 2026 CardioAI. Research prototype.
        </div>
      </footer>
    </main>
  );
}

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">
        {description}
      </p>
    </div>
  );
}
