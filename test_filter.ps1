# Script PowerShell para probar filterCsvColumns

# Leer el contenido del CSV
$csvContent = Get-Content "Requisitions_Department_view.csv" -Raw

# Simular la función filterCsvColumns
function FilterCsvColumns {
    param([string]$csvText)
    
    $lines = $csvText.Trim() -split "`n"
    if ($lines.Length -eq 0) { return '' }
    
    # Parse header and get required columns
    $header = $lines[0] -split ','
    $selectedIndices = @(0, 1, 2, 3, 4, 11)
    $filteredHeader = ($selectedIndices | ForEach-Object { $header[$_] }) -join ','
    
    # Filter each row
    $filteredRows = @()
    for ($i = 1; $i -lt $lines.Length; $i++) {
        $cols = $lines[$i] -split ','
        $filteredRow = ($selectedIndices | ForEach-Object { $cols[$_] }) -join ','
        $filteredRows += $filteredRow
    }
    
    # Join header + rows
    return @($filteredHeader) + $filteredRows -join "`n"
}

Write-Host "=== ANÁLISIS DEL ARCHIVO CSV ORIGINAL ===" -ForegroundColor Yellow
$originalLines = $csvContent -split "`n"
Write-Host "Número total de líneas: $($originalLines.Length)" -ForegroundColor Green
Write-Host "`nHeader original:" -ForegroundColor Cyan
Write-Host $originalLines[0]

Write-Host "`nPrimera fila de datos:" -ForegroundColor Cyan
Write-Host $originalLines[1]

Write-Host "`n=== RESULTADO FILTRADO ===" -ForegroundColor Yellow
$filteredContent = FilterCsvColumns -csvText $csvContent

$filteredLines = $filteredContent -split "`n"
Write-Host "Número de líneas filtradas: $($filteredLines.Length)" -ForegroundColor Green

Write-Host "`nHeader filtrado:" -ForegroundColor Cyan
Write-Host $filteredLines[0]

Write-Host "`nPrimera fila filtrada:" -ForegroundColor Cyan
Write-Host $filteredLines[1]

Write-Host "`nSegunda fila filtrada:" -ForegroundColor Cyan
Write-Host $filteredLines[2]

# Mostrar qué columnas se están seleccionando
$originalHeader = $originalLines[0] -split ','
$selectedIndices = @(0, 1, 2, 3, 4, 11)
Write-Host "`n=== COLUMNAS SELECCIONADAS ===" -ForegroundColor Yellow
for ($i = 0; $i -lt $selectedIndices.Length; $i++) {
    $index = $selectedIndices[$i]
    Write-Host "Índice $index`: $($originalHeader[$index])" -ForegroundColor Magenta
}

# Guardar el resultado filtrado
$filteredContent | Out-File -FilePath "filtered_output.csv" -Encoding UTF8
Write-Host "`n✅ Resultado guardado en 'filtered_output.csv'" -ForegroundColor Green
