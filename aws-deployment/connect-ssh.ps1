# Easy SSH Connection Script
# Connects to EC2 instances

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("monolith", "microservices", "mono", "micro")]
    [string]$Target,

    [Parameter(Mandatory=$false)]
    [string]$DeploymentInfoPath = (Join-Path $PSScriptRoot "deployment-info.json")
)

if (-not (Test-Path $DeploymentInfoPath)) {
    Write-Host "❌ Deployment info not found. Run deploy-to-aws.ps1 first!" -ForegroundColor Red
    exit 1
}

$deployInfo = Get-Content $DeploymentInfoPath | ConvertFrom-Json
$keyPath = Join-Path $PSScriptRoot "$($deployInfo.KeyPairName).pem"

if (-not (Test-Path $keyPath)) {
    Write-Host "❌ SSH key not found: $keyPath" -ForegroundColor Red
    exit 1
}

$ip = if ($Target -eq "monolith" -or $Target -eq "mono") {
    $deployInfo.MonolithPublicIP
} else {
    $deployInfo.MicroservicesPublicIP
}

$name = if ($Target -eq "monolith" -or $Target -eq "mono") { "MONOLITH" } else { "MICROSERVICES" }

Write-Host "`n🔐 Connecting to $name EC2 Instance..." -ForegroundColor Cyan
Write-Host "IP: $ip" -ForegroundColor Yellow
Write-Host "Key: $keyPath`n" -ForegroundColor Yellow

# For Windows, we need to use different SSH command
Write-Host "To connect, run this command:" -ForegroundColor Green
Write-Host "ssh -i `"$keyPath`" ubuntu@$ip`n" -ForegroundColor White

Write-Host "Quick commands once connected:" -ForegroundColor Yellow
Write-Host "  cd /home/ubuntu/kvizhub" -ForegroundColor Gray
Write-Host "  docker ps                    # See running containers" -ForegroundColor Gray
Write-Host "  docker-compose logs          # View logs" -ForegroundColor Gray
Write-Host "  docker-compose up -d         # Start monolith" -ForegroundColor Gray
Write-Host "  docker-compose down          # Stop monolith`n" -ForegroundColor Gray

# Try to open SSH (this might not work on all Windows versions)
try {
    & ssh -i "$keyPath" "ubuntu@$ip"
} catch {
    Write-Host "`n⚠️  Automatic SSH failed. Please copy the command above and run it manually." -ForegroundColor Yellow
}
