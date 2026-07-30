import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/app-layout";

export const Route = createFileRoute("/_app")({
  component: AppShellRoute,
});

function AppShellRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}