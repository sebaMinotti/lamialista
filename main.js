const app = Vue.createApp({
    data() {
        return {
            lista: [],
            fatte: [],
            nonFatte: [],
            rimandate: [],
            newTodo: '',
            newPriority: 'media', // valore predefinito
            newCategory: '',
            newDueDate: '',
            categories: ['personale', 'lavoro', 'shopping', 'salute', 'altro'],
            customCategory: '',
            searchTerm: '',
            filterCategory: '',
            filterPriority: '',
            showCompletedTasks: true,
            showPostponedTasks: true,
            editingTask: null,
        }
    },
    computed: {
        // Filtra la lista dei task in base ai criteri di ricerca e filtro
        filteredTasks() {
            return this.lista.filter(task => {
                // Filtra in base al termine di ricerca
                if (this.searchTerm && !task.text.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                    return false;
                }
                
                // Filtra in base alla categoria
                if (this.filterCategory && task.category !== this.filterCategory) {
                    return false;
                }
                
                // Filtra in base alla priorità
                if (this.filterPriority && task.priority !== this.filterPriority) {
                    return false;
                }
                
                return true;
            });
        },
        
        // Filtra le attività completate
        filteredCompletedTasks() {
            if (!this.showCompletedTasks) return [];
            
            return this.fatte.filter(task => {
                if (this.searchTerm && !task.text.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                    return false;
                }
                
                if (this.filterCategory && task.category !== this.filterCategory) {
                    return false;
                }
                
                if (this.filterPriority && task.priority !== this.filterPriority) {
                    return false;
                }
                
                return true;
            });
        },
        
        // Filtra le attività rimandate
        filteredPostponedTasks() {
            if (!this.showPostponedTasks) return [];
            
            return this.rimandate.filter(task => {
                if (this.searchTerm && !task.text.toLowerCase().includes(this.searchTerm.toLowerCase())) {
                    return false;
                }
                
                if (this.filterCategory && task.category !== this.filterCategory) {
                    return false;
                }
                
                if (this.filterPriority && task.priority !== this.filterPriority) {
                    return false;
                }
                
                return true;
            });
        }
    },
    methods: {
        elimina() {
            if (confirm('Sei sicuro di voler eliminare tutti i task?')) {
                this.fatte = [];
                this.nonFatte = [];
                this.rimandate = [];
                this.lista = [];
                this.salva();
            }
        },
        
        salva() {
            // Salva tutte le liste in un'unica chiave
            localStorage.setItem('todolist', JSON.stringify({
                lista: this.lista,
                fatte: this.fatte,
                nonFatte: this.nonFatte,
                rimandate: this.rimandate,
                categories: this.categories
            }));
        },
        
        addCategory() {
            if (this.customCategory.trim() !== '' && !this.categories.includes(this.customCategory)) {
                this.categories.push(this.customCategory);
                this.newCategory = this.customCategory;
                this.customCategory = '';
                this.salva();
            }
        },
        
        aggiungi() {
            if (this.newTodo.trim() === '') {
                alert('Non lasciare campi vuoti');
                return;
            }
            
            // Se non ci sono duplicati nel testo
            if (!this.lista.some(task => task.text === this.newTodo)) {
                // Crea un nuovo oggetto task
                const newTask = {
                    id: Date.now(), // ID unico basato sul timestamp
                    text: this.newTodo,
                    priority: this.newPriority,
                    category: this.newCategory || 'altro',
                    dueDate: this.newDueDate || null,
                    createdAt: new Date().toISOString()
                };
                
                this.lista.push(newTask);
                
                // Reset dei campi input
                this.newTodo = '';
                this.newDueDate = '';
                this.newPriority = 'media';
                
                this.salva();
            } else {
                alert('Questo task esiste già!');
            }
        },
        
        startEdit(task) {
            this.editingTask = { ...task };
        },
        
        saveEdit() {
            if (this.editingTask) {
                // Trova l'indice del task nella lista corretta
                const listName = this.getTaskListName(this.editingTask.id);
                if (!listName) return;
                
                const taskIndex = this[listName].findIndex(t => t.id === this.editingTask.id);
                if (taskIndex !== -1) {
                    // Aggiorna il task
                    this[listName][taskIndex] = { ...this.editingTask };
                    this.salva();
                }
                
                this.editingTask = null;
            }
        },
        
        cancelEdit() {
            this.editingTask = null;
        },
        
        getTaskListName(taskId) {
            // Controlla in quale lista si trova il task
            if (this.lista.some(t => t.id === taskId)) return 'lista';
            if (this.fatte.some(t => t.id === taskId)) return 'fatte';
            if (this.rimandate.some(t => t.id === taskId)) return 'rimandate';
            return null;
        },
        
        taskFatte(index) {
            const task = this.lista[index];
            if (!this.fatte.some(t => t.id === task.id)) {
                task.completedAt = new Date().toISOString();
                this.fatte.push(task);
                this.lista.splice(index, 1);
                this.salva();
            }
        },
        
        taskNonFatte(index, listName = 'lista') {
            if (listName === 'lista') {
                this.lista.splice(index, 1);
            } else if (listName === 'rimandate') {
                this.rimandate.splice(index, 1);
            }
            this.salva();
        },
        
        eliminaRimandate(index) {
            const task = this.rimandate[index];
            if (!this.fatte.some(t => t.id === task.id)) {
                task.completedAt = new Date().toISOString();
                this.fatte.push(task);
                this.rimandate.splice(index, 1);
                this.salva();
            }
        },
        
        taskRimandate(index) {
            const task = this.lista[index];
            // Quando si rimanda, chiedi una nuova data
            const newDate = prompt("Quando vuoi riprendere questo task? (YYYY-MM-DD)");
            if (newDate) {
                task.postponedUntil = newDate;
            }
            
            if (!this.rimandate.some(t => t.id === task.id)) {
                this.rimandate.push(task);
                this.lista.splice(index, 1);
                this.salva();
            }
        },
        
        mostraMappe(faccenda) {
            if (!faccenda || typeof faccenda !== 'string' && typeof faccenda.text !== 'string') return false;
            
            const testo = typeof faccenda === 'string' ? faccenda : faccenda.text;
            const parolaChiave = ['palestra', 'supermercato', 'banca', 'farmacia', 'ristorante', 'pizzeria', 'pub', 'dentista', 'ospedale', 'medico', 'canile', 'gattile'];
            return parolaChiave.some(parola => testo.toLowerCase().includes(parola));
        },
        
        generaLinkMappe(faccenda) {
            const testo = typeof faccenda === 'string' ? faccenda : faccenda.text;
            const query = encodeURIComponent(testo);
            if (/iphone|ipad|/.test(navigator.userAgent)) {
                return `maps://?q=${query}`;
            } else {
                return `https://www.google.com/maps/search/?api=1&query=${query}`;
            }
        },
        
        // Formatta una data in formato leggibile
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString();
        },
        
        // Controlla se un task è scaduto
        isOverdue(task) {
            if (!task.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
        },
        
        // Controlla se un task è in scadenza oggi
        isDueToday(task) {
            if (!task.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
        },
        
        // Ottiene la classe CSS per la priorità
        getPriorityClass(priority) {
            switch(priority) {
                case 'alta': return 'priority-high';
                case 'media': return 'priority-medium';
                case 'bassa': return 'priority-low';
                default: return '';
            }
        },
        
        // Ottieni l'icona per la categoria
        getCategoryIcon(category) {
            switch(category) {
                case 'personale': return 'fa-user';
                case 'lavoro': return 'fa-briefcase';
                case 'shopping': return 'fa-shopping-cart';
                case 'salute': return 'fa-heart';
                default: return 'fa-tag';
            }
        },
        
        // Ottieni il colore per la categoria
        getCategoryColor(category) {
            switch(category) {
                case 'personale': return '#6c5ce7';
                case 'lavoro': return '#0984e3';
                case 'shopping': return '#00b894';
                case 'salute': return '#e84393';
                default: return '#636e72';
            }
        },
        
        // Reset tutti i filtri
        resetFilters() {
            this.searchTerm = '';
            this.filterCategory = '';
            this.filterPriority = '';
            this.showCompletedTasks = true;
            this.showPostponedTasks = true;
        }
    },
    mounted() {
        const data = localStorage.getItem('todolist');
        if (data) {
            const saved = JSON.parse(data);
            
            // Migrazione dati vecchi (string) -> nuovi (object)
            if (saved.lista && saved.lista.length && typeof saved.lista[0] === 'string') {
                this.lista = saved.lista.map(text => ({
                    id: Date.now() + Math.random(),
                    text: text,
                    priority: 'media',
                    category: 'altro',
                    dueDate: null,
                    createdAt: new Date().toISOString()
                }));
            } else {
                this.lista = saved.lista || [];
            }
            
            // Migrazione dati vecchi (string) -> nuovi (object) per attività completate
            if (saved.fatte && saved.fatte.length && typeof saved.fatte[0] === 'string') {
                this.fatte = saved.fatte.map(text => ({
                    id: Date.now() + Math.random(),
                    text: text,
                    priority: 'media',
                    category: 'altro',
                    completedAt: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }));
            } else {
                this.fatte = saved.fatte || [];
            }
            
            // Migrazione dati vecchi (string) -> nuovi (object) per attività rimandate
            if (saved.rimandate && saved.rimandate.length && typeof saved.rimandate[0] === 'string') {
                this.rimandate = saved.rimandate.map(text => ({
                    id: Date.now() + Math.random(),
                    text: text,
                    priority: 'media',
                    category: 'altro',
                    postponedUntil: null,
                    createdAt: new Date().toISOString()
                }));
            } else {
                this.rimandate = saved.rimandate || [];
            }
            
            this.nonFatte = saved.nonFatte || [];
            
            // Carica categorie salvate o usa predefinite
            if (saved.categories && Array.isArray(saved.categories)) {
                this.categories = saved.categories;
            }
        }
        
        // Controllo periodico per task scaduti o da riprendere
        setInterval(() => {
            const today = new Date();
            
            // Controlla se ci sono task rimandati da riprendere
            const tasksToResume = this.rimandate.filter(task => {
                if (!task.postponedUntil) return false;
                const resumeDate = new Date(task.postponedUntil);
                return resumeDate <= today;
            });
            
            // Sposta i task da riprendere nella lista principale
            if (tasksToResume.length > 0) {
                tasksToResume.forEach(task => {
                    const index = this.rimandate.findIndex(t => t.id === task.id);
                    if (index !== -1) {
                        this.rimandate.splice(index, 1);
                        delete task.postponedUntil; // Rimuovi la data di ripresa
                        this.lista.push(task);
                    }
                });
                
                this.salva();
                
                if (tasksToResume.length === 1) {
                    alert(`Un task rimandato è stato ripristinato: ${tasksToResume[0].text}`);
                } else {
                    alert(`${tasksToResume.length} task rimandati sono stati ripristinati`);
                }
            }
        }, 60000); // Controlla ogni minuto
    }
});

app.mount("#app");
