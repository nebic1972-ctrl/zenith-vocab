import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
        ZENITH-Vocab: System Online
      </h1>
      <Link
        href="/login"
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
      >
        Login
      </Link>
    </div>
  )
}
