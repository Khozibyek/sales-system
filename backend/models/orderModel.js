const db = require("../config/db");

exports.getAllAdmin = async () => {
  const [rows] = await db.promise().query(
    `SELECT 
       o.order_id AS id,
       o.order_code AS order_code,
       o.total_price AS total_amount,
       UPPER(o.order_status) AS status,
       o.created_at,
       u.name AS customer_name,
       u.email AS customer_email,
       u.phone AS phone,
       p.payment_method,
       p.payment_status,
       a.city,
       a.district,
       a.subdistrict
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     LEFT JOIN payments p ON p.payment_id = o.payment_id
     LEFT JOIN addresses a ON a.address_id = o.address_id
     ORDER BY o.created_at DESC`
  );

  return rows;
};

exports.getByIdAdmin = async (orderId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      o.order_id AS id,
      o.order_code AS order_code,
      o.total_price AS total_amount,
      UPPER(o.order_status) AS status,
      o.created_at,
      u.id AS user_id,
      u.name AS customer_name,
      u.email AS customer_email,
      u.phone AS phone,
      a.city,
      a.district,
      a.subdistrict,
      a.address_detail,
      p.payment_method,
      p.payment_status,
      p.amount,
      oi.item_id,
      oi.product_id,
      oi.quantity,
      oi.price AS item_price,
      pr.name AS product_name,
      COALESCE(
        pim.image_url,
        (
          SELECT pi2.image_url
          FROM product_images pi2
          WHERE pi2.product_id = pr.id
          ORDER BY pi2.is_main DESC, pi2.id ASC
          LIMIT 1
        )
      ) AS main_image
    FROM orders o
    LEFT JOIN users u ON u.id = o.user_id
    LEFT JOIN addresses a ON a.address_id = o.address_id
    LEFT JOIN payments p ON p.payment_id = o.payment_id
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    LEFT JOIN products pr ON pr.id = oi.product_id
    LEFT JOIN product_images pim ON pim.product_id = pr.id AND pim.is_main = 1
    WHERE o.order_id = ?
    ORDER BY oi.item_id ASC
    `,
    [orderId]
  );

  if (!rows.length) {
    return null;
  }

  const base = rows[0];
  const items = rows
    .filter((row) => row.item_id)
    .map((row) => ({
      item_id: row.item_id,
      product_id: row.product_id,
      name: row.product_name,
      qty: row.quantity,
      price: Number(row.item_price || 0),
      image: row.main_image ? `/${String(row.main_image).replace(/^\/+/, "")}` : null,
    }));

  return {
    id: base.id,
    order_code: base.order_code,
    total_amount: Number(base.total_amount || 0),
    status: base.status,
    created_at: base.created_at,
    customer: {
      id: base.user_id,
      name: base.customer_name,
      email: base.customer_email,
      phone: base.phone,
    },
    address: {
      city: base.city,
      district: base.district,
      subdistrict: base.subdistrict,
      detail: base.address_detail,
    },
    payment: {
      method: base.payment_method,
      status: base.payment_status,
      amount: Number(base.amount || base.total_amount || 0),
    },
    items,
  };
};

exports.updateStatusAdmin = async (orderId, status) => {
  const [result] = await db
    .promise()
    .query("UPDATE orders SET order_status = ? WHERE order_id = ?", [status, orderId]);
  return result.affectedRows;
};


// 💳 Захиалга үүсгэх
exports.createOrder = async (userId, addressId, totalPrice, paymentMethod, cartItems) => {
  return new Promise(async (resolve, reject) => {
    db.beginTransaction(async (err) => {
      if (err) return reject(err);

      try {
        // 1️⃣ Төлбөр үүсгэх
        const [paymentResult] = await db.promise().query(
          `INSERT INTO payments (payment_method, amount, payment_status)
           VALUES (?, ?, 'PENDING')`,
          [paymentMethod, totalPrice]
        );
        const paymentId = paymentResult.insertId;

        // 2️⃣ Захиалга үүсгэх
        const [orderResult] = await db.promise().query(
          `INSERT INTO orders (user_id, address_id, total_price, payment_id, order_status)
           VALUES (?, ?, ?, ?, 'PENDING')`,
          [userId, addressId, totalPrice, paymentId]
        );
        const orderId = orderResult.insertId;

        // 3️⃣ Төлбөрт order_id-г update хийх
        await db.promise().query(
          `UPDATE payments SET order_id = ? WHERE payment_id = ?`,
          [orderId, paymentId]
        );

        // 4️⃣ Захиалгын бараанууд нэмэх + үлдэгдэл хасах
        for (const item of cartItems) {
          // 🔹 Захиалгын бараа нэмэх
          await db.promise().query(
            `INSERT INTO order_items (order_id, product_id, quantity, price)
             VALUES (?, ?, ?, ?)`,
            [orderId, item.product_id, item.quantity, item.price]
          );

          // ✅ Барааны үлдэгдэл хасах хэсэг — энд яг энэ мөрийг нэмнэ
          await db.promise().query(
            `UPDATE products 
             SET stock = GREATEST(stock - ?, 0)
             WHERE id = ?`,
            [item.quantity, item.product_id]
          );
        }

        // 5️⃣ Transaction commit
        db.commit((err) => {
          if (err) return db.rollback(() => reject(err));
          resolve({ orderId, paymentId });
        });
      } catch (error) {
        db.rollback(() => reject(error));
      }
    });
  });
};



exports.getUserOrdersWithItems = async (userId) => {
  const [rows] = await db.promise().query(
    `
    SELECT
      o.order_id,
      o.total_price,
      UPPER(o.order_status) AS order_status,
      o.created_at,
      a.city, a.district, a.subdistrict, a.address_detail,
      p.payment_method, p.payment_status,

      oi.item_id, oi.product_id, oi.quantity, oi.price AS item_price,
      pr.name AS product_name,

      /* ✅ Гол зураг: is_main=1 байвал тэр, үгүй бол эхний зураг */
      COALESCE(
        pim.image_url,
        (SELECT pi2.image_url
         FROM product_images pi2
         WHERE pi2.product_id = pr.id
         ORDER BY pi2.is_main DESC, pi2.id ASC
         LIMIT 1)
      ) AS main_image

    FROM orders o
    LEFT JOIN addresses a ON a.address_id = o.address_id
    LEFT JOIN payments p ON p.payment_id = o.payment_id
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    LEFT JOIN products pr ON pr.id = oi.product_id
    LEFT JOIN product_images pim
      ON pim.product_id = pr.id AND pim.is_main = 1

    WHERE o.user_id = ?
    ORDER BY o.created_at DESC, oi.item_id ASC
    `,
    [userId]
  );

  // ➜ Мөрүүдийг захиалга бүрээр бүлэглэж, item жагсаалт үүсгэнэ
  const byOrder = new Map();

  for (const r of rows) {
    if (!byOrder.has(r.order_id)) {
      byOrder.set(r.order_id, {
        order_id: r.order_id,
        created_at: r.created_at,
        total_price: Number(r.total_price || 0),
        order_status: r.order_status,
        address: {
          city: r.city,
          district: r.district,
          subdistrict: r.subdistrict,
          address_detail: r.address_detail,
        },
        payment: {
          method: r.payment_method,
          status: r.payment_status,
        },
        items: [],
      });
    }

    if (r.item_id) {
      byOrder.get(r.order_id).items.push({
        item_id: r.item_id,
        product_id: r.product_id,
        name: r.product_name,
        qty: r.quantity,
        price: Number(r.item_price || 0),
        // static serve: app.use("/uploads", express.static("uploads"))
        image: r.main_image ? `/${String(r.main_image).replace(/^\/+/, "")}` : null,
      });
    }
  }

  return Array.from(byOrder.values());
};
