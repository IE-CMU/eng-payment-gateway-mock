try {
  process.loadEnvFile(); // optional .env
} catch {}

// Import after loading .env so config picks up the values.
const { config } = await import("./config.js");
const { createApp } = await import("./app.js");

createApp().listen(config.port, () => {
  console.log(`Mock ENG Payment Gateway listening on http://localhost:${config.port}`);
  console.log(`  project_token=${config.projectToken} apptoken=${config.apptoken} ref1=${config.ref1}`);
  console.log(`  QR base URL: ${config.publicBaseUrl}`);
});
