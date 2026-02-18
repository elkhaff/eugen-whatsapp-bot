module.exports = {
    command: "channelinfo",
    alias: ["cinfo", "ci"],
    category: ["info"],
    description: "Get WhatsApp channel info",
    async run(m, {
        sock,
        text
    }) {
        if (!text || !text.includes("whatsapp.com/channel/")) return m.reply("Invalid URL.");

        try {
            const code = text.split("whatsapp.com/channel/")[1].split("/")[0].trim();
            const data = await sock.newsletterMetadata("invite", code);
            const meta = data.thread_metadata || data;

            const created = new Date(meta.creation_time * 1000).toLocaleDateString("id-ID");
            const link = `https://whatsapp.com/channel/${code}`;

            let caption = `*[ CHANNEL INFORMATION ]*\n\n`;
            caption += `- *Name:* ${meta.name.text}\n`;
            caption += `- *Link:* ${link}\n`;
            caption += `- *ID:* ${data.id}\n`;
            caption += `- *Subscribers:* ${Number(meta.subscribers_count).toLocaleString("id-ID")}\n`;
            caption += `- *Created:* ${created}\n`;
            caption += `- *Verified:* ${meta.verification === "VERIFIED" ? "Yes" : "No"}\n\n`;
            caption += `*Description:*\n${meta.description?.text || "-"}`;

            m.reply(caption);

        } catch (e) {
            m.reply("Error fetching channel data.");
        }
    }
};