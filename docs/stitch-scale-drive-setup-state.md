# Stitch & Scale Drive Setup State

Updated: 2026-08-19

## Confirmed

- Google Cloud project created: `Stitch Scale Video Archive`
- Google Cloud project ID: `stitch-scale-video-archive`
- Google Drive API enabled for the project
- Google Auth Platform configured
- OAuth audience: External
- OAuth client type: Desktop app
- OAuth client display name: `Stitch Scale Video Uploader - Desktop OAuth`
- User privately downloaded the OAuth client JSON on their PC; the credential contents were not copied into this workspace.
- Top-level Google Drive folder created: `Stitch & Scale Video Archive`
- Top-level folder ID: `1mLIi-uAmmOY06pLUpJBfQRf942sj0exl`
- Top-level folder URL: `https://drive.google.com/drive/folders/1mLIi-uAmmOY06pLUpJBfQRf942sj0exl`
- Folder access currently shown as private to the signed-in user.
- All six child archive folders were created and verified through the connected Google Workspace Drive integration.

## Archive folder map

| Folder | Drive folder ID | URL | Intended use |
|---|---|---|---|
| `00-inbox` | `1aoacUaVIMmIOYmp5Bz9gmzGpUy1JegY7` | https://drive.google.com/drive/folders/1aoacUaVIMmIOYmp5Bz9gmzGpUy1JegY7 | New uploads and unclassified assets |
| `01-director-review` | `1kVrY0FzwTz0B7aB7Qs_ISOGP-4KbgxO2` | https://drive.google.com/drive/folders/1kVrY0FzwTz0B7aB7Qs_ISOGP-4KbgxO2 | Director plans, drafts, and items awaiting review |
| `02-approved` | `1JzAHQi8WX0u5nDp_-FGbkTUyLI-dxnWF` | https://drive.google.com/drive/folders/1JzAHQi8WX0u5nDp_-FGbkTUyLI-dxnWF | Assets that passed review and are approved for release |
| `03-published` | `1bKvJKqgrWD4ehdfFsbP2j-NuTSa1Oj7e` | https://drive.google.com/drive/folders/1bKvJKqgrWD4ehdfFsbP2j-NuTSa1Oj7e | Published or publication-ready video masters |
| `04-thumbnails-and-captions` | `1RRzZpTyzZIf29iqvSDag2yl0oe2m2Y5b` | https://drive.google.com/drive/folders/1RRzZpTyzZIf29iqvSDag2yl0oe2m2Y5b | Thumbnails, caption files, and platform derivatives |
| `99-rejected-or-superseded` | `1y0bOFKO8O1p8X-6UKAszZBsZhAnDVQpQ` | https://drive.google.com/drive/folders/1y0bOFKO8O1p8X-6UKAszZBsZhAnDVQpQ | Rejected, obsolete, or superseded assets retained for audit |

## Not yet done

- Complete the one-time OAuth authorization using the downloaded client JSON.
- Store the resulting refresh token in encrypted connector/secret storage if an agent connector is used.
- Do not place credentials, refresh tokens, or secrets in GitHub or public Drive links.

## Access policy

- Keep the archive private by default.
- If public-by-link access is later desired, make only `02-approved` and/or `03-published` public as Viewer, never Editor.
- Director/Planner does not need Drive access for its normal workflow.
- Video Generator and Video Reviewer require Drive access to upload or inspect video assets.
