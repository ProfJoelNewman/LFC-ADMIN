#!/usr/bin/env python3
"""
Zero-Git-CLI GitHub Repository & GitHub Pages Deployer for LFC-ADMIN.
Uses Python stdlib `urllib.request` against the GitHub REST API v3 to:
1. Create (or verify) public repository `LFC-ADMIN` with description
   "Life Fellowship Church — Treasurer & Admin PWA"
2. Upload all tracked files in /home/jnewman/.gemini/antigravity/scratch/lfc-admin
   in a clean commit on `main`
3. Enable GitHub Pages (`main` branch, `/` root) with `https_enforced: true`
"""

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

EXCLUDED_DIRS = {".git", "__pycache__", "test-artifacts"}
EXCLUDED_FILES = {".DS_Store", ".env"}


class GitHubApiClient:
    def __init__(self, token: str):
        self.token = token.strip()
        self.base = "https://api.github.com"

    def request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Tuple[int, Any]:
        url = f"{self.base}{path}"
        data = json.dumps(payload).encode("utf-8") if payload is not None else None
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "LFC-Admin-Deployer/1.0",
        }
        if data is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                return resp.status, json.loads(raw) if raw else {}
        except urllib.error.HTTPError as exc:
            err_raw = exc.read().decode("utf-8", errors="replace")
            try:
                err_json = json.loads(err_raw)
            except Exception:
                err_json = {"message": err_raw}
            return exc.code, err_json


def collect_project_files(root: Path) -> List[Path]:
    files: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in sorted(dirnames) if d not in EXCLUDED_DIRS]
        for fn in sorted(filenames):
            if fn in EXCLUDED_FILES or fn.endswith(".pyc") or fn.startswith(".env.") or fn.endswith(".local.json"):
                continue
            files.append(Path(dirpath) / fn)
    return files


