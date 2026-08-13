# Mapeia brunozarath.app -> localhost (requer PowerShell como Administrador)
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$entries = @(
    "127.0.0.1       brunozarath.app",
    "127.0.0.1       www.brunozarath.app"
)

$content = Get-Content $hostsPath -Raw -ErrorAction Stop
foreach ($entry in $entries) {
    $hostname = ($entry -split '\s+', 2)[1].Trim()
    if ($content -notmatch [regex]::Escape($hostname)) {
        Add-Content -Path $hostsPath -Value $entry
        Write-Host "Adicionado: $entry"
    } else {
        Write-Host "Ja existe: $hostname"
    }
}

Write-Host ""
Write-Host "Pronto! Inicie o servidor com: npm run dev"
Write-Host "Acesse: http://brunozarath.app:3000"
