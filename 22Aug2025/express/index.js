const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get('/', (req, res) => {
    console.log("Hello this is express.");
    res.send("Hello Express!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});