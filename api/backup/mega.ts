import { Storage } from "megajs";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const email = process.env.MEGA_EMAIL;
    const password = process.env.MEGA_PASSWORD;

    if (!email || !password) {
      return res.status(500).json({ error: "MEGA credentials not configured on the server." });
    }

    console.log("Connecting to MEGA...");
    // Connect to MEGA
    const storage = await new Storage({
      email,
      password,
      autologin: true
    }).ready;

    console.log("Connected to MEGA. Uploading backup...");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `million-mobile-backup-${timestamp}.json`;
    const fileData = Buffer.from(JSON.stringify(data), 'utf-8');

    // Upload to root folder
    const file = await storage.upload({
      name: filename,
      size: fileData.length
    }, fileData).complete;

    console.log(`Backup uploaded successfully to MEGA: ${filename}`);
    
    res.status(200).json({ success: true, filename });
  } catch (error: any) {
    console.error("MEGA Backup Error:", error);
    res.status(500).json({ error: error.message || "Failed to upload to MEGA" });
  }
}
