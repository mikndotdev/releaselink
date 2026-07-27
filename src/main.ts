import { Elysia } from "elysia";
import { detectPlatform, matchAsset } from "./platform";
import type { Release } from "./github";
import {
  fetchLatestRelease,
  fetchTaggedRelease,
  releaseTagPageUrl,
  releasesPageUrl,
} from "./github";

function resolveTarget(
  release: Release | null,
  userAgent: string | undefined,
  fallback: string,
): string {
  if (!release) return fallback;

  const { platform, arch } = detectPlatform(userAgent);
  if (!platform) return release.html_url || fallback;

  const asset = matchAsset(release.assets ?? [], platform, arch);
  return asset?.browser_download_url ?? release.html_url ?? fallback;
}

const app = new Elysia();

app.get("/", ({ redirect }) => {
  return redirect("https://docs.mikn.dev/solutions/developers/releaselink");
});

app.get("/:user/:repo/latest", async ({ params, headers, redirect }) => {
  const { user, repo } = params;
  const release = await fetchLatestRelease(user, repo);
  const target = resolveTarget(release, headers["user-agent"], releasesPageUrl(user, repo));
  return redirect(target, 302);
});

app.get("/:user/:repo/tag/:tag", async ({ params, headers, redirect }) => {
  const { user, repo, tag } = params;
  const release = await fetchTaggedRelease(user, repo, tag);
  const target = resolveTarget(release, headers["user-agent"], releaseTagPageUrl(user, repo, tag));
  return redirect(target, 302);
});

if (import.meta.main) {
  app.listen(Number(process.env.PORT) || 3000);
}

export default app;
