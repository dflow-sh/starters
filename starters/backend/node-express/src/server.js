import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, "0.0.0.0", () => {
  console.log(`listening on ${port}`);
});
