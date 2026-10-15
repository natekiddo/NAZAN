# ProjectHub Desktop Synchronization Architecture & Protocol Specification

## 1. Overview
The ProjectHub Desktop Sync Engine is designed as a lightweight, background daemon or CLI utility that enables seamless, two-way synchronization between a developer's local computer directory (e.g. `C:\Users\Natty\ProjectHub` or `~/ProjectHub`) and their ProjectHub cloud workspace (Supabase PostgreSQL + Supabase Private Storage).

---

## 2. Authentication & Device Authorization
1. **Device Registration:**
   - The user registers a device in ProjectHub Settings (`/settings`), generating a unique `device_id` in the `connected_devices` table.
2. **Access Token Generation:**
   - The local client authenticates using a persistent Personal Access Token (PAT) or Supabase session refresh token passed during initial configuration (`projecthub-sync login`).
3. **Session Revocation:**
   - The user can instantly pause or revoke any connected device from the ProjectHub Settings UI, immediately rejecting any subsequent sync requests with HTTP `403 Forbidden`.

---

## 3. Directory Layout & Project Mapping
The local sync client maps the root folder to ProjectHub projects using intuitive subdirectories:

```text
ProjectHub/
├── .projecthub-sync/             <-- Local engine cache & state
│   ├── config.json               <-- Device ID, server URL, auth token
│   ├── manifest.json             <-- Local file hash cache & timestamps
│   └── sync.log                  <-- Local operation logs
│
├── University-Senior-Project/    <-- Mapped to Project "University Senior Project"
│   ├── specs.pdf
│   ├── architecture-diagram.png
│   └── documentation.md
│
└── Personal-Portfolio/           <-- Mapped to Project "Personal Portfolio"
    └── design-tokens.json
```

---

## 4. Change Detection & Bandwidth Optimization
To avoid unnecessary network bandwidth and disk I/O, the client employs a **three-tier detection strategy**:

1. **Tier 1: Filesystem Watcher (`fs.watch` / `chokidar`)**
   - Monitors file creation, updates, renames, and deletions in real time with a 2-second debounce timer to prevent thrashing during fast file saves.
2. **Tier 2: Metadata Check (mtime & size)**
   - Compares local file size and modified timestamp (`mtimeMs`) with the cached `manifest.json`. If neither changed, the file is skipped instantly.
3. **Tier 3: Content Hashing (SHA-256)**
   - When size or mtime changes, calculates a fast SHA-256 checksum of the file content. If the hash matches the remote database `checksum` field, no upload is performed.

---

## 5. Ignored Files & Build Artifacts
The local client automatically excludes heavy dependency directories, build outputs, and local secrets:

```text
# Default ProjectHub Ignore Patterns
node_modules/
.git/
.next/
dist/
build/
out/
*.tmp
*.log
.DS_Store
Thumbs.db
.env*.local
```
*(Users can also provide a custom `.projecthubignore` file in the root folder).*

---

## 6. Conflict Resolution Protocol
When a file is modified simultaneously on both the local desktop and the remote cloud:

| Strategy | Description | Recommended For |
| :--- | :--- | :--- |
| **`newer_wins` (Default)** | Compares `updated_at` timestamps; the most recently modified file takes precedence. | General development |
| **`keep_both`** | Downloads the remote version and renames local file to `<name>.conflict.<timestamp>.<ext>`. | Critical code & thesis documents |
| **`client_wins`** | Local computer files always overwrite the server file. | Offline workstation editing |
| **`server_wins`** | Server files always overwrite local edits. | Read-only mirror clients |

---

## 7. Large File & Direct-to-Storage Transfer
To prevent server bottlenecks:
- Files are **never piped through Next.js server memory**.
- The server API endpoint (`POST /api/sync/batch`) issues **time-limited pre-signed upload URLs** directly to Supabase Storage.
- The desktop client streams files directly to `https://<supabase-id>.supabase.co/storage/v1/object/project-files/<user_id>/...` using HTTP `PUT`.

---

## 8. Server-Side Sync Protocol API Endpoints

### 1. `GET /api/sync/status?since=<ISO_TIMESTAMP>`
Returns current remote state of user files and projects for delta calculation.

**Response:**
```json
{
  "serverTime": "2026-10-10T15:00:00.000Z",
  "files": [
    {
      "id": "file_uuid",
      "original_name": "spec.pdf",
      "storage_path": "user_id/file_uuid/spec.pdf",
      "file_size": 204850,
      "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "project_id": "proj_uuid",
      "updated_at": "2026-10-10T14:45:00.000Z"
    }
  ],
  "projects": [
    { "id": "proj_uuid", "name": "Senior Project" }
  ]
}
```

### 2. `POST /api/sync/batch`
Submits change manifest to execute deletions or request pre-signed upload URLs.

**Request:**
```json
{
  "deviceId": "device_uuid",
  "changes": [
    { "action": "upload", "fileName": "spec.pdf", "size": 204850, "projectId": "proj_uuid" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 1,
  "plan": [
    {
      "action": "upload",
      "fileName": "spec.pdf",
      "uploadUrl": "https://<supabase-url>/storage/v1/object/upload/sign/project-files/...",
      "storagePath": "user_id/file_uuid/spec.pdf"
    }
  ]
}
```

---

## 9. Reference Client Implementation
A working standalone reference implementation is provided in `scripts/projecthub-sync-cli.js`.
You can test the client by running:
```bash
node scripts/projecthub-sync-cli.js --help
```
