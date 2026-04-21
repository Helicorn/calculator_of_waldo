param(
    [switch]$SkipJpackage
)

# MatchStatistics — Java 컴파일, dist JAR, Windows용 MatchStatistics.exe(런처), 선택적 jpackage
# jpackage 작업 경로: program\package9\ (저장소에는 포함되지 않음)
# .exe 런처: .NET Framework csc. 실행 PC에 JDK(java) 필요 — jpackage 성공 시 program\package9\MatchStatistics 에 앱 이미지 복사.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Get-JavaHome {
    if ($env:JAVA_HOME) {
        $jh = $env:JAVA_HOME.TrimEnd('\', '/')
        $jar = Join-Path $jh "bin\jar.exe"
        if (Test-Path -LiteralPath $jar) { return $jh }
    }
    $text = (& java -XshowSettings:properties -version 2>&1 | Out-String)
    if ($text -match 'java\.home\s*=\s*(\S+)') {
        $jh = $matches[1].Trim()
        $jar = Join-Path $jh "bin\jar.exe"
        if (Test-Path -LiteralPath $jar) { return $jh }
    }
    throw @"
JDK bin(jar, javac, jpackage)을 찾지 못했습니다.
- JAVA_HOME을 JDK 루트로 설정하거나
- PATH의 java가 Oracle javapath 스텁이면, JDK 설치 경로의 bin을 PATH 앞에 두세요.
"@
}

$javaHome = Get-JavaHome
$JdkBin = Join-Path $javaHome "bin"
$javac = Join-Path $JdkBin "javac.exe"
$jar = Join-Path $JdkBin "jar.exe"
$jpackage = Join-Path $JdkBin "jpackage.exe"
$jlink = Join-Path $JdkBin "jlink.exe"

$OjdbcVersion = "23.5.0.24.07"
$OjdbcJar = "ojdbc11-$OjdbcVersion.jar"
$OjdbcUrl = "https://repo1.maven.org/maven2/com/oracle/database/jdbc/ojdbc11/$OjdbcVersion/$OjdbcJar"
$LibDir = Join-Path $Root "lib"
$BuildClasses = Join-Path $Root "build\classes"
$DistDir = Join-Path $Root "dist"
$InstallerDir = Join-Path $Root "installer"

New-Item -ItemType Directory -Force -Path $LibDir, $BuildClasses, $DistDir | Out-Null

$ojdbcPath = Join-Path $LibDir "ojdbc11.jar"
if (-not (Test-Path $ojdbcPath)) {
    Write-Host "Oracle JDBC 다운로드 중..."
    Invoke-WebRequest -Uri $OjdbcUrl -OutFile $ojdbcPath
}

Write-Host "컴파일 중..."
& $javac -encoding UTF-8 `
    -d $BuildClasses `
    (Join-Path $Root "MatchStatistics.java") `
    (Join-Path $Root "repository\MatchRepository.java") `
    (Join-Path $Root "repository\SeedPlayerRepository.java")

$mainJar = Join-Path $DistDir "MatchStatistics.jar"
Write-Host "JAR 생성: $mainJar"
if (Test-Path $mainJar) { Remove-Item $mainJar }
& $jar --create --file $mainJar --main-class program.MatchStatistics -C $BuildClasses .

Copy-Item -Force $ojdbcPath (Join-Path $DistDir "ojdbc11.jar")

$runBat = @"
@echo off
title MatchStatistics
cd /d "%~dp0"
where java >nul 2>&1
if %errorlevel% equ 0 (
  java -Dfile.encoding=UTF-8 -cp "MatchStatistics.jar;ojdbc11.jar" program.MatchStatistics
  goto :end
)
if defined JAVA_HOME if exist "%JAVA_HOME%\bin\java.exe" (
  "%JAVA_HOME%\bin\java.exe" -Dfile.encoding=UTF-8 -cp "MatchStatistics.jar;ojdbc11.jar" program.MatchStatistics
  goto :end
)
echo JDK java를 PATH 또는 JAVA_HOME에 설정하세요.
pause
exit /b 1
:end
if errorlevel 1 pause
"@
Set-Content -Path (Join-Path $DistDir "Run-MatchStatistics.bat") -Value $runBat -Encoding Default
Write-Host "배치: $(Join-Path $DistDir 'Run-MatchStatistics.bat')"

