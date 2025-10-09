@echo off
REM Script avanzado para liberar múltiples puertos comunes usados por Node.js
REM Libera puertos: 3000, 3001, 3002, 8000, 8080, 5000

setlocal enabledelayedexpansion

echo ========================================
echo    LIMPIADOR DE PUERTOS NODE.JS
echo ========================================
echo.

set PORTS=3000 3001 3002 8000 8080 5000
set PROCESSES_KILLED=0

for %%p in (%PORTS%) do (
    echo Buscando procesos en puerto %%p...
    set FOUND=0

    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p 2^>nul') do (
        set FOUND=1
        echo   Encontrado PID: %%a en puerto %%p

        REM Verificar si es Node.js
        tasklist /FI "PID eq %%a" /FO CSV 2>nul | findstr /I "node.exe" >nul
        if !errorlevel! equ 0 (
            echo   Matando proceso Node.js...
            taskkill /PID %%a /F >nul 2>&1
            if !errorlevel! equ 0 (
                echo   ✅ Proceso terminado exitosamente
                set /a PROCESSES_KILLED+=1
            ) else (
                echo   ❌ Error al terminar el proceso
            )
        ) else (
            echo   ⚠️ No es proceso Node.js, omitiendo...
        )
    )

    if !FOUND! equ 0 (
        echo   ✅ Puerto %%p está libre
    )
    echo.
)

REM Verificación final
echo ========================================
echo          VERIFICACIÓN FINAL
echo ========================================

set PORTS_FREE=0
for %%p in (%PORTS%) do (
    netstat -ano | findstr :%%p >nul 2>&1
    if !errorlevel! neq 0 (
        set /a PORTS_FREE+=1
    )
)

echo Puertos verificados: %PORTS%
echo Procesos Node.js terminados: %PROCESSES_KILLED%
echo Puertos liberados: %PORTS_FREE%

if %PROCESSES_KILLED% gtr 0 (
    echo.
    echo ✅ Limpieza completada exitosamente
    echo Ahora puedes ejecutar 'npm run dev' sin problemas
) else (
    echo.
    echo ℹ️ No se encontraron procesos Node.js usando los puertos comunes
)

echo.
echo ========================================
pause