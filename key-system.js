// Система ключей для приложения
class KeySystem {
    constructor() {
        this.validKeys = this.generateKeys();
        this.deviceId = this.getDeviceId();
        this.init();
    }
    
    generateKeys() {
        // 40 уникальных ключей
        const prefixes = ['SUN', 'MOON', 'STAR', 'SKY', 'SEA', 'FIRE', 'WIND', 'EARTH', 
                         'GOLD', 'SILVER', 'IRON', 'WOOD', 'BOOK', 'PEN', 'DESK', 'ROOM',
                         'MATH', 'SCIENCE', 'LEARN', 'STUDY', 'BRAIN', 'MIND', 'TIME', 'HOUR',
                         'DAY', 'WEEK', 'MONTH', 'YEAR', 'GOAL', 'DREAM', 'PLAN', 'WORK',
                         'TEAM', 'FRIEND', 'HELP', 'HAPPY', 'SMART', 'CLEVER', 'QUICK', 'FAST'];
        
        const keys = [];
        for (let i = 0; i < 40; i++) {
            const prefix = prefixes[i];
            const numbers = Math.floor(Math.random() * 900 + 100); // 100-999
            const key = `UCH-NA5-${prefix}-${numbers}`;
            keys.push(key);
        }
        
        return keys;
    }
    
    getDeviceId() {
        // Генерируем уникальный ID устройства
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + 
                      '_' + Date.now().toString(36);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }
    
