export default function CostEstimator() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="font-rajdhani font-bold text-xl text-[#1A1F2E] mb-1">National Maintenance Cost Estimator</h2>
      <p className="text-xs text-muted-foreground mb-5">Estimated expenditure for bringing all highways to Grade B or above</p>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <CostCard
          color="red"
          icon="🪧"
          title="Replace Signs"
          items={[
            { label: 'Total signs to replace', value: '847' },
            { label: 'Cost per sign', value: '₹15,000' },
          ]}
          total="₹1.27 Crore"
        />
        <CostCard
          color="yellow"
          icon="🛣️"
          title="Repaint Markings"
          items={[
            { label: 'Total stretches', value: '234 km' },
            { label: 'Cost per km', value: '₹45,000' },
          ]}
          total="₹1.05 Crore"
        />
        <CostCard
          color="green"
          icon="✨"
          title="Clean & Polish"
          items={[
            { label: 'Total items', value: '1,205' },
            { label: 'Cost per item', value: '₹500' },
          ]}
          total="₹6.02 Lakh"
        />
      </div>

      {/* Total bar */}
      <div className="bg-[#1A1F2E] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <div>
          <p className="text-white font-rajdhani font-bold text-lg">Total Estimated Maintenance Budget: <span className="text-[#FF6B00]">₹2.38 Crore</span></p>
          <p className="text-white/50 text-xs mt-0.5">Recommended this financial quarter · FY 2024–25</p>
        </div>
        <div className="flex-shrink-0 bg-[#FF6B00] text-white text-xs font-bold px-4 py-2 rounded-lg">
          Q1 Priority
        </div>
      </div>
    </div>
  );
}

const COLOR_MAP = {
  red: { bg: 'bg-red-50', border: 'border-red-200', total: 'text-red-600' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', total: 'text-yellow-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', total: 'text-green-600' },
};

function CostCard({ color, icon, title, items, total }) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-4`}>
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-sm text-gray-800 mb-3">{title}</h3>
      <div className="space-y-1.5 mb-3">
        {items.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-700">{value}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-2">
        <p className="text-xs text-gray-500">Total</p>
        <p className={`font-rajdhani font-bold text-xl ${c.total}`}>{total}</p>
      </div>
    </div>
  );
}