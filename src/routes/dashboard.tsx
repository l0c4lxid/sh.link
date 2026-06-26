import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getUserFromSession } from "@/lib/session";

const getCurrentUserServer = createServerFn({ method: "GET" })
  .handler(async () => {
    return getUserFromSession();
  });

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const user = await getCurrentUserServer();
    if (!user) {
      throw redirect({
        to: "/auth",
      });
    }
    return { user };
  },
  component: () => <Outlet />,
});
