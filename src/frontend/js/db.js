// Offline cache using IndexedDB via simple wrapper
const DB = {
  _db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('kiosco_offline', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('productos')) {
          db.createObjectStore('productos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('compras')) {
          db.createObjectStore('compras', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('usuarios')) {
          db.createObjectStore('usuarios', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => { this._db = e.target.result; resolve(); };
      req.onerror = (e) => { reject(e.target.error); };
    });
  },

  _store(name) {
    const tx = this._db.transaction(name, 'readwrite');
    return tx.objectStore(name);
  },

  async save(store, data) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).put(data);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async getAll(store) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async get(store, id) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async delete(store, id) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  },

  async clear(store) {
    return new Promise((resolve, reject) => {
      const req = this._store(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = (e) => reject(e.target.error);
    });
  }
};
