#Requires -Version 5.1
<#
.SYNOPSIS
  yk-skill/rule 配下 Markdown の行数を監査する（L1 肥大化検知）。

.DESCRIPTION
  対象: rule/**/*.md（RULE_INDEX · references/ 含む）
  250行超 → WARN（L1 理想上限 · PROGRESSIVE）
  500行超 → FAIL（references 分離候補 · RULE_INDEX）

.PARAMETER RuleRoot
  監査ルート。既定: c:/yk-skill/rule

.PARAMETER WarnThreshold
  WARN 閾値（行数）。既定: 250

.PARAMETER FailThreshold
  FAIL 閾値（行数）。既定: 500

.PARAMETER FailOnWarn
  WARN が 1 件でもあれば exit 1。

.PARAMETER FailOnError
  FAIL が 1 件でもあれば exit 1（CI 用 · 既定 ON）。

.EXAMPLE
  .\audit-rule-line-counts.ps1

.EXAMPLE
  .\audit-rule-line-counts.ps1 -FailOnError -FailOnWarn
#>
[CmdletBinding()]
param(
    [string]$RuleRoot = 'c:/yk-skill/rule',

    [int]$WarnThreshold = 250,

    [int]$FailThreshold = 500,

    [switch]$FailOnWarn,

    [switch]$FailOnError = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ruleRootFull = [System.IO.Path]::GetFullPath($RuleRoot)
if (-not (Test-Path -LiteralPath $ruleRootFull)) {
    Write-Error "rule root not found: $ruleRootFull"
    exit 2
}

$files = Get-ChildItem -LiteralPath $ruleRootFull -Filter '*.md' -Recurse -File |
    Sort-Object FullName

$rows = foreach ($file in $files) {
    $lineCount = (Get-Content -LiteralPath $file.FullName -Encoding UTF8).Count
    $rel = $file.FullName.Substring($ruleRootFull.Length).TrimStart('\', '/')
    $status = if ($lineCount -gt $FailThreshold) { 'FAIL' }
              elseif ($lineCount -gt $WarnThreshold) { 'WARN' }
              else { 'OK' }
    [pscustomobject]@{
        Status    = $status
        Lines     = $lineCount
        RelPath   = $rel -replace '\\', '/'
    }
}

$rows = $rows | Sort-Object -Property @{ Expression = 'Lines'; Descending = $true }, RelPath

$warnCount = @($rows | Where-Object Status -eq 'WARN').Count
$failCount = @($rows | Where-Object Status -eq 'FAIL').Count
$okCount = @($rows | Where-Object Status -eq 'OK').Count

Write-Host 'audit-rule-line-counts'
Write-Host "  rule_root:      $ruleRootFull"
Write-Host "  files:          $($files.Count)"
Write-Host "  warn_threshold: $WarnThreshold"
Write-Host "  fail_threshold: $FailThreshold"
Write-Host "  ok:             $okCount"
Write-Host "  warn:           $warnCount"
Write-Host "  fail:           $failCount"
Write-Host ''

foreach ($row in $rows) {
    $marker = switch ($row.Status) {
        'FAIL' { 'FAIL' }
        'WARN' { 'WARN' }
        default { '  OK' }
    }
    Write-Host ("{0}  {1,4}  {2}" -f $marker, $row.Lines, $row.RelPath)
}

Write-Host ''
if ($failCount -eq 0 -and $warnCount -eq 0) {
    Write-Host 'ALL OK'
    exit 0
}

if ($failCount -gt 0) {
    Write-Host "FAIL: $failCount file(s) exceed $FailThreshold lines"
    if ($FailOnError) { exit 1 }
}

if ($warnCount -gt 0) {
    Write-Host "WARN: $warnCount file(s) exceed $WarnThreshold lines"
    if ($FailOnWarn) { exit 1 }
}

exit 0