# --- 네이티브 런처 .exe (csc) ---
$csc = @(
    (Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"),
    (Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe")
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

$launcherCs = Join-Path $Root "launcher\MatchStatisticsLauncher.cs"
$exeOut = Join-Path $DistDir "MatchStatistics.exe"
if ($csc -and (Test-Path -LiteralPath $launcherCs)) {
    Write-Host "C# 런처 컴파일 -> $exeOut"
    & $csc /nologo /target:winexe /out:$exeOut /reference:System.Windows.Forms.dll $launcherCs
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "csc 실패 — Run-MatchStatistics.bat 로 실행하세요."
    } else {
        Write-Host "실행 파일: $exeOut"
    }
} else {
    Write-Warning "csc 또는 launcher 소스가 없어 .exe 런처를 건너뜁니다."
}

$BundleDir = Join-Path (Join-Path $Root "package9") "MatchStatistics"
if (-not $SkipJpackage) {
    # --- jpackage → program\package9\MatchStatistics (JRE 포함, MatchStatistics.java 와 동일 앱) ---
    # jpackage/jlink는 경로가 길면 Windows에서 실패하므로, 가능하면 짧은 스테이징(C:\msjp)에서 빌드 후 robocopy로 복사한다.
    $Package9Root = Join-Path $Root "package9"
    New-Item -ItemType Directory -Force -Path $Package9Root | Out-Null

    foreach ($old in @(
            (Join-Path $InstallerDir "MatchStatistics"),
            $BundleDir
        )) {
        if (Test-Path -LiteralPath $old) {
            Remove-Item -LiteralPath $old -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    function Get-JpackageStageRoot {
        foreach ($c in @("C:\msjp", (Join-Path $env:TEMP "msjp"))) {
            try {
                New-Item -ItemType Directory -Force -Path $c | Out-Null
                $p = Join-Path $c ".w"
                [IO.File]::WriteAllText($p, "1")
                Remove-Item -LiteralPath $p -Force
                return $c
            } catch {
                continue
            }
        }
        throw "jpackage용 스테이징 폴더를 만들 수 없습니다."
    }

    $Stage = Join-Path (Get-JpackageStageRoot) ("s" + [Guid]::NewGuid().ToString("n").Substring(0, 8))
    $RtImage = Join-Path $Stage "rt"
    $PkgTemp = Join-Path $Stage "tmp"
    $PkgOut = Join-Path $Stage "out"
    $JpInput = Join-Path $Stage "in"
    try {
        New-Item -ItemType Directory -Force -Path $Stage, $JpInput | Out-Null
        Copy-Item -LiteralPath (Join-Path $DistDir "MatchStatistics.jar") -Destination $JpInput -Force
        Copy-Item -LiteralPath (Join-Path $DistDir "ojdbc11.jar") -Destination $JpInput -Force

        Write-Host "jlink 최소 런타임 생성..."
        & $jlink `
            --module-path (Join-Path $javaHome "jmods") `
            --add-modules java.base,java.desktop,java.sql,jdk.crypto.ec `
            --strip-debug --no-header-files --no-man-pages `
            --output $RtImage
        if ($LASTEXITCODE -ne 0) {
            throw "jlink exit $LASTEXITCODE"
        }

        New-Item -ItemType Directory -Force -Path $PkgTemp, $PkgOut | Out-Null
        Write-Host "jpackage 앱 이미지 생성 (스테이징: $Stage)..."
        & $jpackage `
            --type app-image `
            --name "MatchStatistics" `
            --app-version "1.0" `
            --dest $PkgOut `
            -i $JpInput `
            --main-jar "MatchStatistics.jar" `
            --main-class "program.MatchStatistics" `
            --java-options "-Dfile.encoding=UTF-8" `
            --runtime-image $RtImage `
            --temp $PkgTemp

        if ($LASTEXITCODE -ne 0) {
            throw "jpackage exit $LASTEXITCODE"
        }

        $built = Join-Path $PkgOut "MatchStatistics"
        $bundledExe = Join-Path $built "MatchStatistics.exe"
        if (-not (Test-Path -LiteralPath $bundledExe)) {
            throw "jpackage 산출물에 MatchStatistics.exe 없음: $built"
        }

        New-Item -ItemType Directory -Force -Path $Package9Root | Out-Null
        & robocopy.exe $built $BundleDir /E /NJH /NJS /NFL /NDL | Out-Null
        if ($LASTEXITCODE -ge 8) {
            throw "robocopy 실패 (exit $LASTEXITCODE)"
        }
        Write-Host "JRE 포함 앱: $(Join-Path $BundleDir 'MatchStatistics.exe')"
    } catch {
        Write-Warning "jpackage 번들 생성 실패 — dist 의 MatchStatistics.exe / 배치로 실행하세요. ($_)"
    } finally {
        Remove-Item -LiteralPath $Stage -Recurse -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "SkipJpackage: dist 실행파일만 갱신했습니다."
}

Write-Host ""
Write-Host "배포 폴더: $DistDir"
Write-Host "  - MatchStatistics.exe  (JDK가 PATH/JAVA_HOME에 있을 때)"
Write-Host "  - Run-MatchStatistics.bat"
Write-Host "  - MatchStatistics.jar, ojdbc11.jar"
Write-Host "JRE 포함 번들(재빌드 후): $BundleDir\MatchStatistics.exe"
