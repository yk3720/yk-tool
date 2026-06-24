#Requires -Version 5.1
<#
.SYNOPSIS
  git ステージ済み .md のローカルリンクを検証（pre-commit 用）。

.DESCRIPTION
  archive / 99_アーカイブ はスキップ。HTTP は検証しない。
  正本: yk-tool/scripts/check-markdown-links.ps1

.PARAMETER RepoRoot
  Git ルート。省略時は git rev-parse --show-toplevel。

.EXAMPLE
  .\check-markdown-links-staged.ps1
#>
[CmdletBinding()]
param(
    [string]$RepoRoot = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-YkToolRoot {
    if ($env:YK_TOOL_ROOT -and (Test-Path -LiteralPath $env:YK_TOOL_ROOT)) {
        return [System.IO.Path]::GetFullPath($env:YK_TOOL_ROOT)
    }
    return 'c:\yk-tool'
}

if (-not $RepoRoot) {
    $RepoRoot = git rev-parse --show-toplevel 2>$null
    if (-not $RepoRoot) {
        Write-Error 'Not a git repository (git rev-parse failed).'
        exit 2
    }
}
$RepoRoot = [System.IO.Path]::GetFullPath($RepoRoot)

$checker = Join-Path (Get-YkToolRoot) 'scripts\check-markdown-links.ps1'
if (-not (Test-Path -LiteralPath $checker)) {
    Write-Error "Checker not found: $checker (set YK_TOOL_ROOT if yk-tool is elsewhere)"
    exit 2
}

function Test-SkipStagedMarkdownPath {
    param([string]$RelPath)
    if ($RelPath -match '[/\\]archive[/\\]') { return $true }
    if ($RelPath -match '[/\\]99_') { return $true }
    return $false
}

$staged = @(git -C $RepoRoot diff --cached --name-only --diff-filter=ACM | Where-Object {
        $_ -like '*.md' -and -not (Test-SkipStagedMarkdownPath $_)
    })

if ($staged.Count -eq 0) {
    Write-Host 'check-markdown-links-staged: no staged .md (excluding archive) — skip'
    exit 0
}

Write-Host "check-markdown-links-staged: $($staged.Count) file(s)"
$failed = $false
foreach ($rel in $staged) {
    $full = Join-Path $RepoRoot $rel
    if (-not (Test-Path -LiteralPath $full)) { continue }
    & $checker -Path $full -FailOnError
    if ($LASTEXITCODE -ne 0) { $failed = $true }
}

if ($failed) { exit 1 }
exit 0
