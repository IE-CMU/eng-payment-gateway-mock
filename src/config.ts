const port = Number(process.env.PORT ?? 4000);

export const config = {
  port,
  publicBaseUrl: (process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`).replace(/\/+$/, ""),
  projectToken: process.env.MOCK_PROJECT_TOKEN ?? "test-project-token",
  apptoken: process.env.MOCK_APPTOKEN ?? "test-apptoken",
  ref1: process.env.MOCK_REF1 ?? "06010125691000004",
};
