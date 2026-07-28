# releaselink

<p align="center">
 <img src="https://cdn.mikn.dev/branding/mikan-vtube.png" width="100">
</p>

> "WHY IS THERE CODE??? MAKE A FUCKING .EXE FILE AND GIVE IT TO ME. these dumbfucks think that everyone is a developer and understands code. well i am not and i don't understand it. I only know to download and install applications. SO WHY THE FUCK IS THERE CODE? make an EXE file and give it to me. STUPID FUCKING SMELLY NERDS"
> [Someone on Reddit](https://www.reddit.com/r/github/comments/1at9br4/i_am_new_to_github_and_i_have_lots_to_say)

Give people the link they want!

- Works on any public repo
- Automatic redirection based on user agent
- Send users to the right download for their OS
- Falls back to releases page if an appropriate asset can't be fetched

A free instance is hosted on [releaselink.mikn.dev](https://releaselink.mikn.dev). Feel free to use it!

## Deployment

### Vercel

- This project can be directly deployed to Vercel with no additional configuration needed.
- Click the button below to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/mikndotdev/releaselink)

### Cloudflare Workers

- This project can also be deployed to Cloudflare Workers, but requires some manual setup.
- Follow the instructions in the [Elysia Cloudflare Workers documentation](https://elysiajs.com/integrations/cloudflare-worker.html).

### Docker

- Docker images are available on [GHCR](https://github.com/mikndotdev/releaselink/pkgs/container/releaselink).

## Manual Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start the server:
   ```bash
   bun start
   ```
   The server will start on port 3000 by default.

## API Usage

Every endpoint responds with a `302` redirect. The target is chosen from the repository's
GitHub release assets based on the caller's `User-Agent` (macOS, Windows, Linux, Android, or iOS)
and CPU architecture. If the device can't be identified, or no matching asset exists, the caller
is redirected to the corresponding GitHub Releases page instead.

### Latest release

**Endpoint:** `GET /:user/:repo/latest`

Redirects to the correct asset from the repository's **latest** release.

**Path Parameters:**

| Parameter | Type     | Required | Description                      |
| --------- | -------- | -------- | -------------------------------- |
| `user`    | `string` | **Yes**  | The GitHub user or organization. |
| `repo`    | `string` | **Yes**  | The repository name.             |

**Example Request:**

```bash
curl -IL "http://localhost:3000/mikndotdev/SiBuster/latest"
```

A Windows visitor is redirected to the Windows asset of the latest `mikndotdev/SiBuster` release;
a macOS visitor to the macOS asset, and so on.

### Specific tag

**Endpoint:** `GET /:user/:repo/tag/:tag`

Redirects to the correct asset from the release matching a specific `tag`.

**Path Parameters:**

| Parameter | Type     | Required | Description                          |
| --------- | -------- | -------- | ------------------------------------ |
| `user`    | `string` | **Yes**  | The GitHub user or organization.     |
| `repo`    | `string` | **Yes**  | The repository name.                 |
| `tag`     | `string` | **Yes**  | The release tag (e.g. `app-v0.1.1`). |

**Example Request:**

```bash
curl -IL "http://localhost:3000/mikndotdev/SiBuster/tag/app-v0.1.1"
```

If the tag or an appropriate asset can't be found, the caller is redirected to
`https://github.com/mikndotdev/SiBuster/releases/tag/app-v0.1.1`.

## Rate Limits

Requests to the GitHub API are unauthenticated by default (60 requests/hour per IP). To raise the
limit to 5,000 requests/hour, set a `GITHUB_TOKEN` environment variable with a GitHub token; it is
sent as a bearer token automatically when present.

## Caching

GitHub API responses can be cached in Redis so repeated requests for the same repository don't
re-query GitHub and burn through the rate limit. Set a `REDIS_URL` environment variable pointing at
your Redis instance to enable it; when unset, caching is disabled and every request queries GitHub
directly. Tagged releases are cached for 30 days (their assets never change), while `latest` is
cached for 10 minutes so new releases show up quickly. Override the durations (in seconds) with the
optional `CACHE_TTL_TAG` and `CACHE_TTL_LATEST` variables.
