import { Hono } from "hono";
import { errorBoundary } from "@/backend/middleware/error";
import { withAppContext } from "@/backend/middleware/context";
import { withSupabase } from "@/backend/middleware/supabase";
import { withClerkAuth } from "@/backend/middleware/clerk";
import { registerExampleRoutes } from "@/features/example/backend/route";
import { registerPaymentRoutes } from "@/features/payment/backend/route";
import { registerProfileRoutes } from "@/features/profile/backend/route";
import { registerSubscriptionRoutes } from "@/features/subscription/backend/route";
import { registerAnalyzeRoutes } from "@/features/analyze/backend/route";
import { registerAnalysisRoutes } from "@/features/analysis/backend/route";
import { registerUserRoutes } from "@/features/user/backend/route";
import { registerShareRoutes } from "@/features/share/backend/route";
import { registerPDFRoutes } from "@/features/pdf/backend/route";
import type { AppEnv } from "@/backend/hono/context";

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === "production") {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use("*", errorBoundary());
  app.use("*", withAppContext());
  app.use("*", withSupabase());
  app.use("*", withClerkAuth());

  registerExampleRoutes(app);
  registerPaymentRoutes(app);
  registerProfileRoutes(app);
  registerSubscriptionRoutes(app);
  registerAnalyzeRoutes(app);
  registerAnalysisRoutes(app);
  registerUserRoutes(app);
  registerShareRoutes(app);
  registerPDFRoutes(app);

  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: `Route not found: ${c.req.method} ${c.req.path}`,
        },
      },
      404
    );
  });

  if (process.env.NODE_ENV === "production") {
    singletonApp = app;
  }

  return app;
};
