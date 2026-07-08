$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backendDir = Join-Path $root "backend"

function Find-Cloudflared {
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $candidates = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    throw "No se encuentra cloudflared.exe. Reinstala con: winget install --id Cloudflare.cloudflared"
}

$cloudflaredPath = Find-Cloudflared

Write-Host "Iniciando backend (FastAPI)..." -ForegroundColor Cyan
Set-Location $backendDir
$backendProc = Start-Process -FilePath ".\.venv\Scripts\uvicorn.exe" `
    -ArgumentList "app.main:app", "--host", "0.0.0.0", "--port", "8000" `
    -WindowStyle Minimized -PassThru

Start-Sleep -Seconds 3

Write-Host "Iniciando tunel de Cloudflare..." -ForegroundColor Cyan
$logFile = Join-Path $env:TEMP "lugna-tunnel.log"
Remove-Item $logFile -ErrorAction SilentlyContinue
$tunnelProc = Start-Process -FilePath $cloudflaredPath `
    -ArgumentList "tunnel", "--url", "http://localhost:8000" `
    -RedirectStandardError $logFile -WindowStyle Minimized -PassThru

Write-Host "Esperando la URL publica..."
$url = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $match = Select-String -Path $logFile -Pattern "https://[a-zA-Z0-9\-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($match) {
            $url = $match.Matches[0].Value
            break
        }
    }
}

Write-Host ""
if ($url) {
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host " Backend accesible en: $url" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
    Set-Clipboard -Value $url
    Write-Host "(URL copiada al portapapeles)"

    # Actualiza app/eas.json localmente (no necesita API key, es solo un archivo)
    $easJsonPath = Join-Path $root "app\eas.json"
    if (Test-Path $easJsonPath) {
        $content = Get-Content $easJsonPath -Raw
        $updated = $content -replace '("EXPO_PUBLIC_API_URL":\s*")[^"]*(")', "`${1}$url`${2}"
        if ($updated -ne $content) {
            Set-Content -Path $easJsonPath -Value $updated -NoNewline
            Write-Host "app/eas.json actualizado con la nueva URL." -ForegroundColor Green
        }
    }

    # Actualiza EXPO_PUBLIC_API_URL en Render automaticamente si hay API key guardada
    $apiKeyFile = Join-Path $root "render-api-key.local.txt"
    if (Test-Path $apiKeyFile) {
        $apiKey = (Get-Content $apiKeyFile -Raw).Trim()
        try {
            Write-Host "Actualizando EXPO_PUBLIC_API_URL en Render..." -ForegroundColor Cyan
            $headers = @{ Authorization = "Bearer $apiKey" }
            $services = Invoke-RestMethod -Uri "https://api.render.com/v1/services?name=lugna-web" -Headers $headers -Method Get
            $serviceId = $null
            foreach ($item in $services) {
                $svc = if ($item.service) { $item.service } else { $item }
                if ($svc.name -eq "lugna-web") { $serviceId = $svc.id; break }
            }
            if (-not $serviceId) { throw "No se encontro el servicio 'lugna-web' en tu cuenta de Render." }

            $body = @{ value = $url } | ConvertTo-Json
            Invoke-RestMethod -Uri "https://api.render.com/v1/services/$serviceId/env-vars/EXPO_PUBLIC_API_URL" `
                -Headers $headers -Method Put -Body $body -ContentType "application/json" | Out-Null
            Write-Host "Render actualizado - redeploy automatico de lugna-web en curso." -ForegroundColor Green
        } catch {
            Write-Host "No se pudo actualizar Render automaticamente: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "Actualiza EXPO_PUBLIC_API_URL a mano en el dashboard si hace falta." -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "(Para automatizar tambien Render: crea $apiKeyFile con tu API key de Render)" -ForegroundColor DarkGray
        Write-Host "Mientras tanto, actualiza EXPO_PUBLIC_API_URL a mano en el dashboard de Render." -ForegroundColor Yellow
    }
} else {
    Write-Host "No se pudo leer la URL del tunel todavia. Revisa: $logFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backend y tunel corriendo en segundo plano (ventanas minimizadas)."
Read-Host "Pulsa Enter en esta ventana para DETENER todo"

Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $tunnelProc.Id -Force -ErrorAction SilentlyContinue
Write-Host "Detenido."
