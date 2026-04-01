const StatCard = ({ title, value, icon, color = 'blue', trend = null }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
          {trend && (
            <p className={`stat-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`stat-card-icon ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
