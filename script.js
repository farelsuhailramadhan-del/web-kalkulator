let expressionInput = "0";
let calculationHistory = [];

const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const keypad = document.getElementById("keypad");
const historyBtn = document.getElementById("historyBtn");

function appendValue(val) {
    const operators = ['+', '-', '×', '÷'];
    
    // Jika layar masih "0"
    if (expressionInput === "0") {
        if (operators.includes(val)) {
            expressionInput += val; // Menghasilkan "0+" atau "0÷"
        } else if (val === ',') {
            expressionInput += val; // Menghasilkan "0,"
        } else if (val === '%') {
            expressionInput = "0%";
        } else if (val !== '0') {
            expressionInput = val;  // Mengganti "0" dengan angka lain
        }
        // Jika menekan "0" saat masih "0", diabaikan agar tetap "0"
        updateDisplay();
        return;
    }

    // Penanganan normal jika sudah bukan "0" di awal
    const lastChar = expressionInput.slice(-1);
    if (operators.includes(lastChar) && operators.includes(val)) {
        expressionInput = expressionInput.slice(0, -1) + val;
    } else {
        expressionInput += val;
    }
    updateDisplay();
}

function appendParentheses() {
    if (expressionInput === "0") {
        expressionInput = "(";
        updateDisplay();
        return;
    }

    const openCount = (expressionInput.match(/\(/g) || []).length;
    const closeCount = (expressionInput.match(/\)/g) || []).length;
    const lastChar = expressionInput.slice(-1);
    const operators = ['+', '-', '×', '÷', '('];

    if (openCount > closeCount && !operators.includes(lastChar)) {
        expressionInput += ")";
    } else {
        expressionInput += "(";
    }
    updateDisplay();
}

function clearCalculator() {
    expressionInput = "0";
    resultDisplay.textContent = "";
    updateDisplay();
}

function backspace() {
    if (expressionInput.length > 1) {
        expressionInput = expressionInput.slice(0, -1);
    } else {
        expressionInput = "0";
    }
    updateDisplay();
}

function updateDisplay() {
    expressionDisplay.textContent = expressionInput;
}

function calculateResult() {
    try {
        let formattedExpression = expressionInput
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/,/g, '.');

        // Menangani perkalian implisit (misal: 2(3+4) menjadi 2*(3+4))
        formattedExpression = formattedExpression.replace(/(\d|\))\(/g, '$1*(');
        formattedExpression = formattedExpression.replace(/\)(\d)/g, ')*$1');

        // PERBAIKAN PERSEN: Mendukung angka negatif di depan untuk operasi + dan - (misal: -120 + 20%)
        formattedExpression = formattedExpression.replace(/(-?\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/g, '$1 $2 ($1 * $3 / 100)');
        
        // Untuk persen biasa di luar itu (misal: 50%)
        formattedExpression = formattedExpression.replace(/(-?\d+(?:\.\d+)?)%/g, '($1/100)');

        // Validasi pembagian dengan nol
        if (/\/\s*0(\.0+)?([^\d]|$)/.test(formattedExpression)) {
            throw new Error("Kesalahan: Pembagian dengan nol tidak diperbolehkan!");
        }

        let calculationResult = Function('"use strict"; return (' + formattedExpression + ')')();

        if (!isFinite(calculationResult)) {
            throw new Error("Hasil Tidak Valid / Pembagian dengan Nol");
        }

        if (!Number.isInteger(calculationResult)) {
            calculationResult = parseFloat(calculationResult.toFixed(8));
        }

        let formattedResult = String(calculationResult).replace('.', ',');
        resultDisplay.textContent = formattedResult;

        addToHistory(expressionInput, formattedResult);

    } catch (error) {
        resultDisplay.textContent = error.message.includes("nol") 
            ? "Kesalahan: Pembagian dengan 0" 
            : "Format Salah / Error";
    }
}

function addToHistory(exp, res) {
    calculationHistory.unshift({ expression: exp, result: res });
    renderHistory();
}

function renderHistory() {
    if (calculationHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-history">Belum ada riwayat perhitungan</p>';
        return;
    }

    historyList.innerHTML = calculationHistory.map(item => `
        <div class="history-item" onclick="useHistoryItem('${item.result}')">
            <div class="history-exp">${item.expression}</div>
            <div class="history-res">${item.result}</div>
        </div>
    `).join('');
}

function useHistoryItem(val) {
    expressionInput = val;
    resultDisplay.textContent = "";
    updateDisplay();
    toggleHistory();
}

function toggleHistory() {
    const isHidden = historyPanel.classList.contains("hidden");
    if (isHidden) {
        historyPanel.classList.remove("hidden");
        keypad.classList.add("hidden");
        historyBtn.classList.add("active-history");
    } else {
        historyPanel.classList.add("hidden");
        keypad.classList.remove("hidden");
        historyBtn.classList.remove("active-history");
    }
}

function clearHistory() {
    calculationHistory = [];
    renderHistory();
}