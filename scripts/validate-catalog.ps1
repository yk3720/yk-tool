#Requires -Version 5.1
<#
.SYNOPSIS
  catalog.yaml の scripts: エントリが実ファイルとして存在するか検証する。

.EXAMPLE
  .\validate-catalog.ps1
  .\validate-catalog.ps1 -FailOnError
#>
[CmdletBinding()]
param(
    [switch]$FailOnError
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$toolRoot = if ($env:YK_TOOL_ROOT) { [System.IO.Path]::GetFullPath($env:YK_TOOL_ROOT) } else { 'c:\yk-tool' }
$catalogPath = Join-Path $toolRoot 'catalog.yaml'

if (-not (Test-Path -LiteralPath $catalogPath)) {
    Write-Error "catalog not found: $catalogPath"
    exit 2
}

$lines = Get-Content -LiteralPath $catalogPath -Encoding UTF8
$scriptPaths = [System.Collections.Generic.List[string]]::new()
$inScripts = $false
foreach ($line in $lines) {
    if ($line -match '^\s*scripts:\s*$') { $inScripts = $true; continue }
    if ($inScripts -and $line -match '^\s*hook_bindings:\s*$') { break }
    if ($inScripts -and $line -match '^\s*path:\s*(.+)\s*$') {
        $p = $Matches[1].Trim()
        if ($p -notmatch '^c:/') {
            $scriptPaths.Add($p)
        }
    }
}

$errors = @()
foreach ($rel in $scriptPaths) {
    $full = Join-Path $toolRoot ($rel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $full)) {
        $errors += "missing: $rel -> $full"
    }
}

Write-Host "validate-catalog"
Write-Host "  tool_root: $toolRoot"
Write-Host "  scripts:   $($scriptPaths.Count)"
Write-Host "  errors:    $($errors.Count)"
Write-Host ""

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Host "  $_" }
    if ($FailOnError) { exit 1 }
    exit 0
}

Write-Host "ALL OK"
exit 0
