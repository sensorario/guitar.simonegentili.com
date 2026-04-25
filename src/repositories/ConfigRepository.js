class ConfigRepository {
    constructor() {
        this.storageKey = 'guitar-app-config';
    }

    /**
     * Carica la configurazione dal localStorage
     * @returns {Object} La configurazione salvata o i valori di default
     */
    load() {
        try {
            const savedConfig = localStorage.getItem(this.storageKey);
            if (savedConfig) {
                return JSON.parse(savedConfig);
            }
        } catch (error) {
            console.error('Errore nel caricamento della configurazione:', error);
        }

        // Restituisce la configurazione di default se non c'è niente salvato
        return this.getDefaultConfig();
    }

    /**
     * Salva la configurazione nel localStorage
     * @param {Object} config - La configurazione da salvare
     */
    save(config) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(config));
        } catch (error) {
            console.error('Errore nel salvataggio della configurazione:', error);
        }
    }

    /**
     * Aggiorna una singola proprietà della configurazione
     * @param {string} key - La chiave da aggiornare
     * @param {*} value - Il nuovo valore
     */
    update(key, value) {
        const config = this.load();
        config[key] = value;
        this.save(config);
    }

    /**
     * Cancella la configurazione salvata
     */
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Errore nella cancellazione della configurazione:', error);
        }
    }

    /**
     * Restituisce la configurazione di default
     * @returns {Object}
     */
    getDefaultConfig() {
        return {
            useItalianNotation: false,
            // Altre configurazioni future possono essere aggiunte qui
        };
    }
}

// Esporta un'istanza singleton
export default new ConfigRepository();
