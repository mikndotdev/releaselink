import { UAParser } from "ua-parser-js";

export type Platform = "mac" | "windows" | "linux" | "android" | "ios";
export type Arch = "arm64" | "x64" | null;

export interface Asset {
  name: string;
  browser_download_url: string;
}

const PLATFORMS: Platform[] = ["mac", "windows", "linux", "android", "ios"];
const DESKTOP = new Set<Platform>(["mac", "windows", "linux"]);

const LINUX_OS = new Set([
  "Linux",
  "Ubuntu",
  "Debian",
  "Fedora",
  "Red Hat",
  "CentOS",
  "SUSE",
  "openSUSE",
  "Arch",
  "Manjaro",
  "Mint",
  "Gentoo",
  "Slackware",
  "Raspbian",
  "Mageia",
  "Mandriva",
  "PCLinuxOS",
  "elementary OS",
  "Kubuntu",
]);

export function detectPlatform(userAgent: string | undefined): {
  platform: Platform | null;
  arch: Arch;
} {
  if (!userAgent) return { platform: null, arch: null };

  const parser = new UAParser(userAgent);
  const osName = parser.getOS().name ?? "";
  const cpu = parser.getCPU().architecture ?? "";

  let arch: Arch = null;
  if (/arm64|aarch64/i.test(cpu) || /arm64|aarch64/i.test(userAgent)) {
    arch = "arm64";
  } else if (
    /amd64|x86[-_]?64|x64|win64|wow64|ia32/i.test(cpu) ||
    /x86_64|win64|wow64/i.test(userAgent)
  ) {
    arch = "x64";
  }

  let platform: Platform | null = null;
  if (osName === "iOS") platform = "ios";
  else if (osName === "Android") platform = "android";
  else if (osName === "macOS") platform = "mac";
  else if (osName === "Windows") platform = "windows";
  else if (LINUX_OS.has(osName)) platform = "linux";

  return { platform, arch };
}

const OS_TOKENS: Record<Platform, RegExp> = {
  mac: /(?<![a-z])(darwin|macos|osx|mac|apple)(?![a-z])|\.app\.(tar|tgz|txz|zip)/i,
  windows: /(?<![a-z])(windows|win)(?![a-z])/i,
  linux: /(?<![a-z])(linux|ubuntu|debian|fedora|centos|rhel|redhat|suse|alpine|arch)(?![a-z])/i,
  android: /(?<![a-z])android(?![a-z])/i,
  ios: /(?<![a-z])(ios|ipados|iphone|ipad)(?![a-z])/i,
};

const EXCLUSIVE_EXT: Record<Platform, RegExp> = {
  mac: /\.(dmg|pkg)$/i,
  windows: /\.(exe|msi|appx|msix|msixbundle)$/i,
  linux: /\.(appimage|deb|rpm|flatpak|snap)$/i,
  android: /\.(apk|aab)$/i,
  ios: /\.ipa$/i,
};

const GENERIC_ARCHIVE = /(\.tar\.(gz|xz|bz2|zst)|\.tgz|\.txz|\.zip|\.7z|\.gz)$/i;

const ARCH_PATTERNS: Record<Exclude<Arch, null>, RegExp> = {
  arm64: /(arm64|aarch64)/i,
  x64: /(x86[-_]?64|amd64|win64|x64)/i,
};

function belongsTo(platform: Platform, name: string): boolean {
  return EXCLUSIVE_EXT[platform].test(name) || OS_TOKENS[platform].test(name);
}

function namesOtherPlatform(platform: Platform, name: string): boolean {
  return PLATFORMS.some((other) => other !== platform && belongsTo(other, name));
}

export function matchAsset(assets: Asset[], platform: Platform, arch: Arch): Asset | undefined {
  const direct = assets.filter(
    (asset) => belongsTo(platform, asset.name) && !namesOtherPlatform(platform, asset.name),
  );
  const generic = DESKTOP.has(platform)
    ? assets.filter(
        (asset) => GENERIC_ARCHIVE.test(asset.name) && !namesOtherPlatform(platform, asset.name),
      )
    : [];

  const candidates = direct.length > 0 ? direct : generic;
  if (candidates.length === 0) return undefined;

  const preferInstaller = (list: Asset[]): Asset | undefined =>
    list.find((asset) => EXCLUSIVE_EXT[platform].test(asset.name)) ?? list[0];

  if (arch) {
    const archMatches = candidates.filter((asset) => ARCH_PATTERNS[arch].test(asset.name));
    if (archMatches.length > 0) return preferInstaller(archMatches);
  }

  return preferInstaller(candidates);
}