def deploy_to_github(project_dir: Path, repo_name: str, description: str, token: str) -> Dict[str, str]:
    gh = GitHubApiClient(token)

    status, user = gh.request("GET", "/user")
    if status != 200:
        raise RuntimeError(f"GitHub auth failed (HTTP {status}): {user}")
    owner = user["login"]
    print(f"Authenticated with GitHub as: {owner}")

    # 1. Check or create repository
    status, repo = gh.request("GET", f"/repos/{owner}/{repo_name}")
    if status == 404:
        print(f"Creating repository {owner}/{repo_name}...")
        status, repo = gh.request(
            "POST",
            "/user/repos",
            {
                "name": repo_name,
                "description": description,
                "private": False,
                "auto_init": True,
                "has_issues": True,
                "has_projects": False,
                "has_wiki": False,
            },
        )
        if status not in (200, 201):
            raise RuntimeError(f"Failed creating repo (HTTP {status}): {repo}")
    elif status != 200:
        raise RuntimeError(f"Failed checking repo (HTTP {status}): {repo}")

    default_branch = repo.get("default_branch") or "main"

    # Ensure repo has at least an initial commit if empty
    status, ref_info = gh.request("GET", f"/repos/{owner}/{repo_name}/git/ref/heads/{default_branch}")
    if status in (404, 409):
        # Bootstrap initial file via Contents API so Git Data API works on non-empty repo
        readme_bytes = (project_dir / "README.md").read_bytes()
        st_init, res_init = gh.request(
            "PUT",
            f"/repos/{owner}/{repo_name}/contents/README.md",
            {
                "message": "Initial commit: LFC ADMIN PWA",
                "content": base64.b64encode(readme_bytes).decode("ascii"),
                "branch": default_branch,
            },
        )
        if st_init not in (200, 201):
            raise RuntimeError(f"Failed bootstrapping initial commit (HTTP {st_init}): {res_init}")
        status, ref_info = gh.request("GET", f"/repos/{owner}/{repo_name}/git/ref/heads/{default_branch}")

    if status != 200:
        raise RuntimeError(f"Failed reading branch ref (HTTP {status}): {ref_info}")

    parent_commit_sha = ref_info["object"]["sha"]

    # 2. Upload all blobs and assemble Git tree
    files = collect_project_files(project_dir)
    tree_entries = []
    for fp in files:
        rel = fp.relative_to(project_dir).as_posix()
        b64 = base64.b64encode(fp.read_bytes()).decode("ascii")
        st_blob, blob = gh.request(
            "POST",
            f"/repos/{owner}/{repo_name}/git/blobs",
            {"content": b64, "encoding": "base64"},
        )
        if st_blob not in (200, 201):
            raise RuntimeError(f"Failed creating blob for {rel} (HTTP {st_blob}): {blob}")
        mode = "100755" if os.access(fp, os.X_OK) and fp.suffix in (".py", ".sh") else "100644"
        tree_entries.append(
            {
                "path": rel,
                "mode": mode,
                "type": "blob",
                "sha": blob["sha"],
            }
        )
        print(f"  + Blob staged: {rel} ({fp.stat().st_size:,} bytes)")

    st_tree, new_tree = gh.request(
        "POST",
        f"/repos/{owner}/{repo_name}/git/trees",
        {"tree": tree_entries},
    )
    if st_tree not in (200, 201):
        raise RuntimeError(f"Failed creating Git tree (HTTP {st_tree}): {new_tree}")

    st_commit, new_commit = gh.request(
        "POST",
        f"/repos/{owner}/{repo_name}/git/commits",
        {
            "message": "Deploy LFC ADMIN Treasurer & Operations PWA v1.0.0",
            "tree": new_tree["sha"],
            "parents": [parent_commit_sha],
        },
    )
    if st_commit not in (200, 201):
        raise RuntimeError(f"Failed creating commit (HTTP {st_commit}): {new_commit}")

    st_ref, _ = gh.request(
        "PATCH",
        f"/repos/{owner}/{repo_name}/git/refs/heads/{default_branch}",
        {"sha": new_commit["sha"], "force": False},
    )
    if st_ref != 200:
        raise RuntimeError(f"Failed updating {default_branch} ref (HTTP {st_ref})")

    # 3. Configure GitHub Pages HTTPS hosting
    st_pages, pages_info = gh.request("GET", f"/repos/{owner}/{repo_name}/pages")
    if st_pages == 404:
        st_pages, pages_info = gh.request(
            "POST",
            f"/repos/{owner}/{repo_name}/pages",
            {"source": {"branch": default_branch, "path": "/"}},
        )
        print(f"Enabled GitHub Pages (HTTP {st_pages})")
    else:
        gh.request(
            "PUT",
            f"/repos/{owner}/{repo_name}/pages",
            {"https_enforced": True, "source": {"branch": default_branch, "path": "/"}},
        )

    pages_url = pages_info.get("html_url") or f"https://{owner}.github.io/{repo_name}/"
    repo_url = f"https://github.com/{owner}/{repo_name}"
    print(f"Repository URL:   {repo_url}")
    print(f"GitHub Pages URL: {pages_url}")
    return {"owner": owner, "repo_url": repo_url, "pages_url": pages_url}


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish LFC-ADMIN to GitHub & enable GitHub Pages")
    parser.add_argument("--repo", default="LFC-ADMIN")
    parser.add_argument("--description", default="Life Fellowship Church — Treasurer & Admin PWA")
    parser.add_argument("--token", default=os.environ.get("GITHUB_TOKEN", ""))
    args = parser.parse_args()

    if not args.token:
        print("ERROR: Provide GitHub Personal Access Token via --token or GITHUB_TOKEN env var.", file=sys.stderr)
        return 1

    project_dir = Path(__file__).resolve().parent.parent
    deploy_to_github(project_dir, args.repo, args.description, args.token)
    return 0


if __name__ == "__main__":
    sys.exit(main())
