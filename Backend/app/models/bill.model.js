const sql = require("../database/connection");

exports.create = async (bill) => {
  bill.subtotal = 0;
  bill.status = true;
  bill.checkout_at = 0;
  bill.created_at = Date.now();
  bill.updated_at = Date.now();

  try {
    const [result, fields] = await sql.query(`INSERT INTO bills SET ?`, bill);

    console.log(
      `Inserted ${result.affectedRows} bill >>> id: ${result.insertId}`
    );
    return { bill_id: result.insertId, ...bill };
  } catch (error) {
    console.log(error);
  }
};

exports.update = async (bill) => {
  bill.updated_at = Date.now();

  try {
    const [result, fields] = await sql.query(
      `UPDATE bills SET ? WHERE bill_id = '${bill.bill_id}'`,
      bill
    );

    console.log(`Updated bill >>> id: ${bill.bill_id}`);
  } catch (error) {
    console.log(error);
  }
};

exports.getLatestBillByTable = async (bill) => {
  try {
    const [result, fields] = await sql.query(
      `SELECT * FROM bills
        WHERE
          table_id = ${bill.table_id}
          AND checkout_at = 0
        ORDER BY created_at DESC
        LIMIT 1`
    );

    if (result.length) {
      console.log(`Found bill >>> id: ${result[0].bill_id}`);
      return { isFound: true, ...result[0] };
    } else {
      console.log(`Not found bill >>> id: ${bill.table_id}`);
      return { isFound: false };
    }
  } catch (error) {
    console.log(error);
  }
};

exports.getBillSummary = async (bill) => {
  try {
    const [result, fields] = await sql.query(
      `SELECT
        MM.product_id,
        MM.price,
        SUM(OM.quantity) AS quantity,
        GROUP_CONCAT(COALESCE(comment, '-') SEPARATOR ', ') AS comment,
        (
          SELECT
            IMM.name
          FROM
            info_main_menus IMM
          WHERE
            IMM.product_id = MM.product_id
            AND IMM.language = 'en'
            AND IMM.status = 1
        ) AS en,
        (
          SELECT
            IMM.name
          FROM
            info_main_menus IMM
          WHERE
            IMM.product_id = MM.product_id
            AND IMM.language = 'jp'
            AND IMM.status = 1
        ) AS jp,
        (
          SELECT
            IMM.name
          FROM
            info_main_menus IMM
          WHERE
            IMM.product_id = MM.product_id
            AND IMM.language = 'th'
            AND IMM.status = 1
        ) AS th
        FROM
          bills B,
          orders O,
          order_menus OM,
          main_menus MM
        WHERE
          B.bill_id = ${bill.bill_id}
          AND B.bill_id = O.bill_id
          AND O.order_id = OM.order_id
          AND MM.product_id = OM.product_id
          AND O.status = 'ordered'
        GROUP BY
          OM.product_id,
          OM.ramen_id`
    );

    console.log(`Selected ${result.length} menu(s) >>> bill id: ${bill.bill_id}`);
    return result;
  } catch (error) {
    console.log(error);
  }
};
