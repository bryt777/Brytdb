export default async function handler(req, res) {
  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_ID = process.env.CHANNEL_ID;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        limit: 50
      })
    });

    const data = await response.json();
    if (!data.ok) {
      return res.status(500).json({ error: "Telegram API error" });
    }

    const artworks = [];

    for (const msg of data.result) {
      const photo = msg.photo?.at(-1);
      if (!photo) continue;

      const caption = msg.caption || "";
      const lines = caption.split("\n").map(l => l.trim()).filter(Boolean);

      const title = lines[0] || "Untitled";
      const tags = caption.match(/#\w+/g)?.map(t => t.slice(1).toLowerCase()) || [];

      // Get file path
      const fileRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${photo.file_id}`
      );
      const fileData = await fileRes.json();

      const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;

      artworks.push({
        id: msg.message_id,
        title,
        tags,
        image: imageUrl
      });
    }

    res.status(200).json(artworks);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
}
