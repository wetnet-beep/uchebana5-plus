// Математика в столбик
class ColumnMath {
    constructor() {
        this.currentOperation = 'addition';
        this.init();
    }
    
    init() {
        // Инициализация кнопок операций
        const operationBtns = document.querySelectorAll('.operation-btn');
        operationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setOperation(e.target.closest('.operation-btn').dataset.operation);
            });
        });
        
        // Инициализация кнопки вычисления
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculate());
        }
        
        // Обработчик Enter в полях ввода
        const inputs = document.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.calculate();
                }
            });
        });
        
        // Устанавливаем сложение по умолчанию
        this.setOperation('addition');
    }
    
    setOperation(operation) {
        this.currentOperation = operation;
        
        // Обновляем активную кнопку
        const operationBtns = document.querySelectorAll('.operation-btn');
        operationBtns.forEach(btn => {
            if (btn.dataset.operation === operation) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Обновляем плейсхолдеры в зависимости от операции
        const number2Input = document.getElementById('number2');
        if (operation === 'division') {
            number2Input.placeholder = "Введите делитель";
        } else if (operation === 'multiplication') {
            number2Input.placeholder = "Введите множитель";
        } else {
            number2Input.placeholder = "Введите число";
        }
    }
    
    calculate() {
        const num1 = document.getElementById('number1').value.trim();
        const num2 = document.getElementById('number2').value.trim();
        
        // Проверка ввода
        if (!num1 || !num2) {
            this.showError('Введите оба числа');
            return;
        }
        
        const number1 = BigInt(num1);
        const number2 = BigInt(num2);
        
        if (number2 === 0n && this.currentOperation === 'division') {
            this.showError('Деление на ноль невозможно');
            return;
        }
        
        try {
            let result;
            let calculationSteps;
            
            switch (this.currentOperation) {
                case 'addition':
                    result = number1 + number2;
                    calculationSteps = this.additionInColumn(number1, number2);
                    break;
                    
                case 'subtraction':
                    result = number1 - number2;
                    calculationSteps = this.subtractionInColumn(number1, number2);
                    break;
                    
                case 'multiplication':
                    result = number1 * number2;
                    calculationSteps = this.multiplicationInColumn(number1, number2);
                    break;
                    
                case 'division':
                    const divisionResult = this.divisionInColumn(number1, number2);
                    result = `${divisionResult.quotient} (остаток: ${divisionResult.remainder})`;
                    calculationSteps = divisionResult.steps;
                    break;
                    
                default:
                    throw new Error('Неизвестная операция');
            }
            
            this.displayResult(calculationSteps, result.toString());
            
        } catch (error) {
            this.showError(error.message);
        }
    }
    
    additionInColumn(num1, num2) {
        const str1 = num1.toString();
        const str2 = num2.toString();
        const steps = [];
        
        // Выравниваем числа по правому краю
        const maxLength = Math.max(str1.length, str2.length);
        const aligned1 = str1.padStart(maxLength, '0');
        const aligned2 = str2.padStart(maxLength, '0');
        
        let carry = 0;
        let result = '';
        let stepDetails = [];
        
        // Выполняем сложение справа налево
        for (let i = maxLength - 1; i >= 0; i--) {
            const digit1 = parseInt(aligned1[i]);
            const digit2 = parseInt(aligned2[i]);
            const sum = digit1 + digit2 + carry;
            
            const step = {
                position: maxLength - i,
                digit1,
                digit2,
                carry: carry,
                sum: sum,
                resultDigit: sum % 10,
                newCarry: Math.floor(sum / 10)
            };
            
            stepDetails.unshift(step);
            result = (sum % 10) + result;
            carry = Math.floor(sum / 10);
        }
        
        if (carry > 0) {
            result = carry + result;
            stepDetails.unshift({
                position: 'финальный перенос',
                carry: carry,
                note: 'Добавляем перенос в начало'
            });
        }
        
        steps.push({
            title: 'Сложение в столбик',
            numbers: [aligned1, aligned2],
            steps: stepDetails,
            result: result
        });
        
        return steps;
    }
    
    subtractionInColumn(num1, num2) {
        const str1 = num1.toString();
        const str2 = num2.toString();
        const steps = [];
        
        // Выравниваем числа
        const maxLength = Math.max(str1.length, str2.length);
        const aligned1 = str1.padStart(maxLength, '0');
        const aligned2 = str2.padStart(maxLength, '0');
        
        let borrow = 0;
        let result = '';
        let stepDetails = [];
        
        // Вычитаем справа налево
        for (let i = maxLength - 1; i >= 0; i--) {
            let digit1 = parseInt(aligned1[i]) - borrow;
            const digit2 = parseInt(aligned2[i]);
            
            if (digit1 < digit2) {
                digit1 += 10;
                borrow = 1;
            } else {
                borrow = 0;
            }
            
            const difference = digit1 - digit2;
            
            const step = {
                position: maxLength - i,
                digit1: digit1 + (borrow ? 10 : 0),
                digit2,
                borrow: borrow,
                difference: difference,
                note: borrow ? 'Заняли 1 из следующего разряда' : ''
            };
            
            stepDetails.unshift(step);
            result = difference + result;
        }
        
        // Убираем ведущие нули
        result = result.replace(/^0+/, '') || '0';
        
        steps.push({
            title: 'Вычитание в столбик',
            numbers: [aligned1, aligned2],
            steps: stepDetails,
            result: result
        });
        
        return steps;
    }
    
    multiplicationInColumn(num1, num2) {
        const str1 = num1.toString();
        const str2 = num2.toString();
        const steps = [];
        
        let partialProducts = [];
        
        // Умножаем каждую цифру второго числа на первое число
        for (let i = str2.length - 1; i >= 0; i--) {
            const digit2 = parseInt(str2[i]);
            let carry = 0;
            let partialProduct = '';
            
            for (let j = str1.length - 1; j >= 0; j--) {
                const digit1 = parseInt(str1[j]);
                const product = digit1 * digit2 + carry;
                
                partialProduct = (product % 10) + partialProduct;
                carry = Math.floor(product / 10);
            }
            
            if (carry > 0) {
                partialProduct = carry + partialProduct;
            }
            
            // Добавляем нули в конец в зависимости от позиции
            const zeros = '0'.repeat(str2.length - 1 - i);
            partialProducts.push({
                multiplier: digit2,
                product: partialProduct + zeros,
                position: str2.length - 1 - i
            });
        }
        
        // Суммируем частичные произведения
        let finalResult = '0';
        for (const pp of partialProducts) {
            finalResult = (BigInt(finalResult) + BigInt(pp.product)).toString();
        }
        
        steps.push({
            title: 'Умножение в столбик',
            numbers: [str1, str2],
            partialProducts: partialProducts,
            result: finalResult
        });
        
        return steps;
    }
    
    divisionInColumn(dividend, divisor) {
        const dividendStr = dividend.toString();
        const divisorStr = divisor.toString();
        const steps = [];
        
        if (dividend < divisor) {
            return {
                quotient: '0',
                remainder: dividend.toString(),
                steps: [{
                    title: 'Деление',
                    note: 'Делимое меньше делителя',
                    quotient: '0',
                    remainder: dividend.toString()
                }]
            };
        }
        
        let quotient = '';
        let remainder = 0;
        let currentStep = 0;
        let stepDetails = [];
        
        // Деление в столбик
        for (let i = 0; i < dividendStr.length; i++) {
            remainder = remainder * 10 + parseInt(dividendStr[i]);
            let digit = 0;
            
            while (remainder >= divisor) {
                remainder -= divisor;
                digit++;
            }
            
            quotient += digit;
            
            stepDetails.push({
                step: ++currentStep,
                digit: dividendStr[i],
                currentRemainder: remainder + divisor * digit,
                quotientDigit: digit,
                newRemainder: remainder,
                note: `Берём цифру ${dividendStr[i]}, получаем ${remainder + divisor * digit}, `
                    + `делим на ${divisor}, получаем ${digit}, остаток ${remainder}`
            });
            
            // Убираем ведущие нули в частном
            if (quotient === '0' && i < dividendStr.length - 1) {
                quotient = '';
            }
        }
        
        // Убираем ведущие нули
        quotient = quotient.replace(/^0+/, '') || '0';
        
        steps.push({
            title: 'Деление в столбик',
            dividend: dividendStr,
            divisor: divisorStr,
            steps: stepDetails,
            quotient: quotient,
            remainder: remainder.toString()
        });
        
        return {
            quotient: quotient,
            remainder: remainder.toString(),
            steps: steps
        };
    }
    
    displayResult(calculationSteps, result) {
        const resultSection = document.getElementById('resultSection');
        const columnCalculation = document.getElementById('columnCalculation');
        const calculationResult = document.getElementById('calculationResult');
        const errorMessage = document.getElementById('errorMessage');
        
        // Скрываем сообщение об ошибке
        errorMessage.style.display = 'none';
        
        // Отображаем решение
        columnCalculation.innerHTML = '';
        
        calculationSteps.forEach(step => {
            const stepElement = document.createElement('div');
            stepElement.className = 'calculation-step fade-in';
            
            if (step.title === 'Сложение в столбик' || step.title === 'Вычитание в столбик') {
                stepElement.innerHTML = this.renderColumnStep(step);
            } else if (step.title === 'Умножение в столбик') {
                stepElement.innerHTML = this.renderMultiplicationStep(step);
            } else if (step.title === 'Деление в столбик') {
                stepElement.innerHTML = this.renderDivisionStep(step);
            }
            
            columnCalculation.appendChild(stepElement);
        });
        
        // Отображаем результат
        calculationResult.textContent = result;
        
        // Показываем блок с решением
        resultSection.style.display = 'block';
        
        // Прокручиваем к результату
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    renderColumnStep(step) {
        let html = `<h4>${step.title}</h4>`;
        html += `<div class="column-numbers">`;
        html += `<div class="number-row">${step.numbers[0]}</div>`;
        html += `<div class="number-row">${step.numbers[1]}</div>`;
        html += `<div class="divider">${'-'.repeat(step.numbers[0].length)}</div>`;
        
        // Отображаем шаги если есть
        if (step.steps) {
            html += `<div class="step-details">`;
            step.steps.forEach((s, index) => {
                html += `<div class="step-detail">`;
                html += `<strong>Шаг ${s.position}:</strong> `;
                if (s.digit1 !== undefined) {
                    html += `${s.digit1} + ${s.digit2}`;
                    if (s.carry) html += ` + ${s.carry} (перенос)`;
                    html += ` = ${s.sum}, пишем ${s.resultDigit}, переносим ${s.newCarry}`;
                }
                html += `</div>`;
            });
            html += `</div>`;
        }
        
        html += `<div class="result-row"><strong>${step.result}</strong></div>`;
        html += `</div>`;
        
        return html;
    }
    
    renderMultiplicationStep(step) {
        let html = `<h4>${step.title}</h4>`;
        html += `<div class="column-numbers">`;
        html += `<div class="number-row">${step.numbers[0]}</div>`;
        html += `<div class="number-row">× ${step.numbers[1]}</div>`;
        html += `<div class="divider">${'-'.repeat(Math.max(step.numbers[0].length, step.numbers[1].length + 2))}</div>`;
        
        // Отображаем частичные произведения
        if (step.partialProducts) {
            step.partialProducts.forEach((pp, index) => {
                html += `<div class="partial-product">`;
                if (index === 0) {
                    html += `${pp.product}`;
                } else {
                    html += `${pp.product.padStart(pp.product.length + pp.position, ' ')}`;
                }
                html += `</div>`;
            });
            
            if (step.partialProducts.length > 1) {
                html += `<div class="divider">${'-'.repeat(step.result.length)}</div>`;
            }
        }
        
        html += `<div class="result-row"><strong>${step.result}</strong></div>`;
        html += `</div>`;
        
        return html;
    }
    
    renderDivisionStep(step) {
        let html = `<h4>${step.title}</h4>`;
        html += `<div class="column-numbers">`;
        html += `<div class="division-setup">`;
        html += `<div class="dividend">${step.dividend} │ ${step.divisor}</div>`;
        html += `</div>`;
        html += `<div class="divider">${'-'.repeat(step.dividend.length + step.divisor.length + 3)}</div>`;
        
        // Отображаем шаги деления
        if (step.steps) {
            html += `<div class="step-details">`;
            step.steps.forEach(s => {
                html += `<div class="step-detail">`;
                html += `<strong>Шаг ${s.step}:</strong> ${s.note}`;
                html += `</div>`;
            });
            html += `</div>`;
        }
        
        html += `<div class="result-row">`;
        html += `<strong>Частное:</strong> ${step.quotient}<br>`;
        html += `<strong>Остаток:</strong> ${step.remainder}`;
        html += `</div>`;
        html += `</div>`;
        
        return html;
    }
    
    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        const resultSection = document.getElementById('resultSection');
        
        resultSection.style.display = 'none';
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.operation-buttons')) {
        window.columnMath = new ColumnMath();
    }
});
