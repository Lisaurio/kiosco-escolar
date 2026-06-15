const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../../data');
const adapter = new FileSync(path.join(DATA_DIR, 'kiosco.json'));

const defaultData = {
  usuarios: [
    {
      id: uuidv4(),
      email: 'admin@kiosco.com',
      password: bcrypt.hashSync('admin123', 10),
      nombre: 'Administrador',
      rol: 'admin',
      telefono: '',
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  escuelas: [],
  kioscos: [],
  productos: [],
  compras: [],
  notificaciones: [],
  auditoria: []
};

const db = low(adapter);
db.defaults(defaultData).write();

class Database {
  getDb() {
    return {
      data: db.getState(),
      write: () => db.write()
    };
  }
}

module.exports = new Database();
