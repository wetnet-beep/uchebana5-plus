// Основной файл приложения
class App {
    constructor() {
        this.init();
    }
    
    init() {
        // Инициализация темы
        this.initTheme();
        
        // Инициализация навигации
        this.initNavigation();
        
        // Инициализация кнопки переключения темы
        this.initThemeToggle();
        
        // Проверка поддержки PWA
        this.checkPWA();
        
        // Обновление статуса онлайн/оффлайн
        this.initOnlineStatus();
        
        // Счетчик посещений
        this.updateVisitCounter();
    }
    
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }
    
    initThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeIcon(newTheme);
            });
        }
    }
    
    updateThemeIcon(theme) {
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
    }
    
    initNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    checkPWA() {
        // Проверка возможности установки PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });
    }
    
    showInstallPrompt() {
        // Можно добавить кнопку установки при необходимости
        console.log('Приложение можно установить');
    }
    
    initOnlineStatus() {
        window.addEventListener('online', () => {
            this.showToast('Вы онлайн', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showToast('Вы оффлайн. Работаем в автономном режиме.', 'warning');
        });
    }
    
    showToast(message, type = 'info') {
        // Создаем тост
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            toast.style.backgroundColor = '#4caf50';
        } else if (type === 'warning') {
            toast.style.backgroundColor = '#ff9800';
        } else if (type === 'error') {
            toast.style.backgroundColor = '#f44336';
        } else {
            toast.style.backgroundColor = '#2196f3';
        }
        
        document.body.appendChild(toast);
        
        // Удаляем тост через 3 секунды
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    updateVisitCounter() {
        let visits = localStorage.getItem('visitCount') || 0;
        visits = parseInt(visits) + 1;
        localStorage.setItem('visitCount', visits);
        
        // Можно отображать где-нибудь в интерфейсе
        console.log(`Количество посещений: ${visits}`);
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Утилиты
const Utils = {
    formatTime(seconds) {
        const days = Math.floor(seconds / (24 * 3600));
        const hours = Math.floor((seconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (days > 0) {
            return `${days}д ${hours}ч`;
        } else if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else {
            return `${minutes}м ${secs}с`;
        }
    },
    
    generateDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + 
                      '_' + Date.now().toString(36);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    },
    
    sanitizeInput(input) {
        return input.replace(/[<>]/g, '');
    }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { App, Utils };
}
