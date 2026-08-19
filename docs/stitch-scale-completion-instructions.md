# Stitch & Scale completion instructions

Updated: 2026-08-19

## Current verified state

The Google Drive archive `Stitch & Scale Video Archive` is complete and private by default. The connected Google Workspace account is `anthoniahanskin@gmail.com`. The top-level folder is `https://drive.google.com/drive/folders/1mLIi-uAmmOY06pLUpJBfQRf942sj0exl`.

The six child folders are `00-inbox` (`1aoacUaVIMmIOYmp5Bz9gmzGpUy1JegY7`), `01-director-review` (`1kVrY0FzwTz0B7aB7Qs_ISOGP-4KbgxO2`), `02-approved` (`1JzAHQi8WX0u5nDp_-FGbkTUyLI-dxnWF`), `03-published` (`1bKvJKqgrWD4ehdfFsbP2j-NuTSa1Oj7e`), `04-thumbnails-and-captions` (`1RRzZpTyzZIf29iqvSDag2yl0oe2m2Y5b`), and `99-rejected-or-superseded` (`1y0bOFKO8O1p8X-6UKAszZBsZhAnDVQpQ`). These IDs are recorded in `docs/stitch-scale-drive-setup-state.md` in both repositories.

The Video Reviewer starter message is available at `docs/agent-prompts/video-reviewer-agent-chat-starter.md` in `stitch-and-scale-pro` and `docs/agent-chat-starters/video-reviewer-agent-chat-starter.md` in `stitch-and-scale-vid`. It is also supplied as a separate attachment with this guide.

## One-time OAuth authorization on your PC

This is the only remaining action that requires your personal Google consent. Download the attached `drive_oauth_upload_test.py` and keep it in a private directory beside your downloaded `credentials.json`. Do not place either file in GitHub, public Drive, or chat.

In a terminal opened in that private directory, run:

```bash
python3 -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade google-api-python-client google-auth-httplib2 google-auth-oauthlib
python drive_oauth_upload_test.py --credentials credentials.json --token token.json --file ./small-test.mp4 --folder-id 1aoacUaVIMmIOYmp5Bz9gmzGpUy1JegY7
```

Use any small test file in place of `./small-test.mp4`. On the first run, Google opens a consent page. Choose `anthoniahanskin@gmail.com`, approve the narrow `drive.file` permission, and return to the terminal. The script saves `token.json` locally and uploads the test file into `00-inbox`. The generated `token.json` is a refresh-token file and must remain private. The final production agent should use encrypted secret storage rather than copying this file into a repository.

## Giving the Generator and Reviewer Drive access

In the **Video Generator** and **Video Reviewer** agent chats, enable the connected **Google Workspace** integration and choose the already-authorized account `anthoniahanskin@gmail.com`. The GitHub account and Google account do not have to be the same identity. The Director/Planner does not need Drive access for normal planning. When a recurring schedule is created, it captures the connectors enabled in that agent’s current chat, so enable Google Workspace before creating the Generator or Reviewer schedule.

## Schedule activation

Create each schedule from the corresponding agent’s own chat. There is one schedule per task; therefore, do not run all six commands in this current conversation. First create or open the six separate agent chats, paste each role’s starter message, enable the required integrations, and then run the matching command in that chat. The commands use the published, self-contained raw GitHub playbooks and create a fresh task at every firing.

### Main Worker — every 15 minutes

```bash
manus-config schedule create --title "Stitch Scale Main Worker — 15m" --detail "Read the published Main Worker playbook, research the current product and repository state, implement the highest-value verified improvement, run the required checks, and leave a durable commit or blocker record." --interval 900 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-pro/main/docs/agent-prompts/main-worker-loop-15m.md"
```

### Application Reviewer — every 15 minutes

```bash
manus-config schedule create --title "Stitch Scale Reviewer — 15m" --detail "Read the published Reviewer playbook, research the current application state, inspect the latest work against the quality gates, record evidence, and create an actionable correction order or approval record." --interval 900 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-pro/main/docs/agent-prompts/reviewer-loop-15m.md"
```

### Crawler — every 15 minutes

```bash
manus-config schedule create --title "Stitch Scale Crawler — 15m" --detail "Read the published Crawler playbook, research the live site and relevant external evidence, compare it with the repository state, and record verified findings for the Worker and Reviewer." --interval 900 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-pro/main/docs/agent-prompts/crawler-loop-15m.md"
```

### Director/Planner — every 7 minutes

```bash
manus-config schedule create --title "Stitch Scale Director Planner — 7m" --detail "Read the published Director/Planner playbook, research widely on every run, classify the current campaign opportunity, and produce the strongest non-generic brief, script, shot plan, caption map, and manifest for the next video without assuming every campaign is the same format." --interval 420 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-vid/main/prompts/director-planner-loop-7m.md"
```

### Video Generator — every 15 minutes

Enable Google Workspace for this chat before creating the schedule.

```bash
manus-config schedule create --title "Stitch Scale Video Generator — 15m" --detail "Read the published Video Generator playbook, research the current brief and production constraints, generate exactly one video, complete the QA gates, upload it to the correct Drive folder, and publish the manifest and communication record without committing the video binary." --interval 900 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-vid/main/prompts/video-generator-loop-15m.md"
```

### Video Reviewer — every hour

Enable Google Workspace for this chat before creating the schedule.

```bash
manus-config schedule create --title "Stitch Scale Video Reviewer — hourly" --detail "Read the published Video Reviewer playbook, research the current platform and quality context, inspect every newly available video in Drive, score all seven weighted dimensions, enforce the 65 percent threshold and hard-fail rules, and create a precise REMAKE_REQUIRED order whenever an asset fails." --interval 3600 --repeated --run-as-new-task --playbook "https://raw.githubusercontent.com/plastic-dude/stitch-and-scale-vid/main/prompts/video-reviewer-loop-hourly.md"
```

If a schedule command reports that a schedule already exists in that agent task, inspect it with `manus-config schedule status --limit 1000 --offset 0` and update the existing schedule rather than creating a second one. The 65% threshold, hard-fail rules, hourly review cadence, and remake communication protocol are already embedded in the published Video Reviewer playbook.

## Security boundaries

Keep `credentials.json`, `token.json`, refresh tokens, client secrets, API keys, and other authentication material out of both repositories and out of public Drive. Keep `00-inbox`, `01-director-review`, and `99-rejected-or-superseded` private. If public-by-link access is desired later, use Viewer access only for `02-approved` and/or `03-published`; never use a public link as an upload credential.
