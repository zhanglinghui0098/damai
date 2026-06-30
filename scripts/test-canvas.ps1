# =====================================================================
# test-canvas.ps1 - Dami Canvas Regression Test (PowerShell 5.1 compat)
# 07-01 Hermes: 防止改了又改, 每次都说修好, 实际没修
# 不依赖浏览器/grep/date
# 用法:
#   powershell.exe -ExecutionPolicy Bypass -File scripts/test-canvas.ps1
# =====================================================================

$ErrorActionPreference = "Stop"

$CANVAS_URL = $env:CANVAS_URL
if (-not $CANVAS_URL) {
    $epoch = [int][double]::Parse((Get-Date -UFormat %s))
    $CANVAS_URL = "https://damai.net.cn/canvas/test-canvas-ps-$epoch"
}

Write-Host "Testing URL: $CANVAS_URL"
Write-Host "=========================================="

$PASS = 0
$FAIL = 0
$FAILED_TESTS = @()

function Pass([string]$msg) {
    Write-Host "[OK] $msg" -ForegroundColor Green
    $script:PASS++
}
function Fail([string]$msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:FAIL++
    $script:FAILED_TESTS += $msg
}

# T1: HTTP 200
try {
    $r = Invoke-WebRequest -Uri $CANVAS_URL -UseBasicParsing -TimeoutSec 30 -Method Head
    if ($r.StatusCode -eq 200) { Pass "T1 HTTP 200" }
    else { Fail "T1 HTTP $($r.StatusCode) (expected 200)" }
} catch {
    Fail "T1 HTTP error: $($_.Exception.Message)"
}

# T2: HTML contains Next.js CSS bundle
try {
    $r = Invoke-WebRequest -Uri $CANVAS_URL -UseBasicParsing -TimeoutSec 30
    $html = $r.Content
    if ($html.Contains("/_next/static/css/")) {
        Pass "T2 HTML contains Next.js CSS bundle"
    } else {
        Fail "T2 HTML missing Next.js CSS bundle"
    }
} catch {
    Fail "T2 HTML fetch failed: $($_.Exception.Message)"
    exit 1
}

# T3: react-flow / xyflow in HTML or JS chunk
$xyFound = $false
if ($html.Contains("react-flow") -or $html.Contains("xyflow")) {
    $xyFound = $true
}

if (-not $xyFound) {
    $canvasChunks = @()
    $idx = 0
    while ($idx -lt $html.Length) {
        $pos = $html.IndexOf("/_next/static/chunks/app/canvas/", $idx)
        if ($pos -lt 0) { break }
        $endPos = $html.IndexOf('"', $pos)
        if ($endPos -lt 0) { $endPos = $html.IndexOf("'", $pos) }
        if ($endPos -lt 0) { $endPos = $pos + 200 }
        $chunkUrl = $html.Substring($pos, $endPos - $pos)
        $canvasChunks += $chunkUrl
        $idx = $endPos
    }
    foreach ($u in $canvasChunks) {
        try {
            $js = (Invoke-WebRequest -Uri "https://damai.net.cn$u" -UseBasicParsing -TimeoutSec 30).Content
            if ($js.Contains("xyflow") -or $js.Contains("react-flow")) {
                $xyFound = $true
                break
            }
        } catch {}
    }
}

if ($xyFound) {
    Pass "T3 Found react-flow / xyflow"
} else {
    Fail "T3 xyflow NOT in HTML or canvas chunks"
}

# T4: buildId
if ($html.Contains("buildId")) {
    Pass "T4 HTML contains buildId"
} else {
    Write-Host "[T4] No buildId (non-fatal)" -ForegroundColor Yellow
}

# T5: No error page keywords
$errKeywords = @("Application error", "502 Bad Gateway", "Bad Request", "Internal Server Error")
$errFound = $false
foreach ($k in $errKeywords) {
    if ($html.Contains($k)) {
        $errFound = $true
        break
    }
}
if ($errFound) {
    Fail "T5 HTML contains error page keywords"
} else {
    Pass "T5 HTML has no error page keywords"
}

# Summary
Write-Host "=========================================="
Write-Host "Pass: $PASS, Fail: $FAIL"
if ($FAIL -gt 0) {
    Write-Host "Failed tests:" -ForegroundColor Red
    foreach ($t in $FAILED_TESTS) { Write-Host "  - $t" -ForegroundColor Red }
    exit 1
}
Write-Host "All canvas regression tests passed" -ForegroundColor Green
exit 0
