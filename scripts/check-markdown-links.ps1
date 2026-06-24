#Requires -Version 5.1
<#
.SYNOPSIS
  Markdown 内のローカルリンク（相対 · c:/ 絶対）と任意で HTTP リンクを検証する。

.DESCRIPTION
  lychee は `c:/...` 形式やファイル名の括弧 `(ADR)` を正しく扱えないため、
  YK ワークスペース向けの補完チェッカー。`[text](url)` を括弧ネスト対応で抽出し、
  ローカルパスは Test-Path、HTTP は HEAD で応答を確認する。

.PARAMETER Path
  検証するルート（ファイルまたはディレクトリ）。

.PARAMETER ExcludePath
  除外するパス部分文字列（複数可）。例: '99_アーカイブ', 'archive'

.PARAMETER CheckHttp
  指定時のみ https?:// リンクを HEAD で検証（時間がかかる）。

.PARAMETER FailOnError
  エラーが 1 件でもあれば exit 1（CI · pre-commit 用）。

.EXAMPLE
  .\check-markdown-links.ps1 -Path 'c:\yk-memo\00.ai-driven-school\個人テーマ_フローチャートアプリ' -ExcludePath '99_アーカイブ'

.EXAMPLE
  .\check-markdown-links.ps1 -Path 'c:\yk-memo' -ExcludePath '99_アーカイブ','archive' -CheckHttp -FailOnError
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Path,

    [string[]]$ExcludePath = @(),

    [switch]$CheckHttp,

    [switch]$FailOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-MarkdownLink {
    param([string]$Content)

    $links = [System.Collections.Generic.List[object]]::new()
    $i = 0
    while ($true) {
        $idx = $Content.IndexOf('](', $i)
        if ($idx -lt 0) { break }

        $start = $idx + 2
        $depth = 1
        $j = $start
        while ($j -lt $Content.Length -and $depth -gt 0) {
            switch ($Content[$j]) {
                '(' { $depth++ }
                ')' { $depth-- }
            }
            $j++
        }
        if ($depth -ne 0) { break }

        $url = $Content.Substring($start, $j - $start - 1).Trim()
        $line = ($Content.Substring(0, $idx) -split "`n").Count
        $links.Add([pscustomobject]@{ Line = $line; Url = $url })
        $i = $j
    }
    return $links
}

function Test-LocalLinkTarget {
    param(
        [string]$Url,
        [string]$BaseDir
    )

    if ($Url -match '^#') { return $true }
    $pathPart = ($Url -split '#', 2)[0]
    if ([string]::IsNullOrWhiteSpace($pathPart)) { return $true }

    $target = if ($pathPart -match '^[a-zA-Z]:[/\\]') {
        $pathPart
    }
    else {
        Join-Path $BaseDir $pathPart
    }
    $target = [System.IO.Path]::GetFullPath($target)
    return Test-Path -LiteralPath $target
}

function Test-HttpLinkTarget {
    param([string]$Url)

    try {
        $null = Invoke-WebRequest -Uri $Url -Method Head -MaximumRedirection 5 -TimeoutSec 20 -UseBasicParsing
        return $true
    }
    catch {
        $status = $null
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        if ($status -eq 405) {
            try {
                $null = Invoke-WebRequest -Uri $Url -Method Get -MaximumRedirection 5 -TimeoutSec 20 -UseBasicParsing
                return $true
            }
            catch {
                return $false
            }
        }
        return $false
    }
}

function Get-MarkdownFiles {
    param(
        [string]$Root,
        [string[]]$Exclude
    )

    if (Test-Path -LiteralPath $Root -PathType Leaf) {
        return @(Get-Item -LiteralPath $Root)
    }

    $files = Get-ChildItem -LiteralPath $Root -Recurse -Filter '*.md' -File
    if ($Exclude.Count -eq 0) { return $files }

    return $files | Where-Object {
        $full = $_.FullName
        $skip = $false
        foreach ($pattern in $Exclude) {
            if ($full -like "*$pattern*") {
                $skip = $true
                break
            }
        }
        -not $skip
    }
}

function Test-MarkdownFile {
    param(
        [System.IO.FileInfo]$File,
        [bool]$DoHttp
    )

    $content = Get-Content -LiteralPath $File.FullName -Encoding UTF8 -Raw
    $baseDir = $File.DirectoryName
    $errors = [System.Collections.Generic.List[object]]::new()

    foreach ($link in (Get-MarkdownLink $content)) {
        $url = $link.Url
        if ($url -match '^mailto:') { continue }

        if ($url -match '^https?://') {
            if (-not $DoHttp) { continue }
            if (-not (Test-HttpLinkTarget $url)) {
                $errors.Add([pscustomobject]@{
                        Line   = $link.Line
                        Url    = $url
                        Kind   = 'http'
                        Detail = 'HEAD/GET failed'
                    })
            }
            continue
        }

        if (-not (Test-LocalLinkTarget -Url $url -BaseDir $baseDir)) {
            $pathPart = ($url -split '#', 2)[0]
            $resolved = if ($pathPart -match '^[a-zA-Z]:[/\\]') { $pathPart } else { Join-Path $baseDir $pathPart }
            $resolved = [System.IO.Path]::GetFullPath($resolved)
            $errors.Add([pscustomobject]@{
                    Line   = $link.Line
                    Url    = $url
                    Kind   = 'local'
                    Detail = "missing: $resolved"
                })
        }
    }

    return $errors
}

# --- main ---
$root = [System.IO.Path]::GetFullPath($Path)
if (-not (Test-Path -LiteralPath $root)) {
    Write-Error "Path not found: $root"
    exit 2
}

$files = @(Get-MarkdownFiles -Root $root -Exclude $ExcludePath)
$allErrors = [System.Collections.Generic.List[object]]::new()
$httpChecked = 0
$localChecked = 0

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Encoding UTF8 -Raw
    foreach ($link in (Get-MarkdownLink $content)) {
        if ($link.Url -match '^https?://') { if ($CheckHttp) { $httpChecked++ } }
        elseif ($link.Url -notmatch '^(mailto:|#)') { $localChecked++ }
    }

    $errs = Test-MarkdownFile -File $file -DoHttp:$CheckHttp.IsPresent
    foreach ($e in $errs) {
        $allErrors.Add([pscustomobject]@{
                File   = $file.FullName
                Line   = $e.Line
                Kind   = $e.Kind
                Url    = $e.Url
                Detail = $e.Detail
            })
    }
}

Write-Host ""
Write-Host "check-markdown-links"
Write-Host "  root:          $root"
Write-Host "  files:         $($files.Count)"
Write-Host "  local links:   $localChecked"
if ($CheckHttp) { Write-Host "  http links:    $httpChecked" }
if ($ExcludePath.Count) { Write-Host "  exclude:       $($ExcludePath -join ', ')" }
Write-Host "  errors:        $($allErrors.Count)"
Write-Host ""

if ($allErrors.Count -gt 0) {
    $allErrors | Group-Object File | ForEach-Object {
        Write-Host $_.Name
        foreach ($item in $_.Group) {
            Write-Host ("  L{0} [{1}] {2}" -f $item.Line, $item.Kind, $item.Url)
            if ($item.Detail) { Write-Host "       $($item.Detail)" }
        }
        Write-Host ""
    }

    if ($FailOnError) { exit 1 }
    exit 0
}

Write-Host "ALL OK"
exit 0
