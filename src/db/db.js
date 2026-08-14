import Dexie from 'dexie';

export const db = new Dexie('EscunasDB');

db.version(1).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date',
  orders: '++id, orderNumber, status, date, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status'
});

db.version(2).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date',
  orders: '++id, orderNumber, tableNumber, status, date, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status'
}).upgrade(tx => {
  return tx.table('orders').toCollection().modify(order => {
    if (order.tableNumber === undefined) {
      order.tableNumber = order.orderNumber || '?';
    }
  });
});

db.version(3).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date',
  orders: '++id, orderNumber, tableNumber, status, date, hasTax, hasCouvert, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status'
}).upgrade(tx => {
  return tx.table('orders').toCollection().modify(order => {
    if (order.hasTax === undefined) order.hasTax = true;
    if (order.hasCouvert === undefined) order.hasCouvert = false;
  });
});

db.version(4).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date',
  orders: '++id, orderNumber, tableNumber, status, date, hasTax, hasCouvert, couvertValue, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status'
}).upgrade(tx => {
  return tx.table('orders').toCollection().modify(order => {
    if (order.couvertValue === undefined) order.couvertValue = 12.00;
  });
});

db.version(5).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date',
  orders: '++id, orderNumber, tableNumber, status, date, hasTax, hasCouvert, couvertValue, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status',
  cash_movements: '++id, type, amount, description, user, date'
});

db.version(6).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, stock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date, boardingStatus, boardedAt',
  orders: '++id, orderNumber, tableNumber, status, date, hasTax, hasCouvert, couvertValue, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status',
  cash_movements: '++id, type, amount, description, user, date'
}).upgrade(tx => {
  return tx.table('tickets').toCollection().modify(ticket => {
    if (!ticket.boardingStatus) ticket.boardingStatus = 'pending';
  });
});

db.version(8).stores({
  users: '++id, username, password, role',
  products: '++id, code, name, category, price, costPrice, stock, minStock, [category+name]',
  tickets: '++id, ticketNumber, passengerType, agency, price, status, date, boardingStatus, boardedAt',
  orders: '++id, orderNumber, tableNumber, status, date, hasTax, hasCouvert, couvertValue, discountValue, discountType, paymentMethod, [status+date]',
  orderItems: '++id, orderId, productId, quantity, price, printed',
  sync_queue: '++id, type, action, payload, status',
  cash_movements: '++id, type, amount, description, user, date'
}).upgrade(tx => {
  return tx.table('products').toCollection().modify(product => {
    if (product.costPrice === undefined) product.costPrice = product.price ? product.price * 0.4 : 0;
    if (product.minStock === undefined) product.minStock = 10;
  });
});

// Seed Initial Data
db.on('populate', async () => {
  await db.users.bulkAdd([
    { username: 'admin', password: '123', role: 'admin' },
    { username: 'caixa', password: '123', role: 'caixa' },
  ]);

  await db.products.bulkAdd([
    { code: '01', name: 'AGUA S/ GAS',    category: 'bebidas',    price: 4.00,  costPrice: 1.50, stock: 100, minStock: 15 },
    { code: '02', name: 'AGUA C/ GAS',    category: 'bebidas',    price: 5.00,  costPrice: 2.00, stock: 100, minStock: 15 },
    { code: '03', name: 'REFRIGERANTE',   category: 'bebidas',    price: 6.00,  costPrice: 2.50, stock: 150, minStock: 20 },
    { code: '04', name: 'CERVEJA LATA',   category: 'bebidas',    price: 8.00,  costPrice: 3.50, stock: 200, minStock: 30 },
    { code: '06', name: 'CAIPIRINHA',     category: 'bebidas',    price: 15.00, costPrice: 4.00, stock: 50,  minStock: 10 },
    { code: '24', name: 'BATATA FRITA',   category: 'porcoes',    price: 30.00, costPrice: 9.00, stock: 30,  minStock: 5  },
    { code: '25', name: 'CAMARAO MEDIO',  category: 'porcoes',    price: 45.00, costPrice: 18.00, stock: 20, minStock: 5  },
    { code: '18', name: 'SALADA',         category: 'pratos',     price: 20.00, costPrice: 6.00, stock: 15,  minStock: 5  },
    { code: '21', name: 'VEGETARIANO',    category: 'pratos',     price: 35.00, costPrice: 10.00, stock: 10, minStock: 3  },
    { code: '35', name: 'DOCE',           category: 'sobremesas', price: 5.00,  costPrice: 1.50, stock: 40,  minStock: 10 },
  ]);

  const now = new Date();
  const ts = (minAgo) => new Date(now.getTime() - minAgo * 60000).toISOString();

  const o1 = await db.orders.add({ orderNumber: '001', tableNumber: '3',  status: 'open',   date: ts(45),  total: 67.00,  hasTax: true,  hasCouvert: false, couvertValue: 12.00 });
  const o2 = await db.orders.add({ orderNumber: '002', tableNumber: '7',  status: 'open',   date: ts(90),  total: 38.00,  hasTax: true,  hasCouvert: true,  couvertValue: 12.00 });
  const o3 = await db.orders.add({ orderNumber: '003', tableNumber: '1',  status: 'closed', date: ts(180), total: 120.00, hasTax: true,  hasCouvert: false, couvertValue: 12.00, paymentMethod: 'Dinheiro' });
  const o4 = await db.orders.add({ orderNumber: '004', tableNumber: '12', status: 'open',   date: ts(15),  total: 52.00,  hasTax: false, hasCouvert: false, couvertValue: 12.00 });
  const o5 = await db.orders.add({ orderNumber: '005', tableNumber: '5',  status: 'open',   date: ts(120), total: 94.00,  hasTax: true,  hasCouvert: true,  couvertValue: 12.00 });

  await db.orderItems.bulkAdd([
    { orderId: o1, productId: 4, quantity: 3, price: 8.00,  printed: false },
    { orderId: o1, productId: 5, quantity: 1, price: 15.00, printed: false },
    { orderId: o1, productId: 6, quantity: 1, price: 30.00, printed: false },

    { orderId: o2, productId: 1, quantity: 2, price: 4.00,  printed: false },
    { orderId: o2, productId: 3, quantity: 5, price: 6.00,  printed: false },

    { orderId: o3, productId: 7, quantity: 2, price: 45.00, printed: true  },
    { orderId: o3, productId: 9, quantity: 1, price: 35.00, printed: true  },

    { orderId: o4, productId: 4, quantity: 4, price: 8.00,  printed: false },
    { orderId: o4, productId: 6, quantity: 1, price: 30.00, printed: false },

    { orderId: o5, productId: 6, quantity: 2, price: 30.00, printed: false },
    { orderId: o5, productId: 7, quantity: 1, price: 45.00, printed: false },
  ]);

  await db.cash_movements.bulkAdd([
    { type: 'opening', amount: 200.00, description: 'Abertura do Caixa (Fundo de Troco Inicial)', user: 'caixa', date: ts(240) },
    { type: 'suprimento', amount: 50.00, description: 'Reforço de moedas para troco', user: 'caixa', date: ts(150) },
    { type: 'sangria', amount: 100.00, description: 'Sangria preventiva para o cofre', user: 'admin', date: ts(60) },
  ]);
});
