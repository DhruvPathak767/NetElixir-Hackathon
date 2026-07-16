import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, TrendingDown, DollarSign, Wallet, Percent, Activity, Award, Sparkles, Download, UploadCloud, RefreshCw, Target, ShieldAlert 
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { ErrorCard } from '../components/ReusableWidgets.jsx';
import { useToast } from '../components/Toast.jsx';
import { getDashboardSummary, getBusinessInsights } from '../services/api.js';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer.jsx';
import {
  AnimatedMetricCard,
  BusinessHealthCard,
  InsightCard,
  RecommendationCard,
  RevenueTrendChart,
  SpendTrendChart,
  ExecutiveSummary,
  QuickActionCard,
  ActivityTimeline,
  DashboardSkeleton
} from '../components/DashboardComponents.jsx';

export default function Dashboard() {
  const toast = useToast();
  const [dashData, setDashData] = useState(null);
  const [insightsData, setInsightsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = async (isRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, insightsRes] = await Promise.all([
        getDashboardSummary(),
        getBusinessInsights()
      ]);
      setDashData(dashRes);
      setInsightsData(insightsRes);
      if (isRefresh) {
        toast.success('Dashboard metrics refreshed successfully!');
      }
    } catch (err) {
      console.error('Failed to load executive dashboard:', err);
      const errMsg = err.response?.data?.detail || err.message || 'Failed to connect to backend services.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <StaggerContainer>
        <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Executive Analytics Center</h1>
            <p className="page-desc">Running calculations and compiling database aggregations...</p>
          </div>
        </StaggerItem>
        <DashboardSkeleton />
      </StaggerContainer>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ErrorCard 
          title="Executive Summary Calculation Failed" 
          message={error} 
          onRetry={() => loadDashboard(true)} 
        />
      </div>
    );
  }

  if (!dashData || !insightsData) return null;

  return (
    <StaggerContainer>
      <StaggerItem className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">Executive Analytics Center</h1>
          <p className="page-desc">Real-time decision intelligence aggregated from active campaign datasets</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" leftIcon={<RefreshCw size={16} />} onClick={() => loadDashboard(true)}>
            Refresh Data
          </Button>
          <Button to="/app/upload" leftIcon={<UploadCloud size={16} />}>
            Upload Data
          </Button>
        </div>
      </StaggerItem>

      {/* Out-of-sync dataset warning */}
      {(() => {
        try {
          const savedUpload = localStorage.getItem('forecastiq_uploaded');
          if (!savedUpload) return null;
          const parsed = JSON.parse(savedUpload);
          const uploadedRows = parsed.rows;
          const uploadedFilename = parsed.name;
          if (uploadedRows && dashData.summary.records !== uploadedRows) {
            return (
              <StaggerItem style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, padding: 16, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--r-md)' }}>
                  <ShieldAlert size={20} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Dataset Change Detected</strong>: You uploaded a new file <strong>{uploadedFilename}</strong> ({uploadedRows.toLocaleString()} rows), but the dashboard metrics and charts are still based on the old features dataset ({dashData.summary.records.toLocaleString()} rows).
                    <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
                      <Link to="/app/preprocessing" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>1. Preprocess Data</Link>
                      <Link to="/app/feature-engineering" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>2. Rebuild Features</Link>
                      <Link to="/app/model-training" style={{ color: 'var(--brand-400)', fontWeight: 600, textDecoration: 'underline' }}>3. Retrain ML Model</Link>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          }
          return null;
        } catch {
          return null;
        }
      })()}

      {/* Executive Strategy Summary Paragraph */}
      <StaggerItem style={{ marginBottom: 20 }}>
        <ExecutiveSummary text={insightsData.executive_summary} />
      </StaggerItem>

      {/* Executive KPI Cards (Row 1) */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
        <AnimatedMetricCard label="Revenue" value={dashData.summary.total_revenue} icon={DollarSign} formatType="money" />
        <AnimatedMetricCard label="Total Spend" value={dashData.summary.total_spend} icon={Wallet} formatType="money" />
        <AnimatedMetricCard label="Net Profit" value={dashData.summary.overall_profit} icon={TrendingUp} formatType="money" />
        <AnimatedMetricCard label="Average ROAS" value={dashData.summary.average_roas} icon={Target} formatType="roas" />
      </StaggerItem>

      {/* Executive KPI Cards (Row 2) */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 20 }}>
        <AnimatedMetricCard label="Profit Margin" value={dashData.summary.profit_margin} icon={Percent} formatType="percent" />
        <AnimatedMetricCard label="Average CTR" value={dashData.summary.average_ctr * 100} icon={Activity} formatType="percent" />
        <AnimatedMetricCard label="Conversion Rate" value={dashData.summary.average_conversion_rate * 100} icon={Award} formatType="percent" />
        <AnimatedMetricCard label="Average CPC" value={dashData.summary.average_cpc} icon={DollarSign} formatType="money" />
      </StaggerItem>

      {/* Charts Row */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        <RevenueTrendChart monthlyRevenue={dashData.monthly_revenue} />
        <SpendTrendChart spendDistribution={dashData.spend_distribution} />
      </StaggerItem>

      {/* Intelligence & Recommendations Grid */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Business health and top performers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <BusinessHealthCard 
            health={insightsData.business_health.score} 
            rating={insightsData.business_health.rating} 
            trend={insightsData.monthly_trend.trend} 
            risk={insightsData.risk_analysis.budget_risk} 
          />
          <Card reveal padding="lg" style={{ flex: 1, margin: 0 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>Top Performers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Best Region:</span>
                <span style={{ fontWeight: 600 }}>{dashData.top_performers.region}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Best Campaign Type:</span>
                <span style={{ fontWeight: 600 }}>{dashData.top_performers.campaign}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Top Spend Channel:</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{dashData.top_performers.channel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Best Weekday:</span>
                <span style={{ fontWeight: 600 }}>{dashData.top_performers.best_day}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* AI Recommendations */}
        <RecommendationCard recs={insightsData.recommendations} />

        {/* AI Insights List */}
        <InsightCard insights={insightsData.insights} />
      </StaggerItem>

      {/* Diagnostics and Action Shortcuts Row */}
      <StaggerItem style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <ActivityTimeline 
          timestamp={insightsData.metadata?.generated_at} 
          version={insightsData.metadata?.model_version} 
          totalRecords={dashData.summary.records} 
          duplicates={insightsData.data_quality.duplicates} 
          missing={insightsData.data_quality.missing_values} 
        />
        <QuickActionCard />
      </StaggerItem>
    </StaggerContainer>
  );
}
