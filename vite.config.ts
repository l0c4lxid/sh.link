// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const configFn = defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    preset: "vercel",
  },
});

export default async (env: any) => {
  const config = await configFn(env);

  // Filter out the legacy "vite-tsconfig-paths" plugin to silence Vite 8 warnings
  if (config.plugins) {
    config.plugins = config.plugins.flat().filter((plugin: any) => {
      if (plugin && typeof plugin === "object" && "name" in plugin) {
        return plugin.name !== "vite-tsconfig-paths";
      }
      return true;
    });
  }

  // Enable native tsconfig paths resolution supported in Vite 8+
  config.resolve = {
    ...config.resolve,
    tsconfigPaths: true,
  };

  return config;
};
