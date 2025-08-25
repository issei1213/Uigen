import https from "https";

// Slack Webhook URLの設定（環境変数から取得）
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

/**
 * Slackにメッセージを送信する関数
 */
export function sendSlackMessage(message: SlackMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!SLACK_WEBHOOK_URL) {
      reject(new Error("SLACK_WEBHOOK_URL環境変数が設定されていません"));
      return;
    }

    const payload = JSON.stringify({
      channel: message.channel || "#order-alerts",
      text: message.text,
      username: message.username || "Order Alert Bot",
      icon_emoji: message.icon_emoji || ":warning:",
    });

    const url = new URL(SLACK_WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve();
      } else {
        reject(
          new Error(`Slack API request failed with status ${res.statusCode}`),
        );
      }
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * 未処理注文に関するSlackアラートを送信する
 */
export function sendPendingOrderAlert(
  customerName: string,
  phone: string,
  orderNumber: string,
  daysOverdue: number,
): Promise<void> {
  const message: SlackMessage = {
    text:
      `🚨 *未処理注文アラート* 🚨\n\n` +
      `**注文番号:** ${orderNumber}\n` +
      `**顧客名:** ${customerName}\n` +
      `**電話番号:** ${phone}\n` +
      `**放置期間:** ${daysOverdue}日\n\n` +
      `この注文は${daysOverdue}日間放置されています。早急にフォローアップが必要です。`,
    channel: "#order-alerts",
  };

  return sendSlackMessage(message);
}
