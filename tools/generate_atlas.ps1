$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$Tile = 32
$Cols = 8
$Rows = 8
$Width = $Tile * $Cols
$Height = $Tile * $Rows

$Fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
$Bitmap = New-Object System.Drawing.Bitmap $Width, $Height, $Fmt
$Graphics = [System.Drawing.Graphics]::FromImage($Bitmap)
$Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
$Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
$Graphics.Clear([System.Drawing.Color]::FromArgb(255, 40, 40, 40))

function Col([string]$Hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($Hex)
}

function ClampByte([int]$Value) {
  if ($Value -lt 0) { return 0 }
  if ($Value -gt 255) { return 255 }
  return $Value
}

function JitColor([System.Drawing.Color]$BaseColor, [int]$Jitter, [System.Random]$Rnd) {
  $dr = $Rnd.Next(-$Jitter, $Jitter + 1)
  $dg = $Rnd.Next(-$Jitter, $Jitter + 1)
  $db = $Rnd.Next(-$Jitter, $Jitter + 1)
  return [System.Drawing.Color]::FromArgb(
    255,
    (ClampByte ($BaseColor.R + $dr)),
    (ClampByte ($BaseColor.G + $dg)),
    (ClampByte ($BaseColor.B + $db))
  )
}

function FillNoiseTile(
  [int]$Tx,
  [int]$Ty,
  [System.Drawing.Color]$ColorA,
  [System.Drawing.Color]$ColorB,
  [int]$Jitter,
  [int]$Seed,
  [int]$Cell = 2
) {
  $Rnd = New-Object System.Random $Seed
  if ($Cell -lt 1) { $Cell = 1 }
  for ($y = 0; $y -lt $Tile; $y += $Cell) {
    for ($x = 0; $x -lt $Tile; $x += $Cell) {
      $pick = $Rnd.NextDouble()
      $base = if ($pick -lt 0.52) { $ColorA } else { $ColorB }
      $c = JitColor $base $Jitter $Rnd
      for ($yy = 0; $yy -lt $Cell; $yy++) {
        $py = $y + $yy
        if ($py -ge $Tile) { continue }
        for ($xx = 0; $xx -lt $Cell; $xx++) {
          $px = $x + $xx
          if ($px -ge $Tile) { continue }
          $Bitmap.SetPixel($Tx * $Tile + $px, $Ty * $Tile + $py, $c)
        }
      }
    }
  }
}

function DrawHLine([int]$Tx, [int]$Ty, [int]$Y, [System.Drawing.Color]$Color) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel($Tx * $Tile + $x, $Ty * $Tile + $Y, $Color)
  }
}

function DrawVLine([int]$Tx, [int]$Ty, [int]$X, [System.Drawing.Color]$Color) {
  for ($y = 0; $y -lt $Tile; $y++) {
    $Bitmap.SetPixel($Tx * $Tile + $X, $Ty * $Tile + $y, $Color)
  }
}

# Row 0
FillNoiseTile 0 0 (Col "#5FA742") (Col "#4F9436") 8 101 2      # grass_top
FillNoiseTile 1 0 (Col "#7D5A34") (Col "#6F4C2B") 7 102 2       # grass_side base
for ($y = 0; $y -lt 9; $y++) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel(1 * $Tile + $x, 0 * $Tile + $y, (Col "#66B247"))
  }
}
FillNoiseTile 2 0 (Col "#7A4D2A") (Col "#6B421F") 7 103 2       # dirt
FillNoiseTile 3 0 (Col "#8B8B8B") (Col "#787878") 6 104 2       # stone
FillNoiseTile 4 0 (Col "#B58F56") (Col "#A67F49") 5 105 2       # planks
for ($y = 5; $y -lt $Tile; $y += 8) { DrawHLine 4 0 $y (Col "#8F6A37") }
FillNoiseTile 5 0 (Col "#845F3C") (Col "#744F2F") 5 106 2       # log_side
for ($y = 4; $y -lt $Tile; $y += 6) { DrawHLine 5 0 $y (Col "#5D4025") }
FillNoiseTile 6 0 (Col "#B08A5A") (Col "#9A754A") 5 107 2       # log_top
for ($y = 0; $y -lt $Tile; $y++) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $dx = $x - 15
    $dy = $y - 15
    if (($dx * $dx + $dy * $dy) -lt 36) {
      $Bitmap.SetPixel(6 * $Tile + $x, 0 * $Tile + $y, (Col "#6F4B2E"))
    }
  }
}
FillNoiseTile 7 0 (Col "#4A8742") (Col "#3E7338") 7 108 2       # leaves

# Row 1
FillNoiseTile 0 1 (Col "#D9C385") (Col "#CCB679") 4 109 2       # sand
FillNoiseTile 1 1 (Col "#A35949") (Col "#934B3F") 4 110 2       # brick
for ($y = 0; $y -lt $Tile; $y += 8) {
  DrawHLine 1 1 $y (Col "#7A352B")
  $off = ((($y / 8) % 2) * 8)
  for ($x = $off; $x -lt $Tile; $x += 16) {
    for ($k = 0; $k -lt 8; $k++) {
      if ($y + $k -lt $Tile) {
        $Bitmap.SetPixel(1 * $Tile + $x, 1 * $Tile + $y + $k, (Col "#7A352B"))
      }
    }
  }
}
FillNoiseTile 2 1 (Col "#555555") (Col "#434343") 8 111 2      # bedrock

