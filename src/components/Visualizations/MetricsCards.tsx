/**
 * MetricsCards - Summary cards showing key simulation metrics
 * 
 * Displays at-a-glance KPIs after a simulation run
 */

import React, { useMemo } from 'react';
import type { SimulationResults } from '../../engine/types';

interface MetricsCardsProps {
    results: SimulationResults;
}

interface MetricCardProps {
    title: string;
    value: string;
    subtitle?: string;
    icon: string;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
    trend?: 'up' | 'down' | 'neutral';
    change?: string;
}

const colorStyles = {
    blue: {
        bg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        light: '#f0f9ff',
    },
    green: {
        bg: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        light: '#f0fdf4',
    },
    purple: {
        bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        light: '#faf5ff',
    },
    orange: {
        bg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        light: '#fffbeb',
    },
    red: {
        bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        light: '#fef2f2',
    },
    teal: {
        bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
        light: '#f0fdfa',
    },
};

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    color,
    trend,
    change,
}) => {
    const styles = colorStyles[color];

    return (
        <div
            style={{
                background: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div
                    style={{
                        background: styles.bg,
                        borderRadius: '12px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                    }}
                >
                    {icon}
                </div>
                {trend && change && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: trend === 'up' ? '#dcfce7' : trend === 'down' ? '#fef2f2' : '#f1f5f9',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#64748b',
                        }}
                    >
                        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
                    </div>
                )}
            </div>
            <div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{value}</div>
                {subtitle && (
                    <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</div>
                )}
            </div>
        </div>
    );
};

export const MetricsCards: React.FC<MetricsCardsProps> = ({ results }) => {
    const metrics = useMemo(() => {
        const n = results.time.length;
        const lastIndex = n - 1;

        // Calculate metrics
        const totalRevenue = results.cumulative_revenue[lastIndex];
        const finalMarketShare = results.market_share[lastIndex];
        const initialMarketShare = results.market_share[0];
        const marketShareChange = finalMarketShare - initialMarketShare;

        const avgProduction = results.production_rate.reduce((a, b) => a + b, 0) / n;
        const maxBacklog = Math.max(...results.backlog);

        const avgDeliveryPerformance = results.delivery_rate.reduce((sum, del, i) => {
            const orders = results.customer_orders[i];
            return sum + (orders > 0 ? del / orders : 1);
        }, 0) / n * 100;

        const finalRegionalPct = results.regional_supply_percentage[lastIndex];
        const avgSemiAvail = results.semiconductor_availability.reduce((a, b) => a + b, 0) / n * 100;

        return {
            totalRevenue: `€${(totalRevenue / 1000000).toFixed(1)}M`,
            finalMarketShare: `${finalMarketShare.toFixed(1)}%`,
            marketShareTrend: marketShareChange > 0 ? 'up' as const : marketShareChange < 0 ? 'down' as const : 'neutral' as const,
            marketShareChange: `${Math.abs(marketShareChange).toFixed(1)}%`,
            avgProduction: avgProduction.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            maxBacklog: maxBacklog.toLocaleString(undefined, { maximumFractionDigits: 0 }),
            deliveryPerformance: `${avgDeliveryPerformance.toFixed(1)}%`,
            regionalSupply: `${finalRegionalPct.toFixed(1)}%`,
            avgSemiAvail: `${avgSemiAvail.toFixed(1)}%`,
            simulationMonths: n - 1,
        };
    }, [results]);

    return (
        <div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px',
                }}
            >
                <MetricCard
                    title="Total Revenue"
                    value={metrics.totalRevenue}
                    subtitle={`Over ${metrics.simulationMonths} months`}
                    icon="💰"
                    color="green"
                />
                <MetricCard
                    title="Final Market Share"
                    value={metrics.finalMarketShare}
                    icon="📊"
                    color="purple"
                    trend={metrics.marketShareTrend}
                    change={metrics.marketShareChange}
                />
                <MetricCard
                    title="Avg. Delivery Performance"
                    value={metrics.deliveryPerformance}
                    subtitle="Orders fulfilled on time"
                    icon="📦"
                    color="blue"
                />
                <MetricCard
                    title="Regional Supply"
                    value={metrics.regionalSupply}
                    subtitle="End of simulation"
                    icon="🌍"
                    color="teal"
                />
                <MetricCard
                    title="Avg. Production"
                    value={metrics.avgProduction}
                    subtitle="Units per month"
                    icon="🏭"
                    color="orange"
                />
                <MetricCard
                    title="Peak Backlog"
                    value={metrics.maxBacklog}
                    subtitle="Maximum unmet orders"
                    icon="⚠️"
                    color="red"
                />
            </div>

            {/* Summary insights */}
            <div
                style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                }}
            >
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                    📋 Simulation Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>📈</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>Market Position</div>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>
                                Market share {metrics.marketShareTrend === 'up' ? 'grew' : metrics.marketShareTrend === 'down' ? 'declined' : 'remained stable'} by {metrics.marketShareChange} over the simulation period.
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '20px' }}>🔗</span>
                        <div>
                            <div style={{ fontWeight: '600', color: '#1e293b' }}>Supply Chain</div>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>
                                Semiconductor availability averaged {metrics.avgSemiAvail}. Regional sourcing reached {metrics.regionalSupply}.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetricsCards;
