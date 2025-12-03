// Менеджер памяток с использованием IndexedDB
class NotesManager {
    constructor() {
        this.db = null;
        this.dbName = 'UchebaNa5PlusNotes';
        this.storeName = 'notes';
        this.dbVersion = 1;
        this.init();
    }
    
    async init() {
        try {
            await this.initDB();
            this.initUI();
            await this.loadNotes();
        } catch (error) {
            console.error('Ошибка инициализации NotesManager:', error);
            this.showError('Не удалось инициализировать хранилище памяток');
        }
    }
    
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = (event) => {
                reject('Ошибка открытия базы данных');
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Создаем хранилище объектов для памяток
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    // Создаем индексы для поиска
                    objectStore.createIndex('title', 'title', { unique: false });
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('type', 'type', { unique: false });
                }
            };
        });
    }
    
    initUI() {
        // Инициализация кнопки загрузки
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
        }
        
        // Инициализация input для файлов
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }
        
        // Инициализация drag and drop
        this.initDragAndDrop();
        
        // Инициализация поиска
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchNotes(e.target.value));
        }
        
        // Инициализация фильтров
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterNotes(filter);
                
                // Обновляем активную кнопку фильтра
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }
    
    initDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        if (!dropZone) return;
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processFiles(files);
            }
        });
    }
    
    async handleFileUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            await this.processFiles(files);
            event.target.value = ''; // Сбрасываем input
        }
    }
    
    async processFiles(files) {
        const uploadProgress = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('progressBar');
        
        if (uploadProgress && progressBar) {
            uploadProgress.style.display = 'block';
            progressBar.style.width = '0%';
        }
        
        const totalFiles = files.length;
        let processedFiles = 0;
        
        for (const file of files) {
            try {
                await this.saveNote(file);
                processedFiles++;
                
                if (uploadProgress && progressBar) {
                    const progress = (processedFiles / totalFiles) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressBar.textContent = `${Math.round(progress)}%`;
                }
            } catch (error) {
                console.error('Ошибка обработки файла:', error);
                this.showError(`Ошибка загрузки файла: ${file.name}`);
            }
        }
        
        if (uploadProgress) {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
            }, 1000);
        }
        
        await this.loadNotes();
        this.showSuccess(`Загружено ${processedFiles} из ${totalFiles} файлов`);
    }
    
    async saveNote(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('Поддерживаются только изображения'));
                return;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB лимит
                reject(new Error('Файл слишком большой (максимум 10MB)'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const note = {
                        title: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result,
                        date: new Date().toISOString(),
                        tags: []
                    };
                    
                    await this.saveToIndexedDB(note);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Ошибка чтения файла'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    saveToIndexedDB(note) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(note);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                reject(new Error('Ошибка сохранения в базу данных'));
            };
        });
    }
    
    async loadNotes(filter = 'all') {
        try {
            const notes = await this.getAllNotes();
            this.displayNotes(notes, filter);
        } catch (error) {
            console.error('Ошибка загрузки памяток:', error);
            this.showError('Не удалось загрузить памятки');
        }
    }
    
    getAllNotes() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };
            
            request.onerror = (event) => {
                reject(new Error('Ошибка чтения из базы данных'));
            };
        });
    }
    
    displayNotes(notes, filter = 'all') {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return;
        
        // Фильтрация заметок
        let filteredNotes = notes;
        if (filter !== 'all') {
            filteredNotes = notes.filter(note => note.type.startsWith(`image/${filter}`));
        }
        
        if (filteredNotes.length === 0) {
            notesContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>Нет памяток</h3>
                    <p>Перетащите сюда изображения или нажмите "Загрузить фото"</p>
                </div>
            `;
            return;
        }
        
        // Сортируем по дате (новые сначала)
        filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '<div class="notes-grid">';
        
        filteredNotes.forEach(note => {
            const date = new Date(note.date).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const sizeMB = (note.size / (1024 * 1024)).toFixed(2);
            
            html += `
                <div class="note-card fade-in" data-id="${note.id}">
                    <div class="note-image-container">
                        <img src="${note.data}" 
                             alt="${note.title}" 
                             class="note-image"
                             loading="lazy"
                             onclick="window.notesManager.viewNote(${note.id})">
                        <div class="note-overlay">
                            <button class="note-action-btn" onclick="window.notesManager.viewNote(${note.id})">
                                👁️ Просмотр
                            </button>
                            <button class="note-action-btn delete-btn" onclick="window.notesManager.deleteNote(${note.id})">
                                🗑️ Удалить
                            </button>
                        </div>
                    </div>
                    <div class="note-info">
                        <h4 class="note-title" title="${note.title}">${this.truncateText(note.title, 30)}</h4>
                        <div class="note-meta">
                            <span class="note-date">${date}</span>
                            <span class="note-size">${sizeMB} MB</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        notesContainer.innerHTML = html;
    }
    
    async viewNote(id) {
        try {
            const note = await this.getNoteById(id);
            if (note) {
                this.showNoteModal(note);
            }
        } catch (error) {
            console.error('Ошибка просмотра заметки:', error);
            this.showError('Не удалось открыть памятку');
        }
    }
    
    getNoteById(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                reject(new Error('Ошибка чтения заметки'));
            };
        });
    }
    
    showNoteModal(note) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'note-modal fade-in';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        `;
        
        const date = new Date(note.date).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        modal.innerHTML = `
            <div style="max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column;">
                <div style="background: var(--bg-card); padding: 1rem; border-radius: 8px 8px 0 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; color: var(--text-primary);">${note.title}</h3>
                        <button onclick="this.closest('.note-modal').remove()" 
                                style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-primary);">
                            ×
                        </button>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">
                        <span>${date}</span>
                        <span style="margin-left: 1rem;">${(note.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                </div>
                <div style="flex: 1; overflow: auto; background: black;">
                    <img src="${note.data}" 
                         alt="${note.title}" 
                         style="max-width: 100%; height: auto; display: block;">
                </div>
                <div style="background: var(--bg-card); padding: 1rem; border-radius: 0 0 8px 8px; display: flex; gap: 0.5rem;">
                    <button onclick="window.notesManager.downloadNote(${note.id})" 
                            style="flex: 1; padding: 0.5rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📥 Скачать
                    </button>
                    <button onclick="window.notesManager.deleteNote(${note.id}, true)" 
                            style="flex: 1; padding: 0.5rem; background: var(--error-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие по ESC
        const closeModal = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', closeModal);
            }
        };
        
        document.addEventListener('keydown', closeModal);
        
        // Закрытие по клику вне изображения
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', closeModal);
            }
        });
    }
    
    async deleteNote(id, fromModal = false) {
        if (!confirm('Удалить эту памятку?')) {
            return;
        }
        
        try {
            await this.deleteFromIndexedDB(id);
            
            if (fromModal) {
                const modal = document.querySelector('.note-modal');
                if (modal) modal.remove();
            }
            
            await this.loadNotes();
            this.showSuccess('Памятка удалена');
        } catch (error) {
            console.error('Ошибка удаления заметки:', error);
            this.showError('Не удалось удалить памятку');
        }
    }
    
    deleteFromIndexedDB(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('База данных не инициализирована'));
                return;
            }
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                resolve();
            };
            
            request.onerror = (event) => {
                reject(new Error('Ошибка удаления из базы данных'));
            };
        });
    }
    
    async downloadNote(id) {
        try {
            const note = await this.getNoteById(id);
            if (note) {
                const link = document.createElement('a');
                link.href = note.data;
                link.download = note.title;
                link.click();
            }
        } catch (error) {
            console.error('Ошибка скачивания заметки:', error);
            this.showError('Не удалось скачать памятку');
        }
    }
    
    async searchNotes(query) {
        try {
            const notes = await this.getAllNotes();
            const filteredNotes = notes.filter(note => 
                note.title.toLowerCase().includes(query.toLowerCase())
            );
            this.displayNotes(filteredNotes);
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    }
    
    async filterNotes(filter) {
        await this.loadNotes(filter);
    }
    
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
    
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// Инициализация менеджера памяток
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('notesContainer')) {
        window.notesManager = new NotesManager();
    }
});
