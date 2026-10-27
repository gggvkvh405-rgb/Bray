$ErrorActionPreference = 'Stop'

$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$resourceRoot = Join-Path $repo 'resources/piper'
$workRoot = Join-Path $repo 'build/piper-runtime'
$distRoot = Join-Path $resourceRoot 'piper'
$specRoot = Join-Path $workRoot 'spec'
$buildRoot = Join-Path $workRoot 'work'
$entryPoint = Join-Path $workRoot 'piper_entry.py'

New-Item -ItemType Directory -Force -Path $resourceRoot, $workRoot | Out-Null
if (Test-Path $distRoot) { Remove-Item -Recurse -Force $distRoot }
New-Item -ItemType Directory -Force -Path $distRoot, $specRoot, $buildRoot | Out-Null

python -m pip install --disable-pip-version-check --upgrade 'piper-tts==1.8.0' 'pyinstaller==6.22.3'
if ($LASTEXITCODE -ne 0) { throw 'Не удалось установить Piper для Windows-сборки' }

@'
from piper.__main__ import main

if __name__ == "__main__":
    main()
'@ | Set-Content -Encoding UTF8 $entryPoint

python -m PyInstaller --noconfirm --clean --onedir --console --name piper `
  --distpath $resourceRoot `
  --workpath $buildRoot `
  --specpath $specRoot `
  --collect-data piper `
  --collect-binaries piper `
  --hidden-import piper.espeakbridge `
  --hidden-import piper.phonemize_espeak `
  --collect-all onnxruntime `
  --collect-all pathvalidate `
  --exclude-module torch `
  --exclude-module lightning `
  --exclude-module tensorboard `
  --exclude-module piper.train `
  --exclude-module piper.hebrew `
  --exclude-module piper.tashkeel `
  $entryPoint
if ($LASTEXITCODE -ne 0) { throw 'Не удалось собрать автономный Piper runtime' }

$bundle = Join-Path $distRoot 'piper'
$unusedData = @('hebrew', 'tashkeel', 'train', 'img', 'templates')
foreach ($name in $unusedData) {
  $candidate = Join-Path (Join-Path $bundle '_internal/piper') $name
  if (Test-Path $candidate) { Remove-Item -Recurse -Force $candidate }
}

$licenseSource = python -c "from importlib.metadata import distribution; print(distribution('piper-tts').locate_file('licenses/COPYING'))"
if ($LASTEXITCODE -ne 0 -or !(Test-Path $licenseSource)) { throw 'Не найдена лицензия Piper GPL-3.0-or-later' }
Copy-Item -Force $licenseSource (Join-Path $resourceRoot 'PIPER-COPYING.txt')
$g2pwLicense = python -c "from importlib.metadata import distribution; print(distribution('piper-tts').locate_file('licenses/licenses/LICENSE.g2pW-Apache-2.0'))"
if ($LASTEXITCODE -eq 0 -and (Test-Path $g2pwLicense)) { Copy-Item -Force $g2pwLicense (Join-Path $resourceRoot 'G2PW-APACHE-2.0.txt') }
$pyinstallerLicense = python -c "from importlib.metadata import distribution; print(distribution('pyinstaller').locate_file('licenses/COPYING.txt'))"
if ($LASTEXITCODE -eq 0 -and (Test-Path $pyinstallerLicense)) { Copy-Item -Force $pyinstallerLicense (Join-Path $resourceRoot 'PYINSTALLER-COPYING.txt') }
$pathvalidateLicense = python -c "from importlib.metadata import distribution; print(distribution('pathvalidate').locate_file('licenses/LICENSE'))"
if ($LASTEXITCODE -eq 0 -and (Test-Path $pathvalidateLicense)) { Copy-Item -Force $pathvalidateLicense (Join-Path $resourceRoot 'PATHVALIDATE-LICENSE.txt') }
$onnxruntimeDir = python -c "import onnxruntime,pathlib; print(pathlib.Path(onnxruntime.__file__).parent)"
if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $onnxruntimeDir 'LICENSE'))) { Copy-Item -Force (Join-Path $onnxruntimeDir 'LICENSE') (Join-Path $resourceRoot 'ONNXRUNTIME-LICENSE.txt') }
if ($LASTEXITCODE -eq 0 -and (Test-Path (Join-Path $onnxruntimeDir 'ThirdPartyNotices.txt'))) { Copy-Item -Force (Join-Path $onnxruntimeDir 'ThirdPartyNotices.txt') (Join-Path $resourceRoot 'ONNXRUNTIME-THIRD-PARTY-NOTICES.txt') }

@'
ByAzen includes a separately packaged Piper text-to-speech runtime.

Piper TTS 1.8.0 — GPL-3.0-or-later
Source code for the exact upstream version: https://github.com/OHF-Voice/piper1-gpl/tree/v1.8.0
The full license is in PIPER-COPYING.txt. The related runtime license files and
third-party notices are included alongside this file.

Piper voice models are downloaded only after the user chooses a catalog entry.
Each model has its own model card and terms; open the linked model card in ByAzen
before using a downloaded voice. ByAzen currently offers Russian Denis and Dmitri
packs from the official rhasspy/piper-voices repository, pinned to v1.0.0.

Other runtime components are distributed under their respective licenses:
- ONNX Runtime: MIT, https://github.com/microsoft/onnxruntime
- pathvalidate: MIT, https://github.com/kaelzhang/python-pathvalidate
- PyInstaller bootloader: GPL with the PyInstaller exception,
  https://github.com/pyinstaller/pyinstaller
'@ | Set-Content -Encoding UTF8 (Join-Path $resourceRoot 'THIRD_PARTY_NOTICES.txt')

Write-Host "Piper runtime prepared at $distRoot"
