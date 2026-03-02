/**
 * TimeSeriesCharts - Recharts-based visualization of simulation results
 * 
 * Displays multiple charts organized by category:
 * - Operations (production, inventory, backlog)
 * - Market (market share, customer orders, revenue)
 * - Supply Chain (semiconductor availability, regional supply)
 */

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
    ReferenceLine,
} from 'recharts';
import type { SimulationResults } from '../../engine/types';

interface TimeSeriesChartsProps {
    results: SimulationResults;
}

// Chart color palette
const colors = {
    primary: '#0ea5e9',
    secondary: '#8b5cf6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#06b6d4',
    purple: '#a855f7',
    pink: '#ec4899',
};

export const TimeSeriesCharts: React.FC<TimeSeriesChartsProps> = ({ results }) => {
    // Transform data for Recharts
    const chartData = results.time.map((t, i) => ({
        month: t,
        production_capacity: results.production_capacity[i],
        inventory: results.inventory[i],
        backlog: results.backlog[i],
        market_share: results.market_share[i],
        customer_orders: results.customer_orders[i],
        production_rate: results.production_rate[i],
        delivery_rate: results.delivery_rate[i],
        revenue: results.revenue[i] / 1000000, // Convert to millions
        cumulative_revenue: results.cumulative_revenue[i] / 1000000,
        semiconductor_availability: results.semiconductor_availability[i] * 100,
        battery_availability: results.battery_availability[i] * 100,
        regional_supply_percentage: results.regional_supply_percentage[i],
        supply_chain_visibility: results.supply_chain_visibility[i],
        learning_factor: results.learning_factor[i],
    }));

    const chartStyle = {
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
    };

    const titleStyle: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e2e8f0',
    };

    return (
        <div className="space-y-6">
            {/* Operations Chart */}
            <div style={chartStyle}>
                <h3 style={titleStyle}>📊 Operations Performance</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="left"
                            label={{ value: 'Units', angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Backlog', angle: 90, position: 'insideRight' }}
                            stroke="#64748b"
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => [value.toLocaleString(), '']}
                        />
                        <Legend />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="production_capacity"
                            name="Production Capacity"
                            stroke={colors.primary}
                            strokeWidth={3}
                            dot={false}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="production_rate"
                            name="Production Rate"
                            stroke={colors.success}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="inventory"
                            name="Inventory"
                            stroke={colors.info}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="backlog"
                            name="Backlog"
                            stroke={colors.danger}
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="5 5"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Market Performance Chart */}
            <div style={chartStyle}>
                <h3 style={titleStyle}>📈 Market Performance</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="left"
                            domain={[0, 100]}
                            label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{ value: 'Revenue (M€)', angle: 90, position: 'insideRight' }}
                            stroke="#64748b"
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => [
                                name.includes('Revenue') ? `€${value.toFixed(2)}M` : `${value.toFixed(1)}%`,
                                ''
                            ]}
                        />
                        <Legend />
                        <ReferenceLine yAxisId="left" y={50} stroke="#94a3b8" strokeDasharray="3 3" label="Target" />
                        <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="market_share"
                            name="Market Share"
                            fill={colors.purple}
                            fillOpacity={0.3}
                            stroke={colors.purple}
                            strokeWidth={3}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            name="Monthly Revenue"
                            stroke={colors.success}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="cumulative_revenue"
                            name="Cumulative Revenue"
                            stroke={colors.warning}
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="5 5"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Supply Chain Chart */}
            <div style={chartStyle}>
                <h3 style={titleStyle}>🔗 Supply Chain Dynamics</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }}
                            stroke="#64748b"
                        />
                        <YAxis
                            domain={[0, 100]}
                            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="semiconductor_availability"
                            name="Semiconductor Availability"
                            stroke={colors.primary}
                            strokeWidth={3}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="battery_availability"
                            name="Battery Availability"
                            stroke={colors.secondary}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="regional_supply_percentage"
                            name="Regional Supply %"
                            stroke={colors.success}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="supply_chain_visibility"
                            name="Supply Chain Visibility"
                            stroke={colors.info}
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Demand vs Delivery Chart */}
            <div style={chartStyle}>
                <h3 style={titleStyle}>📦 Demand vs Delivery</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Month', position: 'insideBottomRight', offset: -5 }}
                            stroke="#64748b"
                        />
                        <YAxis
                            label={{ value: 'Units/Month', angle: -90, position: 'insideLeft' }}
                            stroke="#64748b"
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => [value.toLocaleString(), '']}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="customer_orders"
                            name="Customer Orders"
                            stroke={colors.warning}
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="delivery_rate"
                            name="Delivery Rate"
                            stroke={colors.success}
                            strokeWidth={3}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TimeSeriesCharts;
