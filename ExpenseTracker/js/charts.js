/**
 * ============================================
 * Smart Expense Tracker - Charts Module
 * ============================================
 * Handles all Chart.js visualizations with dynamic updates
 */

const chartManager = {
    pieChart: null,
    barChart: null,

    /**
     * Initialize charts
     */
    init() {
        this.renderPieChart();
        this.renderBarChart();
    },

    /**
     * Get transaction data for charts
     * @returns {Object} Processed chart data
     */
    getChartData() {
        const data = auth.getUserData();
        const transactions = data ? data.transactions || [] : [];

        // Category breakdown for expenses
        const categoryData = {};
        const incomeVsExpense = { income: 0, expense: 0 };

        transactions.forEach(t => {
            // Income vs Expense
            if (t.type === 'income') {
                incomeVsExpense.income += parseFloat(t.amount);
            } else {
                incomeVsExpense.expense += parseFloat(t.amount);
            }

            // Category breakdown (only for expenses)
            if (t.type === 'expense') {
                const cat = t.category || 'other';
                categoryData[cat] = (categoryData[cat] || 0) + parseFloat(t.amount);
            }
        });

        // Time series data (last 30 days)
        const timeData = {};
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            timeData[dateStr] = { income: 0, expense: 0 };
        }

        transactions.forEach(t => {
            const dateStr = t.date;
            if (timeData[dateStr]) {
                if (t.type === 'income') {
                    timeData[dateStr].income += parseFloat(t.amount);
                } else {
                    timeData[dateStr].expense += parseFloat(t.amount);
                }
            }
        });

        return {
            categoryData,
            incomeVsExpense,
            timeData,
            labels: Object.keys(timeData),
            incomeData: Object.values(timeData).map(d => d.income),
            expenseData: Object.values(timeData).map(d => d.expense)
        };
    },

    /**
     * Render or update pie chart
     */
    renderPieChart() {
        const ctx = document.getElementById('pieChart');
        if (!ctx) return;

        const data = this.getChartData();
        
        // Category colors
        const categoryColors = {
            food: '#f59e0b',
            transport: '#3b82f6',
            shopping: '#ec4899',
            entertainment: '#8b5cf6',
            bills: '#ef4444',
            health: '#10b981',
            education: '#06b6d4',
            other: '#6b7280',
            salary: '#10b981',
            freelance: '#3b82f6',
            investment: '#8b5cf6',
            gift: '#ec4899'
        };

        const labels = Object.keys(data.categoryData).map(cat => this.formatCategory(cat));
        const values = Object.values(data.categoryData);
        const colors = Object.keys(data.categoryData).map(cat => categoryColors[cat] || '#6b7280');

        // If no expense data, show income vs expense
        if (values.length === 0) {
            labels.push('Income', 'Expense');
            values.push(data.incomeVsExpense.income, data.incomeVsExpense.expense);
            colors.push('#10b981', '#ef4444');
        }

        const chartData = {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2,
                hoverOffset: 8
            }]
        };

        const config = {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            font: {
                                family: 'Poppins',
                                size: 12
                            },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1000
                }
            }
        };

        if (this.pieChart) {
            this.pieChart.data = chartData;
            this.pieChart.update();
        } else {
            this.pieChart = new Chart(ctx, config);
        }
    },

    /**
     * Render or update bar chart
     */
    renderBarChart() {
        const ctx = document.getElementById('barChart');
        if (!ctx) return;

        const data = this.getChartData();

        // Format dates for display
        const displayLabels = data.labels.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        });

        const chartData = {
            labels: displayLabels,
            datasets: [
                {
                    label: 'Income',
                    data: data.incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                },
                {
                    label: 'Expense',
                    data: data.expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }
            ]
        };

        const config = {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            font: {
                                family: 'Poppins',
                                size: 12
                            },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim()
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 10
                            },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            maxRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 11
                            },
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        };

        if (this.barChart) {
            this.barChart.data = chartData;
            this.barChart.update();
        } else {
            this.barChart = new Chart(ctx, config);
        }
    },

    /**
     * Update both charts
     */
    updateCharts() {
        this.renderPieChart();
        this.renderBarChart();
    },

    /**
     * Format category name for display
     * @param {string} category - Category key
     * @returns {string} Formatted category name
     */
    formatCategory(category) {
        const categoryMap = {
            food: 'Food & Dining',
            transport: 'Transportation',
            shopping: 'Shopping',
            entertainment: 'Entertainment',
            bills: 'Bills & Utilities',
            health: 'Health & Fitness',
            education: 'Education',
            other: 'Other',
            salary: 'Salary',
            freelance: 'Freelance',
            investment: 'Investment',
            gift: 'Gift'
        };
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }
};