$WaterA = [System.Drawing.Color]::FromArgb(170, 52, 108, 190)
$WaterB = [System.Drawing.Color]::FromArgb(200, 92, 152, 228)
for ($y = 0; $y -lt $Tile; $y++) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel(3 * $Tile + $x, 1 * $Tile + $y, $WaterA)
  }
}
for ($y = 2; $y -lt $Tile; $y += 6) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel(3 * $Tile + $x, 1 * $Tile + $y, $WaterB)
  }
}

# Torch tile with alpha
$Transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
for ($y = 0; $y -lt $Tile; $y++) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel(4 * $Tile + $x, 1 * $Tile + $y, $Transparent)
  }
}
$Stick = Col "#6A4B2C"
$Head = Col "#C38E3D"
$Flame = Col "#FFD88A"
for ($y = 10; $y -lt 30; $y++) {
  for ($x = 14; $x -lt 18; $x++) {
    $Bitmap.SetPixel(4 * $Tile + $x, 1 * $Tile + $y, $Stick)
  }
}
for ($y = 6; $y -lt 12; $y++) {
  for ($x = 12; $x -lt 20; $x++) {
    $Bitmap.SetPixel(4 * $Tile + $x, 1 * $Tile + $y, $Head)
  }
}
for ($y = 3; $y -lt 8; $y++) {
  for ($x = 13; $x -lt 19; $x++) {
    $Bitmap.SetPixel(4 * $Tile + $x, 1 * $Tile + $y, $Flame)
  }
}

FillNoiseTile 5 1 (Col "#7D8086") (Col "#6F7277") 8 112 2      # cobble

$GlassBase = [System.Drawing.Color]::FromArgb(140, 172, 210, 240)
$GlassLine = [System.Drawing.Color]::FromArgb(220, 240, 250, 255)
for ($y = 0; $y -lt $Tile; $y++) {
  for ($x = 0; $x -lt $Tile; $x++) {
    $Bitmap.SetPixel(6 * $Tile + $x, 1 * $Tile + $y, $GlassBase)
  }
}
for ($i = 0; $i -lt $Tile; $i += 8) {
  DrawVLine 6 1 $i $GlassLine
  DrawHLine 6 1 $i $GlassLine
}

FillNoiseTile 7 1 (Col "#8A6642") (Col "#755535") 5 113 2       # dark_planks
for ($y = 5; $y -lt $Tile; $y += 8) { DrawHLine 7 1 $y (Col "#5A3F27") }

# Row 2
FillNoiseTile 0 2 (Col "#90969D") (Col "#7E848A") 6 114 2       # stone_bricks
for ($y = 0; $y -lt $Tile; $y += 8) { DrawHLine 0 2 $y (Col "#6B7279") }
for ($x = 0; $x -lt $Tile; $x += 8) { DrawVLine 0 2 $x (Col "#6B7279") }
FillNoiseTile 1 2 (Col "#8F8A84") (Col "#7B7672") 7 115 2       # gravel
FillNoiseTile 2 2 (Col "#EEF4FA") (Col "#DCE5EF") 3 116 2       # snow
FillNoiseTile 3 2 (Col "#A2ACBE") (Col "#9099AF") 4 117 2       # clay
FillNoiseTile 4 2 (Col "#A07748") (Col "#8D653C") 5 118 2       # bookshelf_side
for ($x = 0; $x -lt $Tile; $x += 8) { DrawVLine 4 2 $x (Col "#5C3C23") }
$Books = @("#4D79C9", "#B84A41", "#D8C06A", "#4E9A5F")
for ($x = 1; $x -lt $Tile - 2; $x += 4) {
  $idx = [int](($x / 4) % $Books.Count)
  $bc = Col $Books[$idx]
  for ($y = 4; $y -lt $Tile - 4; $y++) {
    $Bitmap.SetPixel(4 * $Tile + $x, 2 * $Tile + $y, $bc)
    $Bitmap.SetPixel(4 * $Tile + $x + 1, 2 * $Tile + $y, $bc)
  }
}
FillNoiseTile 5 2 (Col "#B38A58") (Col "#9D774B") 4 119 2       # bookshelf_top
for ($y = 5; $y -lt $Tile; $y += 8) { DrawHLine 5 2 $y (Col "#7E5A37") }
FillNoiseTile 6 2 (Col "#3A2D63") (Col "#281F48") 5 120 2       # obsidian

# torch_stick
FillNoiseTile 7 2 (Col "#7B5A37") (Col "#694A2D") 4 121 2
for ($y = 4; $y -lt $Tile; $y += 8) { DrawHLine 7 2 $y (Col "#56391f") }

# torch_head
FillNoiseTile 0 3 (Col "#f1be59") (Col "#c98734") 4 122 2
for ($y = 0; $y -lt 8; $y++) {
  for ($x = 10; $x -lt 22; $x++) {
    $Bitmap.SetPixel(0 * $Tile + $x, 3 * $Tile + $y, (Col "#ffe39b"))
  }
}

$Output = Join-Path $PSScriptRoot "..\\assets\\textures\\atlas.png"
$Output = [System.IO.Path]::GetFullPath($Output)
$Bitmap.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)

$Graphics.Dispose()
$Bitmap.Dispose()
Write-Output \"WROTE $Output\"
