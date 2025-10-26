export function ReputationMeter() {
  const reputation = 78
  const nextLevel = 85

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-foreground/60 mb-1">Reputation Score</p>
          <p className="text-3xl font-bold">{reputation}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-foreground/60 mb-1">Next Level</p>
          <p className="text-lg font-semibold text-orange-400">{nextLevel}</p>
        </div>
      </div>
      <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden border border-orange-500/20">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
          style={{ width: `${(reputation / nextLevel) * 100}%` }}
        />
      </div>
      <p className="text-sm text-foreground/60 mt-2">{nextLevel - reputation} points until next level</p>
    </div>
  )
}
