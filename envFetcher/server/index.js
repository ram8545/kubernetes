const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 8800;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// API endpoint to handle search
app.post("/search", (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "No query provided" });
  }

  // Special case: return port
  if (query.toLowerCase() === "port") {
    return res.json({ type: "port", value: port });
  }

  // If input starts with file:// read the file
  if (query.toLowerCase().startsWith("file://")) {
    const relativePath = query.replace(/^file:\/\//i, ""); // remove file://

    // More robust path sanitization
    const normalizedPath = path.normalize(relativePath);

    // Prevent directory traversal attacks more thoroughly
    if (normalizedPath.includes('..') || path.isAbsolute(normalizedPath)) {
      return res.status(403).json({ error: "Access denied: Invalid path" });
    }

    const filePath = path.join(__dirname, normalizedPath);

    // Ensure the resolved path is still within the application directory
    if (!filePath.startsWith(__dirname)) {
      return res.status(403).json({ error: "Access denied: Path outside application directory" });
    }

    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const content = fs.readFileSync(filePath, "utf8");
        return res.json({ type: "file", filename: relativePath, content });
      } else {
        return res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Error reading file" });
    }
  }

  // Directly check for NAME in env
  const queryData = query.toUpperCase();
  return res.json({ type: "name", value: process.env[queryData] || "No value provided in env" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});