@echo off
REM Script simple para liberar puertos ocupados por procesos de Node.js
REM Uso: kill-port.bat [puerto]
REM Ejemplo: kill-port.bat 3000

REM Puerto por defecto
if "%1"=="" (
    set PORT=3000
) else (
    set PORT=%1
)

echo Buscando procesos que usan el puerto %PORT%...

REM Buscar procesos usando el puerto especificado
netstat -ano | findstr :%PORT% > temp_netstat.txt 2>nul

if exist temp_netstat.txt (
    for /f "tokens=5" %%a in (temp_netstat.txt) do (
        echo Encontrado proceso con PID: %%a usando puerto %PORT%

        REM Verificar si es un proceso de Node.js
        tasklist /FI "PID eq %%a" /FO CSV 2>nul | findstr /I "node.exe" >nul
        if !errorlevel! equ 0 (
            echo Matando proceso de Node.js (PID: %%a)...
            taskkill /PID %%a /F >nul 2>&1
            if !errorlevel! equ 0 (
                echo ✅ Proceso Node.js terminado exitosamente
            ) else (
                echo ❌ Error al terminar el proceso
            )
        ) else (
            echo ⚠️ El proceso %%a no es de Node.js, omitiendo...
        )
    )
    del temp_netstat.txt
) else (
    echo ✅ Puerto %PORT% está libre
    goto :end
)

REM Verificar si el puerto está libre
echo.
echo Verificando puerto %PORT%...
timeout /t 1 /nobreak >nul 2>&1
netstat -ano 2>nul | findstr :%PORT% >nul
if %errorlevel% equ 0 (
    echo ❌ El puerto %PORT% aún está en uso
    echo Lista de procesos usando el puerto:
    netstat -ano 2>nul | findstr :%PORT%
) else (
    echo ✅ Puerto %PORT% liberado exitosamente
)

:end
echo.
echo Script completado.