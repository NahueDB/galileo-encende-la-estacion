param([ValidateSet('install','dev','build','start','test','typecheck','test:e2e','sheets:init')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $nodeDirectory = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
  if (-not (Test-Path -LiteralPath (Join-Path $nodeDirectory 'node.exe'))) { throw 'Instalá Node.js 24 LTS y pnpm, y volvé a abrir la terminal.' }
  $env:PATH = $nodeDirectory + ';' + $env:PATH
}
$packageManager = Get-Command pnpm -ErrorAction SilentlyContinue
if ($packageManager) { $pnpmPath = $packageManager.Source } else {
  $pnpmPath = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
  if (-not (Test-Path -LiteralPath $pnpmPath)) { throw 'Instalá pnpm y volvé a abrir la terminal.' }
}
if ($Task -eq 'install') { & $pnpmPath install --frozen-lockfile } else { & $pnpmPath run $Task }
exit $LASTEXITCODE
