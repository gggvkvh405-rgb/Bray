$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$root = Join-Path $repo 'build/whisper-runtime'
$sourceRoot = Join-Path $root 'source'
$buildRoot = Join-Path $root 'build'
$resourceRoot = Join-Path $repo 'resources/whisper'
$archive = Join-Path $root 'whisper.cpp-v1.9.5.zip'

New-Item -ItemType Directory -Force -Path $root | Out-Null
if (Test-Path $sourceRoot) { Remove-Item -Recurse -Force $sourceRoot }
if (Test-Path $buildRoot) { Remove-Item -Recurse -Force $buildRoot }
if (Test-Path $resourceRoot) { Remove-Item -Recurse -Force $resourceRoot }
New-Item -ItemType Directory -Force -Path $sourceRoot, $resourceRoot | Out-Null

$sourceUrl = 'https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.9.5.zip'
Invoke-WebRequest -Uri $sourceUrl -OutFile $archive
Expand-Archive -Path $archive -DestinationPath $sourceRoot -Force
$source = Get-ChildItem $sourceRoot -Directory | Select-Object -First 1
if (!$source -or !(Test-Path (Join-Path $source.FullName 'CMakeLists.txt'))) { throw 'Не удалось распаковать исходный код whisper.cpp v1.9.5' }

cmake -S $source.FullName -B $buildRoot `
  -DWHISPER_BUILD_TESTS=OFF `
  -DWHISPER_BUILD_EXAMPLES=ON `
  -DWHISPER_BUILD_SERVER=OFF `
  -DWHISPER_CURL=OFF `
  -DWHISPER_SDL2=OFF `
  -DGGML_OPENMP=OFF `
  -DGGML_CUDA=OFF `
  -DGGML_VULKAN=OFF `
  -DBUILD_SHARED_LIBS=OFF
if ($LASTEXITCODE -ne 0) { throw 'CMake не смог настроить whisper.cpp' }

cmake --build $buildRoot --config Release --target whisper-cli --parallel 2
if ($LASTEXITCODE -ne 0) { throw 'Не удалось собрать whisper-cli для Windows' }
$cli = Get-ChildItem $buildRoot -Recurse -File -Filter 'whisper-cli.exe' | Select-Object -First 1
if (!$cli) { throw 'После сборки не найден whisper-cli.exe' }
Copy-Item -Force $cli.FullName (Join-Path $resourceRoot 'whisper-cli.exe')

# Multi-configuration generators may place runtime DLLs beside the executable;
# collect only DLLs produced by this pinned build so the portable app is relocatable.
Get-ChildItem $buildRoot -Recurse -File -Filter '*.dll' | ForEach-Object {
  Copy-Item -Force $_.FullName (Join-Path $resourceRoot $_.Name)
}
$license = Join-Path $source.FullName 'LICENSE'
if (!(Test-Path $license)) { throw 'В исходниках whisper.cpp не найдена лицензия' }
Copy-Item -Force $license (Join-Path $resourceRoot 'WHISPER-CPP-LICENSE.txt')
@'
ByAzen includes whisper.cpp v1.9.5, built from the upstream source for Windows x64.

whisper.cpp — MIT License. The full license is in WHISPER-CPP-LICENSE.txt.
Upstream source: https://github.com/ggml-org/whisper.cpp/tree/v1.9.5
The Russian-capable ggml-base model is not bundled; it is downloaded only after
an explicit user action, SHA-256 verified, and stored in the user's data folder.
Model source: https://huggingface.co/ggerganov/whisper.cpp
'@ | Set-Content -Encoding UTF8 (Join-Path $resourceRoot 'THIRD_PARTY_NOTICES.txt')

Write-Host "whisper.cpp runtime prepared at $resourceRoot"
