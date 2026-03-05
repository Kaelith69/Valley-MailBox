const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");
const { logger } = require("firebase-functions");

admin.initializeApp();

// You will need to set these via the Firebase CLI:
// firebase functions:secrets:set TELEGRAM_BOT_TOKEN
// firebase functions:secrets:set TELEGRAM_CHAT_ID

exports.notifyTelegramOnNewLetter = onDocumentCreated(
  {
    document: "valley_letters/{letterId}",
    secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]
  },
  async (event) => {
    const newLetter = event.data.data();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      logger.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID secrets.");
      return;
    }

    const name = newLetter.name || "Unknown Farmer";
    const category = newLetter.category || "Letter";
    const message = newLetter.message || "";
    const contact = newLetter.contact ? `\nContact: ${newLetter.contact}` : "";

    const text = `📬 *NEW VALLEY LETTER!*
    
*From:* ${name}
*Category:* ${category}${contact}

*Message:*
${message}`;

    try {
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      });
      logger.info(`Successfully sent Telegram notification for letter from ${name}`);
    } catch (error) {
      logger.error("Failed to send Telegram notification:", error.response ? error.response.data : error.message);
    }
  }
);
