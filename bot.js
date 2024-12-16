
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

// Ganti dengan token API bot Telegram Anda
const token = "token"; // Masukkan token bot dari BotFather

// Buat instance bot
const bot = new TelegramBot(token, { polling: true });

// URL endpoint untuk klaim faucet
const claimUrl = "https://faucet.testnet.humanity.org/api/claim"; // Ganti dengan URL klaim yang sesuai

// Fungsi untuk klaim faucet
async function claimFaucet(address) {
  try {
    const data = { address: address };
    const response = await axios.post(claimUrl, data);

    // Log respons untuk debugging
    console.log("Respons API:", response.data);

    if (response.status === 200 && (response.data.status === "success" || response.data.msg?.includes("Txhash"))) {
      const txHash = response.data.msg.match(/Txhash: (\S+)/)?.[1] || "Tidak tersedia";
      return `\u2705 Claim berhasil!\n\u2022 TxHash: ${txHash}`;
    } else {
      return `\u274C Claim gagal.\n\u2022 Pesan: ${response.data.message || response.data.msg || "Tidak ada pesan."}`;
    }
  } catch (error) {
    if (error.response) {
      return `\u26A0\uFE0F Terjadi kesalahan saat klaim.\n\u2022 Status: ${error.response.status}\n\u2022 Pesan: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      return "\u26A0\uFE0F Tidak ada respons dari server. Silakan coba lagi nanti.";
    } else {
      return `\u26A0\uFE0F Kesalahan: ${error.message}`;
    }
  }
}

// Fungsi untuk klaim faucet berkali-kali dengan jeda 1 menit
async function claimMultipleTimes(address, count, chatId) {
  for (let i = 1; i <= count; i++) {
    bot.sendMessage(chatId, `\u23F3 Melakukan Claim ke-${i} untuk address: ${address}`);
    const result = await claimFaucet(address);
    bot.sendMessage(chatId, result);

    if (i < count) {
      bot.sendMessage(chatId, `\u23F3 Menunggu 1 menit...`);
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Tunggu 1 menit
    }
  }
  bot.sendMessage(chatId, `\u2705 Done, Claim ${count} Faucet buat: ${address}`);
}

// Mendengar perintah /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Halo! \nPake perintah /claim address dan jumlah klaim yang diinginkan.\nContoh: /claim 0x123...abc 3");
});

// Mendengar perintah /claim
bot.onText(/\/claim (\S+) (\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const ethereumAddress = match[1].trim();
  const count = parseInt(match[2], 10);

  // Validasi alamat Ethereum
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethRegex.test(ethereumAddress)) {
    bot.sendMessage(chatId, "\u274C Alamat Ethereum tidak valid. Pastikan alamat dimulai dengan '0x' dan memiliki panjang 42 karakter.");
    return;
  }

  if (isNaN(count) || count <= 0) {
    bot.sendMessage(chatId, "\u274C Jumlah claim harus berupa angka positif.");
    return;
  }

  // Proses klaim faucet berkali-kali
  await claimMultipleTimes(ethereumAddress, count, chatId);
});

// Mendengar input selain perintah
bot.on("message", (msg) => {
  if (!msg.text.startsWith("/")) {
    bot.sendMessage(msg.chat.id, "\u2757 Pake perintah /claim address dan jumlah klaim yang diinginkan.\nContoh: /claim 0x123...abc 3");
  }
});
