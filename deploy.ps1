# GetDrop — Tek Komutla Deploy Scripti
# Kullanım: .\deploy.ps1 "commit mesajı"
# Örnek:    .\deploy.ps1 "fix: stok güncelleme hatası düzeltildi"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = "chore: update"
)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  GetDrop Deploy Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Git
Write-Host "[1/3] Git commit & push..." -ForegroundColor Yellow
git add -A
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    Write-Host "  -> Commit yapılacak değişiklik yok veya hata. Devam ediliyor..." -ForegroundColor DarkYellow
}
git push origin master
if ($LASTEXITCODE -ne 0) {
    Write-Host "  !! Git push başarısız!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> Git push OK" -ForegroundColor Green

# 2. EAS Update (OTA)
Write-Host ""
Write-Host "[2/3] EAS OTA Update gönderiliyor..." -ForegroundColor Yellow
npx eas-cli update --channel production --message $Message --non-interactive
if ($LASTEXITCODE -ne 0) {
    Write-Host "  !! EAS Update başarısız!" -ForegroundColor Red
    exit 1
}
Write-Host "  -> OTA Update OK" -ForegroundColor Green

# 3. Sonuç
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  DEPLOY TAMAMLANDI!" -ForegroundColor Green
Write-Host "  Telefon güncellemeyi arka planda indirecek." -ForegroundColor Green
Write-Host "  Uygulamayı tamamen kapat ve yeniden aç." -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
