const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(path.join(__dirname, 'src/data/kiosco.json'));
const db = low(adapter);

db.defaults({
  usuarios: [],
  escuelas: [],
  kioscos: [],
  productos: [],
  compras: [],
  notificaciones: [],
  auditoria: []
}).write();

const ahora = new Date();
const hace1h = new Date(ahora.getTime() - 3600000);
const hace2h = new Date(ahora.getTime() - 7200000);

// Escuelas
const esc1 = { id: uuidv4(), nombre: 'Escuela Primaria N° 1', direccion: 'Av. Siempre Viva 123', activo: true, createdAt: ahora.toISOString() };
const esc2 = { id: uuidv4(), nombre: 'Colegio Secundario San Martín', direccion: 'Belgrano 456', activo: true, createdAt: ahora.toISOString() };

// Kioscos
const kio1 = { id: uuidv4(), nombre: 'Kiosco del Recreo', escuelaId: esc1.id, activo: true, createdAt: ahora.toISOString() };
const kio2 = { id: uuidv4(), nombre: 'Kiosco Saludable', escuelaId: esc2.id, activo: true, createdAt: ahora.toISOString() };

// Productos
const productos = [
  { id: uuidv4(), nombre: 'Alfajor Tofi', categoria: 'Golosinas', precio: 1200, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Alfajor Águila', categoria: 'Golosinas', precio: 1500, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Jugo Naranja', categoria: 'Bebidas', precio: 800, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Jugo Manzana', categoria: 'Bebidas', precio: 800, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Papas Fritas Chicas', categoria: 'Snacks', precio: 1000, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Papas Fritas Grandes', categoria: 'Snacks', precio: 1800, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Chupetín', categoria: 'Golosinas', precio: 500, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Chicle', categoria: 'Golosinas', precio: 300, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Barrita de Cereal', categoria: 'Saludable', precio: 700, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Agua 500ml', categoria: 'Bebidas', precio: 600, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Galletitas Oreo', categoria: 'Snacks', precio: 900, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() },
  { id: uuidv4(), nombre: 'Caramelo Masticable', categoria: 'Golosinas', precio: 200, foto: '', activo: true, kioscoId: kio1.id, createdAt: ahora.toISOString() }
];

// Usuarios
const kiosquero1 = {
  id: uuidv4(), email: 'kiosco@kiosco.com', password: bcrypt.hashSync('kiosco123', 10),
  nombre: 'Carlos Kiosquero', rol: 'kiosquero', telefono: '1145678901',
  kioscoId: kio1.id, activo: true,
  createdAt: ahora.toISOString(), updatedAt: ahora.toISOString()
};

const padre1 = {
  id: uuidv4(), email: 'padre@kiosco.com', password: bcrypt.hashSync('padre123', 10),
  nombre: 'María García', rol: 'padre', telefono: '1122334455',
  hijos: [], activo: true,
  createdAt: ahora.toISOString(), updatedAt: ahora.toISOString()
};

const alumno1 = {
  id: uuidv4(), email: 'juan@kiosco.com', password: bcrypt.hashSync('juan123', 10),
  nombre: 'Juan García', rol: 'alumno', telefono: '',
  escuelaId: esc1.id, kioscoId: kio1.id, activo: true,
  saldo: 10000, limiteDiario: 5000, productosBloqueados: [],
  congelado: false, codigoQR: uuidv4(), codigoNumerico: '123456',
  createdAt: ahora.toISOString(), updatedAt: ahora.toISOString()
};

const alumno2 = {
  id: uuidv4(), email: 'ana@kiosco.com', password: bcrypt.hashSync('ana123', 10),
  nombre: 'Ana García', rol: 'alumno', telefono: '',
  escuelaId: esc1.id, kioscoId: kio1.id, activo: true,
  saldo: 6500, limiteDiario: 3000, productosBloqueados: [],
  congelado: false, codigoQR: uuidv4(), codigoNumerico: '789012',
  createdAt: ahora.toISOString(), updatedAt: ahora.toISOString()
};

padre1.hijos = [alumno1.id, alumno2.id];

const admin = {
  id: uuidv4(), email: 'admin@kiosco.com', password: bcrypt.hashSync('admin123', 10),
  nombre: 'Administrador', rol: 'admin', telefono: '', activo: true,
  createdAt: ahora.toISOString(), updatedAt: ahora.toISOString()
};

// Compras de ejemplo
const compras = [
  {
    id: uuidv4(), alumnoId: alumno1.id, kiosqueroId: kiosquero1.id,
    items: [
      { productoId: productos[0].id, nombre: 'Alfajor Tofi', precio: 1200, cantidad: 1 },
      { productoId: productos[2].id, nombre: 'Jugo Naranja', precio: 800, cantidad: 1 }
    ],
    total: 2000, createdAt: hace1h.toISOString()
  },
  {
    id: uuidv4(), alumnoId: alumno2.id, kiosqueroId: kiosquero1.id,
    items: [
      { productoId: productos[4].id, nombre: 'Papas Fritas Chicas', precio: 1000, cantidad: 1 },
      { productoId: productos[9].id, nombre: 'Agua 500ml', precio: 600, cantidad: 1 }
    ],
    total: 1600, createdAt: hace2h.toISOString()
  },
  {
    id: uuidv4(), alumnoId: alumno1.id, kiosqueroId: kiosquero1.id,
    items: [
      { productoId: productos[6].id, nombre: 'Chupetín', precio: 500, cantidad: 2 }
    ],
    total: 1000, createdAt: hace2h.toISOString()
  }
];

alumno1.saldo = 10000 - 2000 - 1000; // 7000
alumno2.saldo = 6500 - 1600; // 4900

// Notificaciones
const notificaciones = [
  {
    id: uuidv4(), userId: padre1.id,
    titulo: 'Juan compró:',
    mensaje: `- Alfajor Tofi $1.200\n- Jugo Naranja $800\n\nTotal: $2.000\nSaldo restante: $7.000`,
    leida: false, createdAt: hace1h.toISOString()
  },
  {
    id: uuidv4(), userId: padre1.id,
    titulo: 'Ana compró:',
    mensaje: `- Papas Fritas Chicas $1.000\n- Agua 500ml $600\n\nTotal: $1.600\nSaldo restante: $4.900`,
    leida: true, createdAt: hace2h.toISOString()
  }
];

db.set('usuarios', [admin, kiosquero1, padre1, alumno1, alumno2]).write();
db.set('escuelas', [esc1, esc2]).write();
db.set('kioscos', [kio1, kio2]).write();
db.set('productos', productos).write();
db.set('compras', compras).write();
db.set('notificaciones', notificaciones).write();
db.set('auditoria', []).write();

console.log('✅ Datos de demo cargados exitosamente');
console.log('📧 admin@kiosco.com / admin123');
console.log('📧 kiosco@kiosco.com / kiosco123');
console.log('📧 padre@kiosco.com / padre123');
console.log('📧 juan@kiosco.com / juan123');
console.log('📧 ana@kiosco.com / ana123');
