import type { Asset } from "./platform";

export interface Release {
  html_url: string;
  assets: Asset[];
}

const API = "https://api.github.com";

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
    return (await response.json()) as Release;
  } catch {
    return null;
  }
}

export function fetchLatestRelease(user: string, repo: string): Promise<Release | null> {
  return fetchRelease(`${API}/repos/${user}/${repo}/releases/latest`);
}

export function fetchTaggedRelease(
  user: string,
  repo: string,
  tag: string,
): Promise<Release | null> {
  return fetchRelease(`${API}/repos/${user}/${repo}/releases/tags/${encodeURIComponent(tag)}`);
}

export function releasesPageUrl(user: string, repo: string): string {
  return `https://github.com/${user}/${repo}/releases`;
}

export function releaseTagPageUrl(user: string, repo: string, tag: string): string {
  return `https://github.com/${user}/${repo}/releases/tag/${encodeURIComponent(tag)}`;
}
