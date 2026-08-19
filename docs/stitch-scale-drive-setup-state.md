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

## Not yet done

- Create the child folders `00-inbox`, `01-director-review`, `02-approved`, `03-published`, `04-thumbnails-and-captions`, and `99-rejected-or-superseded`.
- Complete the one-time OAuth authorization using the downloaded client JSON.
- Store the resulting refresh token in encrypted connector/secret storage.
- Do not place credentials, refresh tokens, or secrets in GitHub or public Drive links.
