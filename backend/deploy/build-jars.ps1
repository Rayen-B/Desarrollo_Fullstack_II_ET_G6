# Compila los 6 servicios y deja los .jar en backend\deploy\jars (listos para copiar al EC2).
# Uso, desde la carpeta backend:   powershell -ExecutionPolicy Bypass -File deploy\build-jars.ps1
# Los tests se corren aparte (mvnw test); aquí se omiten para que sea más rápido.
$ErrorActionPreference = 'Stop'

$jdk21 = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot'
if (Test-Path $jdk21) { $env:JAVA_HOME = $jdk21 }

$raiz = Split-Path -Parent $PSScriptRoot
$salida = Join-Path $PSScriptRoot 'jars'
New-Item -ItemType Directory -Force $salida | Out-Null

$servicios = 'eureka-server', 'api-gateway', 'usuario-service', 'catalogo-service', 'orden-service', 'nutricion-service'
foreach ($servicio in $servicios) {
    Write-Host ">> Compilando $servicio ..."
    Push-Location (Join-Path $raiz $servicio)
    try {
        & .\mvnw.cmd -q -B -DskipTests clean package
        if ($LASTEXITCODE -ne 0) { throw "Falló la compilación de $servicio" }
        $jar = Get-ChildItem target\*.jar | Where-Object { $_.Name -notlike '*.original' } | Select-Object -First 1
        Copy-Item $jar.FullName (Join-Path $salida "$servicio.jar") -Force
    } finally {
        Pop-Location
    }
}

Get-ChildItem $salida | Select-Object Name, @{ Name = 'MB'; Expression = { [math]::Round($_.Length / 1MB, 1) } }
