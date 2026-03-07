import express from "express";
import { createServer as createViteServer } from "vite";
import { Storage } from "megajs";
import dotenv from "dotenv";
import http from "http";

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Global storage instance to avoid repeated logins
let globalMegaStorage: Storage | null = null;

async function getMegaConnection() {
  const email = process.env.MEGA_EMAIL?.trim();
  const password = process.env.MEGA_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error("MEGA credentials (MEGA_EMAIL, MEGA_PASSWORD) are missing in environment variables.");
  }

  // If we already have a connected instance, verify it's still good
  if (globalMegaStorage) {
    try {
      // Simple check to see if connection is alive (e.g. accessing root)
      if (globalMegaStorage.root) {
        return globalMegaStorage;
      }
    } catch (e) {
      console.warn("[MEGA] Existing connection lost, reconnecting...", e);
      globalMegaStorage = null;
    }
  }

  console.log(`[MEGA] New connection attempt for: ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`);
  
  try {
    const storage = new Storage({
      email,
      password,
      autologin: false,
      keepalive: true
    });

    await new Promise((resolve, reject) => {
      storage.login((err) => {
        if (err) {
          console.error("[MEGA] Login callback error:", err.message);
          reject(err);
        } else {
          resolve(null);
        }
      });
    });

    await storage.ready;
    globalMegaStorage = storage;
    console.log("[MEGA] Connected successfully.");
    return storage;
  } catch (error: any) {
    globalMegaStorage = null;
    console.error("[MEGA] Connection failed:", error.message);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/backup/mega/latest", async (req, res) => {
    console.log("[MEGA] Fetch latest backup request received");
    try {
      const storage = await getMegaConnection();

      let backupFolder = storage.root.children?.find((c: any) => c.name === 'MillionMobileBackups');
      if (!backupFolder) {
        return res.json({ data: null });
      }

      const files = backupFolder.children || [];
      if (files.length === 0) {
        return res.json({ data: null });
      }

      // Sort files by timestamp descending (newest first)
      files.sort((a: any, b: any) => {
        if (a.timestamp && b.timestamp) {
          return b.timestamp - a.timestamp;
        }
        return b.name.localeCompare(a.name);
      });

      const latestFile = files[0];
      console.log(`[MEGA] Downloading latest backup: ${latestFile.name} (${new Date(latestFile.timestamp * 1000).toISOString()})`);
      
      const data = await latestFile.downloadBuffer({});
      const jsonStr = data.toString('utf-8');
      
      res.json({ data: JSON.parse(jsonStr) });
    } catch (error: any) {
      globalMegaStorage = null; // Invalidate connection on error
      console.error("[MEGA] Fetch Error:", error.message);
      // Don't expose internal error details if it's just auth failure
      if (error.message.includes("ENOENT") || error.message.includes("-9")) {
         console.error("[MEGA] Critical: Login failed. Please verify MEGA_EMAIL and MEGA_PASSWORD in .env file.");
         return res.status(401).json({ error: "MEGA Login Failed: Invalid email or password. Please check your .env file." });
      }
      res.status(500).json({ error: error.message || "Failed to fetch from MEGA" });
    }
  });

  app.post("/api/backup/mega", async (req, res) => {
    // console.log("[MEGA] Backup request received");
    try {
      const { data } = req.body;
      const type = req.query.type as string || 'manual';

      if (!data) {
        return res.status(400).json({ error: "No data provided" });
      }

      const storage = await getMegaConnection();
      
      // Find or create a dedicated folder for backups
      let backupFolder = storage.root.children?.find((c: any) => c.name === 'MillionMobileBackups');
      
      if (!backupFolder) {
        console.log("[MEGA] Creating 'MillionMobileBackups' folder...");
        try {
          const created = await storage.mkdir('MillionMobileBackups');
          backupFolder = Array.isArray(created) ? created[0] : created;
        } catch (err) {
          console.error("[MEGA] Failed to create folder, falling back to root:", err);
          backupFolder = storage.root;
        }
      }

      // Ensure backupFolder is a single object
      if (Array.isArray(backupFolder)) {
        backupFolder = backupFolder[0];
      }

      let filename: string;
      if (type === 'auto') {
        filename = 'auto_backup.json';
        // Find existing auto backup and delete it to "overwrite"
        const existingFile = backupFolder.children?.find((c: any) => c.name === filename);
        if (existingFile) {
          try {
            await existingFile.delete();
            // console.log(`[MEGA] Deleted old ${filename}`);
          } catch (delErr) {
            console.warn(`[MEGA] Failed to delete old ${filename}:`, delErr);
          }
        }
      } else {
        const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').substring(0, 15);
        filename = `backup_${timestamp}.json`;
      }

      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, 'utf-8');
      
      console.log(`[MEGA] Uploading ${filename} (${buffer.length} bytes)...`);

      try {
        const file = await backupFolder.upload({ name: filename, size: buffer.length }, buffer).complete;
        console.log(`[MEGA] Backup success: ${file.name}`);
        res.json({ success: true, filename: file.name });
      } catch (uploadErr: any) {
        console.error("[MEGA] Upload failed:", uploadErr);
        throw uploadErr;
      }
    } catch (error: any) {
      globalMegaStorage = null; // Invalidate connection on error
      console.error("[MEGA] Backup Error:", error.message);
      if (error.message.includes("ENOENT") || error.message.includes("-9")) {
         console.error("[MEGA] Critical: Login failed. Please verify MEGA_EMAIL and MEGA_PASSWORD in .env file.");
         return res.status(401).json({ error: "MEGA Login Failed: Invalid email or password. Please check your .env file." });
      }
      res.status(500).json({ error: error.message || "Failed to upload to MEGA" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
