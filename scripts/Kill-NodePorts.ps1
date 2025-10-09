# Script de PowerShell para liberar puertos usados por Node.js
# Uso: .\Kill-NodePorts.ps1 [-Port <puerto>] [-All]

param(
    [Parameter(Mandatory=$false)]
    [int]$Port = 3000,

    [Parameter(Mandatory=$false)]
    [switch]$All
)

function Write-Header {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    LIMPIADOR DE PUERTOS NODE.JS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Get-ProcessUsingPort {
    param([int]$PortNumber)

    try {
        $connections = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue
        return $connections | Where-Object { $_.State -eq 'Listen' } | Select-Object -ExpandProperty OwningProcess
    }
    catch {
        # Fallback para sistemas sin Get-NetTCPConnection
        $netstat = netstat -ano | Select-String ":$PortNumber\s"
        if ($netstat) {
            $processId = ($netstat -split '\s+')[-1]
            return [int]$processId
        }
    }
    return $null
}

function Kill-NodeProcess {
    param([int]$ProcessId)

    try {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($process -and $process.ProcessName -eq 'node') {
            Write-Host "Matando proceso Node.js (PID: $ProcessId)..." -ForegroundColor Yellow
            Stop-Process -Id $ProcessId -Force
            Write-Host "✅ Proceso Node.js terminado exitosamente" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ El proceso $ProcessId no es de Node.js, omitiendo..." -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "❌ Error al terminar el proceso $ProcessId : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

function Test-PortFree {
    param([int]$PortNumber)

    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("127.0.0.1", $PortNumber)
        $tcpClient.Close()
        return $false
    }
    catch {
        return $true
    }
}

# Puertos comunes para desarrollo
$commonPorts = @(3000, 3001, 3002, 8000, 8080, 5000, 4000, 9000)
$processesKilled = 0

Write-Header

if ($All) {
    Write-Host "Modo ALL: Liberando todos los puertos comunes..." -ForegroundColor Magenta
    $portsToCheck = $commonPorts
} else {
    Write-Host "Liberando puerto específico: $Port" -ForegroundColor Magenta
    $portsToCheck = @($Port)
}

foreach ($currentPort in $portsToCheck) {
    Write-Host "Buscando procesos en puerto $currentPort..." -ForegroundColor Blue

    $pids = Get-ProcessUsingPort -PortNumber $currentPort

    if ($pids) {
        if ($pids -is [array]) {
            foreach ($processId in $pids) {
                if (Kill-NodeProcess -ProcessId $processId) {
                    $processesKilled++
                }
            }
        } else {
            if (Kill-NodeProcess -ProcessId $pids) {
                $processesKilled++
            }
        }
    } else {
        Write-Host "✅ Puerto $currentPort está libre" -ForegroundColor Green
    }

    Write-Host ""
}

# Verificación final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "          VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$portsFreed = 0
foreach ($port in $portsToCheck) {
    if (Test-PortFree -PortNumber $port) {
        $portsFreed++
    }
}

Write-Host "Puertos verificados: $($portsToCheck -join ', ')"
Write-Host "Procesos Node.js terminados: $processesKilled"
Write-Host "Puertos liberados: $portsFreed"

if ($processesKilled -gt 0) {
    Write-Host ""
    Write-Host "✅ Limpieza completada exitosamente" -ForegroundColor Green
    Write-Host "Ahora puedes ejecutar 'npm run dev' sin problemas" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️ No se encontraron procesos Node.js usando los puertos especificados" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Pausa para que el usuario vea los resultados
Read-Host "Presiona Enter para continuar"