    init() {
        // Проверяем статус ключа при загрузке
        this.checkKeyStatus();
        
        // Инициализация формы активации если есть
        const activateForm = document.getElementById('activateForm');
        if (activateForm) {
            activateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.activateKey();
            });
        }
        
        // Обработка ввода ключа с автоформатированием
        const keyInput = document.getElementById('keyInput');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                this.formatKeyInput(e.target);
            });
            
            keyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.activateKey();
                }
            });
        }
    }
    
    formatKeyInput(input) {
        let value = input.value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
        
        // Автоматическое добавление дефисов
        if (value.length > 3 && value[3] !== '-') {
            value = value.substring(0, 3) + '-' + value.substring(3);
        }
        if (value.length > 8 && value[8] !== '-') {
            value = value.substring(0, 8) + '-' + value.substring(8);
        }
        if (value.length > 13 && value[13] !== '-') {
            value = value.substring(0, 13) + '-' + value.substring(13);
        }
        
        // Ограничение длины
        if (value.length > 16) {
            value = value.substring(0, 16);
        }
        
        input.value = value;
    }
    
    activateKey() {
        const keyInput = document.getElementById('keyInput');
        const key = keyInput.value.trim();
        const messageDiv = document.getElementById('message');
        
        if (!key) {
            this.showMessage('Введите ключ', 'error');
            return;
        }
        
        // Проверка формата
        if (!this.validateKeyFormat(key)) {
            this.showMessage('Неверный формат ключа. Пример: UCH-NA5-SUN-723', 'error');
            return;
        }
        
        // Проверка наличия ключа в списке
        if (!this.validKeys.includes(key)) {
            this.showMessage('Ключ недействителен', 'error');
            return;
        }
        
        // Проверка не использовался ли ключ на этом устройстве
        if (this.isKeyUsed(key)) {
            this.showMessage('Этот ключ уже был использован на этом устройстве', 'error');
            return;
        }
        
        // Проверка не использовался ли ключ вообще (базовая защита)
        const usedKeys = JSON.parse(localStorage.getItem('used_keys') || '[]');
        if (usedKeys.includes(key)) {
            this.showMessage('Этот ключ уже был использован', 'error');
            return;
        }
        
        // Активация ключа
        const activationData = {
            key: key,
            deviceId: this.deviceId,
            activatedAt: Date.now(),
            expiresAt: Date.now() + (10 * 24 * 60 * 60 * 1000), // 10 дней
            status: 'active'
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('active_key', JSON.stringify(activationData));
        
        // Добавляем ключ в список использованных
        usedKeys.push(key);
        localStorage.setItem('used_keys', JSON.stringify(usedKeys));
        
        // Сохраняем информацию об устройстве
        this.saveDeviceInfo(key);
        
        this.showMessage('Ключ успешно активирован! Доступ на 10 дней.', 'success');
        
        // Обновляем статус на всех страницах
        this.updateKeyStatus();
        
        // Очищаем поле ввода
        keyInput.value = '';
        
        // Перенаправляем на главную через 2 секунды
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
    
    validateKeyFormat(key) {
        const pattern = /^UCH-NA5-[A-Z]{3,4}-\d{3}$/;
        return pattern.test(key);
    }
    
    isKeyUsed(key) {
        const activationData = localStorage.getItem('active_key');
        if (activationData) {
            const data = JSON.parse(activationData);
            return data.key === key && data.deviceId === this.deviceId;
        }
        return false;
    }
    
    saveDeviceInfo(key) {
        const deviceInfo = {
            key: key,
            deviceId: this.deviceId,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            activated: Date.now()
        };
        
        // Сохраняем информацию об устройстве
        localStorage.setItem(`device_info_${key}`, JSON.stringify(deviceInfo));
    }
    
    checkKeyStatus() {
        const activationData = localStorage.getItem('active_key');
        
        if (activationData) {
            const data = JSON.parse(activationData);
            const now = Date.now();
            
            // Проверяем не истек ли срок
            if (now > data.expiresAt) {
                this.deactivateKey();
                return false;
            }
            
            // Проверяем привязку к устройству
            if (data.deviceId !== this.deviceId) {
                this.deactivateKey();
                return false;
            }
            
            return true;
        }
        
        return false;
    }
    
    deactivateKey() {
        localStorage.removeItem('active_key');
        this.updateKeyStatus();
    }
    
    updateKeyStatus() {
        const keyStatus = document.getElementById('keyStatus');
        const statusBadge = keyStatus?.querySelector('.status-badge');
        const timer = document.getElementById('timer');
        const daysLeft = document.getElementById('daysLeft');
        
        if (!keyStatus || !statusBadge) return;
        
        const isActive = this.checkKeyStatus();
        const activationData = localStorage.getItem('active_key');
        
        if (isActive && activationData) {
            const data = JSON.parse(activationData);
            const timeLeft = data.expiresAt - Date.now();
            const days = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
            
            // Обновляем статус
            statusBadge.textContent = 'Ключ активирован';
            statusBadge.className = 'status-badge active';
            
            // Обновляем таймер
            if (timer && daysLeft) {
                timer.style.display = 'block';
                daysLeft.textContent = days;
            }
        } else {
            statusBadge.textContent = 'Ключ не активирован';
            statusBadge.className = 'status-badge inactive';
            
            if (timer) {
                timer.style.display = 'none';
            }
        }
    }
    
    getTimeLeft() {
        const activationData = localStorage.getItem('active_key');
        if (!activationData) return null;
        
        const data = JSON.parse(activationData);
        const timeLeft = data.expiresAt - Date.now();
        
        if (timeLeft <= 0) {
            this.deactivateKey();
            return null;
        }
        
        return {
            days: Math.floor(timeLeft / (24 * 60 * 60 * 1000)),
            hours: Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)),
            minutes: Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000)),
            seconds: Math.floor((timeLeft % (60 * 1000)) / 1000),
            totalSeconds: Math.floor(timeLeft / 1000)
        };
    }
    
    showMessage(text, type = 'info') {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;
        
        messageDiv.textContent = text;
        messageDiv.className = `${type}-message`;
        messageDiv.style.display = 'block';
        
        // Скрываем сообщение через 5 секунд
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    // Метод для обфускации (базовая защита)
    obfuscateKey(key) {
        return btoa(key).split('').reverse().join('');
    }
    
    deobfuscateKey(obfuscated) {
        return atob(obfuscated.split('').reverse().join(''));
    }
}

// Инициализация системы ключей
document.addEventListener('DOMContentLoaded', () => {
    window.keySystem = new KeySystem();
    
    // Обновляем статус ключа каждую секунду
    setInterval(() => {
        window.keySystem.updateKeyStatus();
    }, 1000);
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KeySystem;
}
