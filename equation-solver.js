// Решалка линейных уравнений
class EquationSolver {
    constructor() {
        this.init();
    }
    
    init() {
        // Обработчик кнопки "Решить"
        const solveBtn = document.getElementById('solveBtn');
        if (solveBtn) {
            solveBtn.addEventListener('click', () => this.solve());
        }
        
        // Обработчики примеров
        const exampleBtns = document.querySelectorAll('.example-btn');
        exampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const equation = e.target.getAttribute('data-eq');
                document.getElementById('equationInput').value = equation;
                this.solve();
            });
        });
        
        // Обработчик Enter в поле ввода
        const equationInput = document.getElementById('equationInput');
        if (equationInput) {
            equationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.solve();
                }
            });
        }
    }
    
    solve() {
        const input = document.getElementById('equationInput').value.trim();
        if (!input) {
            this.showError('Введите уравнение');
            return;
        }
        
        try {
            // Парсинг уравнения
            const parsed = this.parseEquation(input);
            const solution = this.solveEquation(parsed);
            
            // Отображение шагов решения
            this.displaySolution(parsed, solution);
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    parseEquation(equation) {
        // Очистка и нормализация уравнения
        equation = equation.replace(/\s+/g, '');
        
        // Проверка наличия знака равенства
        if (!equation.includes('=')) {
            throw new Error('Уравнение должно содержать знак равенства (=)');
        }
        
        // Разделение на левую и правую части
        const [left, right] = equation.split('=');
        
        if (!left || !right) {
            throw new Error('Некорректное уравнение');
        }
        
        return {
            left: this.parseExpression(left),
            right: this.parseExpression(right),
            original: equation
        };
    }
    
    parseExpression(expr) {
        // Разбор выражения на члены
        const terms = [];
        let currentTerm = '';
        let sign = 1;
        
        for (let i = 0; i < expr.length; i++) {
            const char = expr[i];
            
            if ((char === '+' || char === '-') && currentTerm !== '') {
                if (currentTerm !== '') {
                    terms.push(this.parseTerm(currentTerm, sign));
                }
                sign = char === '+' ? 1 : -1;
                currentTerm = '';
            } else if (char === '(') {
                // Обработка скобок
                const end = this.findMatchingParenthesis(expr, i);
                const subExpr = expr.substring(i + 1, end);
                const multiplier = currentTerm !== '' ? parseFloat(currentTerm) || 1 : 1;
                
                // Парсим выражение в скобках
                const subTerms = this.parseExpression(subExpr);
                
                // Умножаем каждый член на множитель
                subTerms.forEach(term => {
                    term.coefficient *= multiplier * sign;
                    terms.push(term);
                });
                
                i = end;
                currentTerm = '';
            } else {
                currentTerm += char;
            }
        }
        
        // Добавляем последний член
        if (currentTerm !== '') {
            terms.push(this.parseTerm(currentTerm, sign));
        }
        
        return terms;
    }
    
    parseTerm(termStr, sign = 1) {
        // Разбор члена на коэффициент и переменную
        const term = {
            coefficient: 1,
            variable: null
        };
        
        let coefficientStr = '';
        let variableStr = '';
        
        for (const char of termStr) {
            if (/[a-zA-Z]/.test(char)) {
                variableStr += char;
            } else {
                coefficientStr += char;
            }
        }
        
        if (coefficientStr === '' || coefficientStr === '+' || coefficientStr === '-') {
            coefficientStr += '1';
        }
        
        term.coefficient = parseFloat(coefficientStr) * sign;
        
        if (variableStr !== '') {
            term.variable = variableStr.toLowerCase(); // Приводим к нижнему регистру
        }
        
        return term;
    }
    
    findMatchingParenthesis(expr, start) {
        let count = 1;
        for (let i = start + 1; i < expr.length; i++) {
            if (expr[i] === '(') count++;
            if (expr[i] === ')') count--;
            if (count === 0) return i;
        }
        throw new Error('Непарные скобки');
    }
    
    solveEquation(parsed) {
        const steps = [];
        
        // Шаг 1: Перенос всех членов с переменной влево, без переменной вправо
        let leftCoefficient = 0;
        let rightConstant = 0;
        
        // Обрабатываем левую часть
        parsed.left.forEach(term => {
            if (term.variable) {
                leftCoefficient += term.coefficient;
            } else {
                rightConstant -= term.coefficient; // Переносим вправо с обратным знаком
            }
        });
        
        // Обрабатываем правую часть
        parsed.right.forEach(term => {
            if (term.variable) {
                leftCoefficient -= term.coefficient; // Переносим влево с обратным знаком
            } else {
                rightConstant += term.coefficient;
            }
        });
        
        steps.push({
            description: `Переносим все члены с переменной влево, а числа вправо`,
            equation: `${this.formatCoefficient(leftCoefficient)}x = ${rightConstant}`
        });
        
        // Шаг 2: Проверка коэффициента
        if (leftCoefficient === 0) {
            if (rightConstant === 0) {
                throw new Error('Уравнение имеет бесконечное количество решений');
            } else {
                throw new Error('Уравнение не имеет решений');
            }
        }
        
        // Шаг 3: Деление на коэффициент
        const solution = rightConstant / leftCoefficient;
        
        steps.push({
            description: `Делим обе части на коэффициент при переменной (${leftCoefficient})`,
            equation: `x = ${rightConstant} / ${leftCoefficient}`
        });
        
        steps.push({
            description: `Вычисляем значение`,
            equation: `x = ${solution}`
        });
        
        return {
            solution,
            variable: 'x',
            steps
        };
    }
    
    formatCoefficient(coeff) {
        if (coeff === 1) return '';
        if (coeff === -1) return '-';
        return coeff.toString();
    }
    
    displaySolution(parsed, solution) {
        const stepsContainer = document.getElementById('stepsContainer');
        const finalAnswer = document.getElementById('finalAnswer');
        const solutionSteps = document.getElementById('solutionSteps');
        const errorMessage = document.getElementById('errorMessage');
        
        // Скрываем сообщение об ошибке
        errorMessage.style.display = 'none';
        
        // Отображаем шаги решения
        stepsContainer.innerHTML = '';
        
        // Добавляем исходное уравнение
        const originalStep = document.createElement('div');
        originalStep.className = 'step fade-in';
        originalStep.innerHTML = `
            <div class="step-number">0.</div>
            <div>Исходное уравнение: ${parsed.original}</div>
        `;
        stepsContainer.appendChild(originalStep);
        
        // Добавляем шаги решения
        solution.steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step fade-in';
            stepElement.style.animationDelay = `${(index + 1) * 0.1}s`;
            stepElement.innerHTML = `
                <div class="step-number">${index + 1}.</div>
                <div>${step.description}</div>
                <div style="margin-top: 0.5rem; font-family: monospace;">${step.equation}</div>
            `;
            stepsContainer.appendChild(stepElement);
        });
        
        // Отображаем ответ
        finalAnswer.textContent = `${solution.variable} = ${solution.solution}`;
        
        // Показываем блок с решением
        solutionSteps.style.display = 'block';
        
        // Прокручиваем к решению
        solutionSteps.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const solutionSteps = document.getElementById('solutionSteps');
        
        solutionSteps.style.display = 'none';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Инициализация решалки
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('equationInput')) {
        window.equationSolver = new EquationSolver();
    }
});

// Экспорт для тестирования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EquationSolver;
}
