export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-gray-500 mt-1">
          Store profile, payment gateway integration, and shipping defaults.
        </p>
      </div>

      {/* Store Profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Store Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              readOnly
              value="Authors Book"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Support Email</label>
            <input
              type="text"
              readOnly
              value="authorsbook01@gmail.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Payment Gateway */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Payments & Checkout</h2>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-900">Razorpay Payment Gateway</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">Active — Accepting UPI, Cards, Netbanking</p>
          </div>
          <span className="text-xs bg-emerald-600 text-white font-semibold px-3 py-1 rounded-full">Active</span>
        </div>
      </div>

      {/* Database */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Database</h2>

        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-900">MongoDB Database</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Connected via Mongoose ODM</p>
          </div>
          <span className="text-xs bg-gray-900 text-white font-semibold px-3 py-1 rounded-full">Connected</span>
        </div>
      </div>
    </div>
  );
}
