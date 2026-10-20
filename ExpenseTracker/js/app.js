/**
 * ============================================
 * Smart Expense Tracker - Main Application Module
 * ============================================
 * Core application logic for managing transactions,
 * generating insights, budget tracking, and data export.
 */

const app = {
    /**
     * Initialize the application
     */
    init() {
        this.renderTransactions();
        this.updateSummary();
        this.updateBudgetUI();
        this.generateInsights();
        this.renderExpenditures();
        chartManager.init();
    },

    /**
     * Get current user's transactions
     * @returns {Array} Array of transaction objects
     */
    getTransactions() {
        const data = auth.getUserData();
        return data ? data.transactions || [] : [];
    },

    /**
     * Save transactions to user data
     * @param {Array} transactions - Array of transaction objects
     */
    saveTransactions(transactions) {
        const data = auth.getUserData() || { transactions: [], budget: 0 };
        data.transactions = transactions;
        auth.saveUserData(data);
    },

    /**
     * Add a new transaction
     */
    addTransaction() {
        const desc = document.getElementById('transDesc').value.trim();
        const amount = parseFloat(document.getElementById('transAmount').value);
        const type = document.getElementById('transType').value;
        const category = document.getElementById('transCategory').value;
        const date = document.getElementById('transDate').value;

        // Validation
        if (!desc || isNaN(amount) || amount <= 0 || !date) {
            showToast('Please fill in all fields correctly', 'error');
            return;
        }

        const transaction = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            description: desc,
            amount: amount,
            type: type,
            category: category,
            date: date,
            createdAt: new Date().toISOString()
        };

        const transactions = this.getTransactions();
        transactions.push(transaction); // Add to bottom
        this.saveTransactions(transactions);

        // Reset form
        document.getElementById('transDesc').value = '';
        document.getElementById('transAmount').value = '';
        document.getElementById('transDate').valueAsDate = new Date();

        // Update UI
        this.renderTransactions();
        this.updateSummary();
        this.updateBudgetUI();
        this.generateInsights();
        this.renderExpenditures();
        chartManager.updateCharts();

        showToast('Transaction added successfully!', 'success');
        
        // Hide form
        toggleTransactionForm();
    },

    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     */
    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        const transactions = this.getTransactions().filter(t => t.id !== id);
        this.saveTransactions(transactions);

        this.renderTransactions();
        this.updateSummary();
        this.updateBudgetUI();
        this.generateInsights();
        this.renderExpenditures();
        chartManager.updateCharts();

        showToast('Transaction deleted', 'warning');
    },

    /**
     * Render transaction list with filters
     */
    renderTransactions() {
        const listContainer = document.getElementById('transactionList');
        if (!listContainer) return;

        let transactions = this.getTransactions();

        // Apply filters
        transactions = this.applyFilters(transactions);

        if (transactions.length === 0) {
            listContainer.innerHTML = [
                '<div class="empty-state">',
                '    <i class="fas fa-receipt"></i>',
                '    <p>No transactions found</p>',
                '</div>'
            ].join('');
            return;
        }

        listContainer.innerHTML = transactions.map(t => this.createTransactionHTML(t)).join('');
    },

    /**
     * Create HTML for a single transaction
     * @param {Object} t - Transaction object
     * @returns {string} HTML string
     */
    createTransactionHTML(t) {
        const categoryIcons = {
            food: 'fa-utensils',
            transport: 'fa-car',
            shopping: 'fa-shopping-bag',
            entertainment: 'fa-film',
            bills: 'fa-file-invoice',
            health: 'fa-heartbeat',
            education: 'fa-graduation-cap',
            other: 'fa-ellipsis-h',
            salary: 'fa-money-bill-wave',
            freelance: 'fa-laptop',
            investment: 'fa-chart-line',
            gift: 'fa-gift'
        };

        const icon = categoryIcons[t.category] || 'fa-circle';
        const isIncome = t.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';
        const formattedDate = new Date(t.date).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        return [
            '<div class="transaction-item ' + amountClass + '">',
            '    <div class="transaction-info">',
            '        <div class="transaction-icon">',
            '            <i class="fas ' + icon + '"></i>',
            '        </div>',
            '        <div class="transaction-details">',
            '            <h4>' + this.escapeHtml(t.description) + '</h4>',
            '            <p>' + chartManager.formatCategory(t.category) + ' &bull; ' + formattedDate + '</p>',
            '        </div>',
            '    </div>',
            '    <div class="transaction-amount">' + sign + '&#x20B9;' + t.amount.toFixed(2) + '</div>',
            '    <div class="transaction-actions">',
            '        <button onclick="app.deleteTransaction(\'' + t.id + '\')" title="Delete">',
            '            <i class="fas fa-trash-alt"></i>',
            '        </button>',
            '    </div>',
            '</div>'
        ].join('');
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Raw text
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Apply filters to transactions
     * @param {Array} transactions - All transactions
     * @returns {Array} Filtered transactions
     */
    applyFilters(transactions) {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const filterType = document.getElementById('filterType')?.value || '';
        const filterCategory = document.getElementById('filterCategory')?.value || '';
        const dateFrom = document.getElementById('filterDateFrom')?.value || '';
        const dateTo = document.getElementById('filterDateTo')?.value || '';

        return transactions.filter(t => {
            // Search filter
            const matchesSearch = !searchTerm || 
                t.description.toLowerCase().includes(searchTerm) ||
                t.category.toLowerCase().includes(searchTerm);

            // Type filter
            const matchesType = !filterType || t.type === filterType;

            // Category filter
            const matchesCategory = !filterCategory || t.category === filterCategory;

            // Date range filter
            const matchesDateFrom = !dateFrom || t.date >= dateFrom;
            const matchesDateTo = !dateTo || t.date <= dateTo;

            return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo;
        });
    },

    /**
     * Filter transactions (called from UI)
     */
    filterTransactions() {
        this.renderTransactions();
    },

    /**
     * Update summary cards (balance, income, expense)
     */
    updateSummary() {
        const transactions = this.getTransactions();
        const data = auth.getUserData();
        const budget = data ? data.budget || 0 : 0;
        
        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            if (t.type === 'income') {
                income += t.amount;
            } else {
                expense += t.amount;
            }
        });

        // Calculate current month expenses for budget-based balance
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthlyExpense = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        // If budget is set, show remaining budget as balance; otherwise show income - expense
        const balance = budget > 0 ? budget - monthlyExpense : income - expense;

        // Update UI
        const balanceEl = document.getElementById('totalBalance');
        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');

        if (balanceEl) {
            const balanceStr = balance >= 0 
                ? '&#x20B9;' + balance.toFixed(2)
                : '-&#x20B9;' + Math.abs(balance).toFixed(2);
            balanceEl.innerHTML = balanceStr;
        }
        if (incomeEl) incomeEl.innerHTML = '+&#x20B9;' + income.toFixed(2);
        if (expenseEl) expenseEl.innerHTML = '-&#x20B9;' + expense.toFixed(2);
    },

    /**
     * Set monthly budget
     */
    setBudget() {
        const input = document.getElementById('budgetInput');
        const amount = parseFloat(input.value);

        if (isNaN(amount) || amount <= 0) {
            showToast('Please enter a valid budget amount', 'error');
            return;
        }

        const data = auth.getUserData() || { transactions: [], budget: 0 };
        data.budget = amount;
        auth.saveUserData(data);

        input.value = '';
        this.updateBudgetUI();
        showToast('Budget set successfully!', 'success');
    },

    /**
     * Update budget progress UI
     */
    updateBudgetUI() {
        const data = auth.getUserData();
        const budget = data ? data.budget || 0 : 0;
        const transactions = this.getTransactions();
        
        // Calculate current month expenses
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const monthlyExpense = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
            .reduce((sum, t) => sum + t.amount, 0);

        const spentEl = document.getElementById('budgetSpent');
        const totalEl = document.getElementById('budgetTotal');
        const progressEl = document.getElementById('budgetProgress');
        const statusEl = document.getElementById('budgetStatus');

        if (spentEl) spentEl.innerHTML = '&#x20B9;' + monthlyExpense.toFixed(2) + ' spent';
        if (totalEl) totalEl.innerHTML = '&#x20B9;' + budget.toFixed(2) + ' total';

        if (budget > 0) {
            const percentage = Math.min((monthlyExpense / budget) * 100, 100);
            
            if (progressEl) {
                progressEl.style.width = percentage + '%';
                progressEl.classList.remove('warning', 'danger');
                
                if (percentage >= 100) {
                    progressEl.classList.add('danger');
                } else if (percentage >= 75) {
                    progressEl.classList.add('warning');
                }
            }

            if (statusEl) {
                if (monthlyExpense > budget) {
                    statusEl.textContent = 'Over budget by ' + (monthlyExpense - budget).toFixed(2) + '!';
                    statusEl.style.color = 'var(--danger-color)';
                } else if (percentage >= 75) {
                    statusEl.textContent = 'You have used ' + percentage.toFixed(0) + '% of your budget';
                    statusEl.style.color = 'var(--warning-color)';
                } else {
                    statusEl.textContent = (budget - monthlyExpense).toFixed(2) + ' remaining this month';
                    statusEl.style.color = 'var(--success-color)';
                }
            }
        } else {
            if (progressEl) progressEl.style.width = '0%';
            if (statusEl) {
                statusEl.textContent = 'Set your monthly budget to track spending';
                statusEl.style.color = 'var(--text-secondary)';
            }
        }
    },

    /**
     * Generate smart spending insights
     */
    generateInsights() {
        const transactions = this.getTransactions();
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = [];

        if (transactions.length === 0) {
            container.innerHTML = [
                '<div class="insight-item">',
                '    <i class="fas fa-info-circle"></i>',
                '    <p>Start adding transactions to see personalized insights!</p>',
                '</div>'
            ].join('');
            return;
        }

        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryTotals = {};
        const weeklyData = {};

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            }

            // Weekly data
            const weekStart = this.getWeekStart(new Date(t.date));
            const weekKey = weekStart.toISOString().split('T')[0];
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                weeklyData[weekKey].income += t.amount;
            } else {
                weeklyData[weekKey].expense += t.amount;
            }
        });

        // Insight 1: Savings rate
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
        if (savingsRate > 0) {
            insights.push({
                icon: 'fa-piggy-bank',
                text: 'Your savings rate is <strong>' + savingsRate.toFixed(1) + '%</strong>. ' + (savingsRate > 20 ? 'Great job!' : 'Try to save at least 20%.')
            });
        } else if (totalExpense > totalIncome) {
            insights.push({
                icon: 'fa-exclamation-triangle',
                text: 'You are spending <strong>&#x20B9;' + (totalExpense - totalIncome).toFixed(2) + '</strong> more than you earn. Review your expenses!'
            });
        }

        // Insight 2: Top spending category
        if (Object.keys(categoryTotals).length > 0) {
            const topCategory = Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])[0];
            insights.push({
                icon: 'fa-chart-pie',
                text: 'Your top spending category is <strong>' + chartManager.formatCategory(topCategory[0]) + '</strong> at &#x20B9;' + topCategory[1].toFixed(2) + '.'
            });
        }

        // Insight 3: Weekly trend
        const weekKeys = Object.keys(weeklyData).sort();
        if (weekKeys.length >= 2) {
            const lastWeek = weeklyData[weekKeys[weekKeys.length - 1]];
            const prevWeek = weeklyData[weekKeys[weekKeys.length - 2]];
            const change = prevWeek.expense > 0 
                ? ((lastWeek.expense - prevWeek.expense) / prevWeek.expense * 100)
                : 0;
            
            if (change > 10) {
                insights.push({
                    icon: 'fa-arrow-trend-up',
                    text: 'Spending increased by <strong>' + change.toFixed(1) + '%</strong> compared to last week.'
                });
            } else if (change < -10) {
                insights.push({
                    icon: 'fa-arrow-trend-down',
                    text: 'Spending decreased by <strong>' + Math.abs(change).toFixed(1) + '%</strong> compared to last week. Great!'
                });
            }
        }

        // Insight 4: Daily average
        const uniqueDays = new Set(transactions.map(t => t.date)).size;
        if (uniqueDays > 0) {
            const dailyAvg = totalExpense / uniqueDays;
            insights.push({
                icon: 'fa-calculator',
                text: 'Your daily average spending is <strong>&#x20B9;' + dailyAvg.toFixed(2) + '</strong>.'
            });
        }

        // Insight 5: Budget status
        const data = auth.getUserData();
        const budget = data ? data.budget || 0 : 0;
        if (budget > 0) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const monthlyExpense = transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + t.amount, 0);
            const remaining = budget - monthlyExpense;
            
            if (remaining > 0) {
                const daysLeft = 30 - new Date().getDate();
                const dailyBudget = remaining / Math.max(daysLeft, 1);
                insights.push({
                    icon: 'fa-wallet',
                    text: 'You can spend <strong>&#x20B9;' + dailyBudget.toFixed(2) + '/day</strong> for the rest of the month.'
                });
            }
        }

        // Render insights
        container.innerHTML = insights.map(i => [
            '<div class="insight-item">',
            '    <i class="fas ' + i.icon + '"></i>',
            '    <p>' + i.text + '</p>',
            '</div>'
        ].join('')).join('');
    },

    /**
     * Get start of week (Monday)
     * @param {Date} date - Date object
     * @returns {Date} Week start date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    /**
     * Render expenditures section: last 7 days + any day picker
     */
    renderExpenditures() {
        const container = document.getElementById('lastWeekContainer');
        if (!container) return;

        const transactions = this.getTransactions();
        const today = new Date();
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let html = '';

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = dayNames[d.getDay()];
            const dayDate = d.getDate();

            const total = transactions
                .filter(t => t.type === 'expense' && t.date === dateStr)
                .reduce((sum, t) => sum + t.amount, 0);

            const noSpendClass = total === 0 ? 'no-spend' : '';
            const amountText = total === 0 ? '₹0.00' : '₹' + total.toFixed(2);

            html += [
                '<div class="day-card ' + noSpendClass + '">',
                '    <div class="day-name">' + dayName + '</div>',
                '    <div class="day-date">' + dayDate + '</div>',
                '    <div class="day-amount">' + amountText + '</div>',
                '</div>'
            ].join('');
        }

        container.innerHTML = html;
    },

    /**
     * Render selected day expenditure from date picker
     */
    renderSelectedDayExpenditure() {
        const picker = document.getElementById('anyDayPicker');
        const display = document.getElementById('selectedDayDisplay');
        const labelEl = document.getElementById('selectedDayLabel');
        const amountEl = document.getElementById('selectedDayAmount');

        if (!picker || !display || !labelEl || !amountEl) return;

        const dateStr = picker.value;
        if (!dateStr) {
            display.classList.add('hidden');
            return;
        }

        const transactions = this.getTransactions();
        const total = transactions
            .filter(t => t.type === 'expense' && t.date === dateStr)
            .reduce((sum, t) => sum + t.amount, 0);

        const formattedDate = new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        labelEl.textContent = formattedDate + ':';
        amountEl.textContent = total === 0 ? '₹0.00' : '₹' + total.toFixed(2);
        display.classList.remove('hidden');
    },

    /**
     * Reset all user data (transactions + budget)
     */
    resetData() {
        if (!confirm('Are you sure you want to reset all data? This will delete all transactions and budget settings.')) return;

        const data = auth.getUserData();
        if (data) {
            data.transactions = [];
            data.budget = 0;
            auth.saveUserData(data);
        }

        // Clear filters
        document.getElementById('searchInput').value = '';
        document.getElementById('filterType').value = '';
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterDateFrom').value = '';
        document.getElementById('filterDateTo').value = '';

        // Update UI
        this.renderTransactions();
        this.updateSummary();
        this.updateBudgetUI();
        this.generateInsights();
        chartManager.updateCharts();

        showToast('All data has been reset!', 'warning');
    },

    /**
     * Export transactions as CSV
     */
    exportCSV() {
        const transactions = this.getTransactions();
        
        if (transactions.length === 0) {
            showToast('No transactions to export', 'warning');
            return;
        }

        // CSV headers
        const headers = ['Date', 'Description', 'Type', 'Category', 'Amount'];
        
        // CSV rows
        const rows = transactions.map(t => [
            t.date,
            '"' + t.description.replace(/"/g, '""') + '"',
            t.type,
            chartManager.formatCategory(t.category),
            t.amount.toFixed(2)
        ]);

        // Combine
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', 'expenses_' + new Date().toISOString().split('T')[0] + '.csv');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Transactions exported successfully!', 'success');
    },

    /**
     * Export transactions as PDF
     */
    exportPDF() {
        const transactions = this.getTransactions();

        if (transactions.length === 0) {
            showToast('No transactions to export', 'warning');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const session = auth.getSession();
        const userName = session ? session.name : 'User';
        const exportDate = new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        // Title
        doc.setFontSize(20);
        doc.setTextColor(99, 102, 241);
        doc.text('Smart Expense Tracker', 105, 20, { align: 'center' });

        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text('Transaction Report for ' + userName, 105, 30, { align: 'center' });
        doc.text('Generated on: ' + exportDate, 105, 38, { align: 'center' });

        // Calculate summary
        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else {
                totalExpense += t.amount;
            }
        });

        // Summary section
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);
        doc.text('Total Income: Rs. ' + totalIncome.toFixed(2), 14, 52);
        doc.text('Total Expense: Rs. ' + totalExpense.toFixed(2), 75, 52);
        doc.text('Net Balance: Rs. ' + (totalIncome - totalExpense).toFixed(2), 136, 52);

        // Transaction table
        const tableData = transactions.map(t => [
            t.date,
            t.description,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
            chartManager.formatCategory(t.category),
            'Rs. ' + t.amount.toFixed(2)
        ]);

        doc.autoTable({
            head: [['Date', 'Description', 'Type', 'Category', 'Amount']],
            body: tableData,
            startY: 60,
            theme: 'grid',
            headStyles: {
                fillColor: [99, 102, 241],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 255]
            },
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            columnStyles: {
                0: { cellWidth: 28 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 22 },
                3: { cellWidth: 35 },
                4: { cellWidth: 28, halign: 'right' }
            }
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text('Page ' + i + ' of ' + pageCount, 105, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        doc.save('expenses_' + new Date().toISOString().split('T')[0] + '.pdf');
        showToast('PDF exported successfully!', 'success');
    }
};
