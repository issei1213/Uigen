import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrdersOlderThanDays } from "./queries/order_queries";
import { sendPendingOrderAlert } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  // 3日以上未処理の注文をチェック
  await checkPendingOrders(db);
}

async function checkPendingOrders(db: any) {
  try {
    console.log("3日以上未処理の注文をチェック中...");

    // 3日以上未処理の注文を取得
    const pendingOrders = await getPendingOrdersOlderThanDays(db, 3);

    if (pendingOrders.length === 0) {
      console.log("3日以上未処理の注文はありません。");
      return;
    }

    console.log(`${pendingOrders.length}件の未処理注文が見つかりました。`);

    // 各未処理注文に対してSlackアラートを送信
    for (const order of pendingOrders) {
      try {
        await sendPendingOrderAlert(
          order.customer_name,
          order.phone || "電話番号なし",
          order.order_number,
          order.days_since_created,
        );

        console.log(`注文 ${order.order_number} のアラートを送信しました。`);
      } catch (error) {
        console.error(
          `注文 ${order.order_number} のアラート送信に失敗:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("未処理注文チェック中にエラーが発生:", error);
  }
}

main();
