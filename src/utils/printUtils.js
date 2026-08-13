/**
 * Utilitários para Impressão de Produção de Bar e Cozinha
 */

/**
 * Agrupa itens de uma comanda por setor de produção (Cozinha vs Bar)
 * @param {Array<Object>} items - Itens da comanda
 * @param {Array<Object>} products - Cadastro de produtos para consulta de categoria
 * @returns {{ kitchen: Array<Object>, bar: Array<Object>, others: Array<Object> }}
 */
export function groupItemsBySector(items = [], products = []) {
  const kitchen = [];
  const bar = [];
  const others = [];

  items.forEach(item => {
    const p = products.find(prod => prod.id === item.productId);
    const category = (p?.category || '').toLowerCase();
    const itemWithProduct = {
      ...item,
      productName: p?.name || `Item #${item.productId}`,
      category
    };

    if (category === 'bebidas') {
      bar.push(itemWithProduct);
    } else if (category === 'porcoes' || category === 'pratos' || category === 'sobremesas') {
      kitchen.push(itemWithProduct);
    } else {
      others.push(itemWithProduct);
    }
  });

  return { kitchen, bar, others };
}

/**
 * Marca os itens especificados como impressos no banco IndexedDB
 * @param {Object} db - Instância Dexie DB
 * @param {Array<number>} itemIds - IDs dos orderItems
 */
export async function markItemsAsPrinted(db, itemIds = []) {
  if (!db || !itemIds.length) return;
  await db.transaction('rw', db.orderItems, async () => {
    for (const id of itemIds) {
      await db.orderItems.update(id, { printed: true });
    }
  });
}
