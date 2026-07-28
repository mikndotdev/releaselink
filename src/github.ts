import type { Asset } from "./platform";
import { getCachedRelease, setCachedRelease } from "./cache";

export interface Release {
  html_url: string;
  assets: Asset[];
}

const API = "https://api.github.com";
const LATEST_TTL = Number(process.env.CACHE_TTL_LATEST) || 600;
const TAG_TTL = Number(process.env.CACHE_TTL_TAG) || 2592000;

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "releaselink",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function fetchRelease(url: string): Promise<Release | null> {
  try {
    const response = await fetch(url, { headers: githubHeaders() });
    if (!response.ok) return null;
    const data = (await response.json()) as Release;
    return {
      html_url: data.html_url,
      assets: (data.assets ?? []).map((asset) => ({
        name: asset.name,
        browser_download_url: asset.browser_download_url,
      })),
    };
  } catch {
    return null;
  }
}

async function withCache(key: string, ttlSeconds: number, url: string): Promise<Release | null> {
  const cached = await getCachedRelease(key);
  if (cached) return cached;

  const release = await fetchRelease(url);
  if (release) await setCachedRelease(key, release, ttlSeconds);

  return release;
}

export function fetchLatestRelease(user: string, repo: string): Promise<Release | null> {
  return withCache(
    `latest:${user}/${repo}`,
    LATEST_TTL,
    `${API}/repos/${user}/${repo}/releases/latest`,
  );
}

export function fetchTaggedRelease(
  user: string,
  repo: string,
  tag: string,
): Promise<Release | null> {
  return withCache(
    `tag:${user}/${repo}:${tag}`,
    TAG_TTL,
    `${API}/repos/${user}/${repo}/releases/tags/${encodeURIComponent(tag)}`,
  );
}

export function releasesPageUrl(user: string, repo: string): string {
  return `https://github.com/${user}/${repo}/releases`;
}

export function releaseTagPageUrl(user: string, repo: string, tag: string): string {
  return `https://github.com/${user}/${repo}/releases/tag/${encodeURIComponent(tag)}`;
}
