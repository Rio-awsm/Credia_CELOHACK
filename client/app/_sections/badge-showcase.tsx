const badges = [
  { name: "Quick Starter", icon: "⚡", earned: true },
  { name: "Accuracy Master", icon: "🎯", earned: true },
  { name: "Streak Champion", icon: "🔥", earned: true },
  { name: "Top Performer", icon: "👑", earned: false },
  { name: "Community Helper", icon: "🤝", earned: false },
  { name: "Legendary Worker", icon: "⭐", earned: false },
]

export function BadgeShowcase() {
  return (
    <div>
      <h3 className="font-semibold text-lg mb-4">Badges</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {badges.map((badge, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg text-center transition-all ${
              badge.earned
                ? "bg-card/80 backdrop-blur-md border border-border rounded-lg hover:bg-card/90 transition-colors duration-200"
                : "bg-card/50 opacity-50"
            }`}
          >
            <div className="text-3xl mb-2">{badge.icon}</div>
            <p className="text-xs font-medium">{badge.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
