#!/usr/bin/env pwsh

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Limpiando build anterior..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Limpiar build de Android
if (Test-Path "android\app\build") {
    Remove-Item -Path "android\app\build" -Recurse -Force
    Write-Host "[OK] android\app\build eliminado" -ForegroundColor Green
}

if (Test-Path "android\.gradle") {
    Remove-Item -Path "android\.gradle" -Recurse -Force
    Write-Host "[OK] android\.gradle eliminado" -ForegroundColor Green
}

# Limpiar cache de node_modules
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
    Write-Host "[OK] node_modules\.cache eliminado" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Ejecutando prebuild..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

npx expo prebuild --clean

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Recompilando app..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

npx expo run:android

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Listo!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
