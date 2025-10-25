import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Earn cUSD by Completing
          <span className="text-blue-600"> Micro-Tasks</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          AI-powered task marketplace on Celo blockchain. Complete tasks, get verified by AI,
          and receive instant payments in stablecoins.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/tasks"
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Browse Tasks
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg"
          >
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold mb-2">AI Verification</h3>
          <p className="text-gray-600">
            Submissions verified by Gemini AI for fast and fair evaluation
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
          <p className="text-gray-600">
            Get paid immediately in cUSD stablecoins via smart contracts
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Secure & Transparent</h3>
          <p className="text-gray-600">
            All transactions recorded on Celo blockchain with full transparency
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-white">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">$10K+</div>
            <div className="text-blue-100">Total Earned</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-blue-100">Tasks Completed</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">95%</div>
            <div className="text-blue-100">Approval Rate</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">200+</div>
            <div className="text-blue-100">Active Workers</div>
          </div>
        </div>
      </div>
    </div>
  );
}
