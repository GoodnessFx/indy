$ErrorActionPreference = 'Stop'
$files = Get-ChildItem 'C:\Users\Admin\Desktop\IndySolution\src' -Recurse -Include *.tsx,*.ts

# Ordered global replacements (regex -> replacement)
$global = @(
  @('bg-\[#0A0B0D\]', 'bg-[#F7F7F5]'),
  @('bg-\[#111318\]', 'bg-white'),
  @('bg-\[#070810\]', 'bg-white'),
  @('bg-\[#0d0f1a\]', 'bg-white'),
  @('bg-\[#0d1020\]', 'bg-[#F7F7F5]'),
  @('bg-white/', 'bg-black/'),
  @('border-white/', 'border-black/'),
  @('divide-white/', 'divide-black/'),
  @('text-white/', 'text-black/'),
  @('hover:text-white', 'hover:text-black'),
  @('text-\[#F7F7F5\]', 'text-[#0A0B0D]'),
  @('text-\[#C5C8D0\]/', 'text-black/'),
  @('text-\[#C5C8D0\]', 'text-[#0A0B0D]'),
  @('from-\[#0A0B0D\]', 'from-[#F7F7F5]'),
  @('via-\[#0A0B0D\]', 'via-white'),
  @('to-\[#0A0B0D\]', 'to-white'),
  @('to-\[#111318\]', 'to-white'),
  @('ring-white/', 'ring-black/'),
  @('shadow-white/', 'shadow-black/'),
  @('placeholder-white/', 'placeholder-black/'),
  @('rgba\(255,255,255,0\.3\)', 'rgba(0,0,0,0.45)'),
  @('rgba\(255,255,255,0\.08\)', 'rgba(0,0,0,0.08)'),
  @('#111318', '#ffffff')
)

$changed = 0
foreach ($f in $files) {
  $lines = Get-Content $f.FullName
  $out = foreach ($line in $lines) {
    $l = $line
    foreach ($m in $global) { $l = $l -replace $m[0], $m[1] }
    # text-white guarded: keep white text on accent-blue buttons/badges
    if ($l -match 'text-white\b' -and $l -notmatch 'bg-\[#2F6BFF\]' -and $l -notmatch 'btn-primary' -and $l -notmatch 'bg-\[#22C55E\]') {
      $l = $l -replace 'text-white\b', 'text-[#0A0B0D]'
    }
    $l
  }
  Set-Content -Path $f.FullName -Value $out -Encoding utf8
  $changed++
}
Write-Output "processed $changed files"
