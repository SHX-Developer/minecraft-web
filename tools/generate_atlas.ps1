Add-Type -AssemblyName System.Drawing

$tileSize = 32
$cols = 8
$rows = 8
$atlasSize = $tileSize * $cols
$bmp = New-Object System.Drawing.Bitmap($atlasSize, $atlasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

function New-Color([int]$r, [int]$g, [int]$b, [int]$a = 255) {
  $rr = [Math]::Max(0, [Math]::Min(255, $r))
  $gg = [Math]::Max(0, [Math]::Min(255, $g))
  $bb = [Math]::Max(0, [Math]::Min(255, $b))
  $aa = [Math]::Max(0, [Math]::Min(255, $a))
  return [System.Drawing.Color]::FromArgb($aa, $rr, $gg, $bb)
}

function Tile-Pixel([int]$tx, [int]$ty, [int]$x, [int]$y, [System.Drawing.Color]$color) {
  $bmp.SetPixel($tx * $tileSize + $x, $ty * $tileSize + $y, $color)
}

function Noise01([int]$x, [int]$y, [double]$seed) {
  $v = [Math]::Sin(($x * 12.9898) + ($y * 78.233) + ($seed * 37.719)) * 43758.5453
  return $v - [Math]::Floor($v)
}

function Fill-Tile([int]$tx, [int]$ty, [System.Drawing.Color]$color) {
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y $color
    }
  }
}

function Fill-NoiseTile([int]$tx, [int]$ty, [int]$r, [int]$g, [int]$b, [int]$variance, [double]$seed, [int]$a = 255) {
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      $n = Noise01 $x $y $seed
      $delta = [Math]::Round(($n * 2.0 - 1.0) * $variance)
      Tile-Pixel $tx $ty $x $y (New-Color ($r + $delta) ($g + $delta) ($b + $delta) $a)
    }
  }
}

function Draw-Border([int]$tx, [int]$ty, [System.Drawing.Color]$color) {
  for ($i = 0; $i -lt $tileSize; $i += 1) {
    Tile-Pixel $tx $ty $i 0 $color
    Tile-Pixel $tx $ty $i ($tileSize - 1) $color
    Tile-Pixel $tx $ty 0 $i $color
    Tile-Pixel $tx $ty ($tileSize - 1) $i $color
  }
}

function Draw-GrassTop([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 94 165 59 18 1.1
  for ($i = 0; $i -lt 38; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 7) 11 1.7) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 13) 17 1.9) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 68 128 43)
  }
  for ($i = 0; $i -lt 28; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 11) 3 2.3) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 5) 19 2.7) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 122 188 87)
  }
}

function Draw-GrassSide([int]$tx, [int]$ty) {
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      if ($y -lt 9) {
        $n = Noise01 $x $y 3.1
        $d = [Math]::Round(($n * 2 - 1) * 10)
        Tile-Pixel $tx $ty $x $y (New-Color (94 + $d) (164 + $d) (60 + $d))
      } else {
        $n = Noise01 $x $y 3.7
        $d = [Math]::Round(($n * 2 - 1) * 14)
        Tile-Pixel $tx $ty $x $y (New-Color (124 + $d) (84 + $d) (42 + $d))
      }
    }
  }
  for ($x = 0; $x -lt $tileSize; $x += 1) {
    $edge = [Math]::Round((Noise01 $x 7 5.4) * 2)
    Tile-Pixel $tx $ty $x (8 + $edge) (New-Color 84 143 53)
  }
}

function Draw-Dirt([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 123 80 40 16 4.6
  for ($i = 0; $i -lt 54; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 7) 5 4.9) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 5) 23 5.1) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 96 62 32)
  }
}

function Draw-Stone([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 128 128 132 20 6.2
  for ($i = 0; $i -lt 58; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 3) 41 6.4) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 11) 8 6.7) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 98 100 105)
  }
}

function Draw-Planks([int]$tx, [int]$ty, [int]$r, [int]$g, [int]$b, [double]$seed) {
  Fill-NoiseTile $tx $ty $r $g $b 10 $seed
  for ($y = 4; $y -lt $tileSize; $y += 8) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color ($r - 28) ($g - 20) ($b - 14))
      if ($y + 1 -lt $tileSize) {
        Tile-Pixel $tx $ty $x ($y + 1) (New-Color ($r + 10) ($g + 6) ($b + 4))
      }
    }
  }
  for ($i = 0; $i -lt 10; $i += 1) {
    $kx = [Math]::Floor((Noise01 ($i * 9) 7 ($seed + 3.4)) * ($tileSize - 6)) + 3
    $ky = [Math]::Floor((Noise01 ($i * 5) 17 ($seed + 4.1)) * ($tileSize - 6)) + 3
    for ($yy = -1; $yy -le 1; $yy += 1) {
      for ($xx = -1; $xx -le 1; $xx += 1) {
        Tile-Pixel $tx $ty ($kx + $xx) ($ky + $yy) (New-Color ($r - 20) ($g - 12) ($b - 8))
      }
    }
  }
}

function Draw-LogSide([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 107 79 47 12 9.0
  for ($x = 1; $x -lt $tileSize; $x += 4) {
    for ($y = 0; $y -lt $tileSize; $y += 1) {
      $d = [Math]::Round((Noise01 $x $y 9.4) * 8)
      Tile-Pixel $tx $ty $x $y (New-Color (77 + $d) (54 + $d) (30 + $d))
    }
  }
}

function Draw-LogTop([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 141 110 74 10 10.1
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      $dx = $x - 15.5
      $dy = $y - 15.5
      $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)
      $ring = [Math]::Floor($dist / 3.5)
      if (($ring % 2) -eq 0) {
        $c = New-Color 124 94 60
      } else {
        $c = New-Color 154 124 88
      }
      Tile-Pixel $tx $ty $x $y $c
    }
  }
  Draw-Border $tx $ty (New-Color 90 66 40)
}

function Draw-Leaves([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 72 122 58 18 11.2
  for ($i = 0; $i -lt 90; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 3) 14 11.8) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 13) 6 12.3) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 55 97 44)
  }
}

function Draw-Sand([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 214 194 127 12 13.2
  for ($i = 0; $i -lt 70; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 7) 4 13.8) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 11) 19 14.1) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 194 173 108)
  }
}

function Draw-Brick([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 156 72 60 8 15.3
  for ($y = 6; $y -lt $tileSize; $y += 8) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color 100 38 30)
    }
  }
  for ($x = 8; $x -lt $tileSize; $x += 8) {
    for ($y = 0; $y -lt $tileSize; $y += 1) {
      if (([Math]::Floor($y / 8) % 2) -eq 0) {
        Tile-Pixel $tx $ty $x $y (New-Color 100 38 30)
      }
    }
  }
}

function Draw-Bedrock([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 68 68 72 24 16.1
  for ($i = 0; $i -lt 95; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 5) 13 16.4) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 9) 2 16.8) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 40 40 43)
  }
}

function Draw-Water([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 58 121 211 12 17.4 170
  for ($y = 0; $y -lt $tileSize; $y += 4) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      if (([Math]::Floor($x / 3) + [Math]::Floor($y / 4)) % 2 -eq 0) {
        Tile-Pixel $tx $ty $x $y (New-Color 85 155 238 188)
      }
    }
  }
}

function Draw-Cobble([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 120 124 130 16 18.2
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      if ((($x + $y) % 7) -eq 0 -or (($x * 3 + $y) % 11) -eq 0) {
        Tile-Pixel $tx $ty $x $y (New-Color 94 98 104)
      }
    }
  }
}

function Draw-Glass([int]$tx, [int]$ty) {
  Fill-Tile $tx $ty (New-Color 170 214 238 92)
  Draw-Border $tx $ty (New-Color 214 240 252 190)
  for ($i = 4; $i -lt 28; $i += 4) {
    Tile-Pixel $tx $ty $i $i (New-Color 232 248 255 180)
  }
}

function Draw-StoneBricks([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 136 140 146 10 19.4
  for ($y = 7; $y -lt $tileSize; $y += 8) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color 102 106 112)
    }
  }
  for ($x = 8; $x -lt $tileSize; $x += 8) {
    for ($y = 0; $y -lt $tileSize; $y += 1) {
      if (([Math]::Floor($y / 8) % 2) -eq 1) {
        Tile-Pixel $tx $ty $x $y (New-Color 102 106 112)
      }
    }
  }
}

function Draw-Gravel([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 134 129 123 16 20.8
  for ($i = 0; $i -lt 90; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 5) 7 21.0) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 7) 13 21.5) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 105 101 97)
  }
}

function Draw-Snow([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 236 242 248 8 22.1
  for ($i = 0; $i -lt 54; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 9) 6 22.6) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 3) 12 22.9) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 214 225 238)
  }
}

function Draw-Clay([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 152 169 178 10 23.3
  for ($y = 5; $y -lt $tileSize; $y += 9) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color 132 147 156)
    }
  }
}

function Draw-BookshelfSide([int]$tx, [int]$ty) {
  Fill-Tile $tx $ty (New-Color 115 84 50)
  for ($y = 3; $y -lt $tileSize; $y += 10) {
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color 78 57 33)
      if ($y + 1 -lt $tileSize) {
        Tile-Pixel $tx $ty $x ($y + 1) (New-Color 142 106 67)
      }
    }
  }
  for ($x = 2; $x -lt $tileSize - 2; $x += 6) {
    for ($y = 5; $y -lt $tileSize - 2; $y += 10) {
      $palette = @(
        (New-Color 159 46 46),
        (New-Color 49 93 170),
        (New-Color 58 150 77),
        (New-Color 202 161 54)
      )
      Tile-Pixel $tx $ty $x $y $palette[($x + $y) % $palette.Length]
      Tile-Pixel $tx $ty ($x + 1) $y $palette[($x + $y + 1) % $palette.Length]
      if ($y + 1 -lt $tileSize) {
        Tile-Pixel $tx $ty $x ($y + 1) $palette[($x + $y + 2) % $palette.Length]
      }
    }
  }
}

function Draw-Obsidian([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 36 28 67 12 24.8
  for ($i = 0; $i -lt 75; $i += 1) {
    $x = [Math]::Floor((Noise01 ($i * 7) 1 25.0) * $tileSize)
    $y = [Math]::Floor((Noise01 ($i * 3) 11 25.3) * $tileSize)
    Tile-Pixel $tx $ty $x $y (New-Color 66 44 110)
  }
}

function Draw-TorchStick([int]$tx, [int]$ty) {
  Fill-Tile $tx $ty (New-Color 84 52 21)
  for ($y = 0; $y -lt $tileSize; $y += 1) {
    $shade = if (($y % 4) -lt 2) { 8 } else { -8 }
    for ($x = 0; $x -lt $tileSize; $x += 1) {
      Tile-Pixel $tx $ty $x $y (New-Color (94 + $shade) (62 + $shade) (24 + $shade))
    }
  }
}

function Draw-TorchHead([int]$tx, [int]$ty) {
  Fill-NoiseTile $tx $ty 238 167 64 20 26.2
  for ($y = 8; $y -lt 24; $y += 1) {
    for ($x = 8; $x -lt 24; $x += 1) {
      $dx = $x - 16
      $dy = $y - 16
      $dist = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($dist -lt 6.5) {
        Tile-Pixel $tx $ty $x $y (New-Color 255 214 112)
      }
      if ($dist -lt 3.5) {
        Tile-Pixel $tx $ty $x $y (New-Color 255 236 170)
      }
    }
  }
}

# Fill whole atlas with fallback dark tile.
for ($ty = 0; $ty -lt $rows; $ty += 1) {
  for ($tx = 0; $tx -lt $cols; $tx += 1) {
    Fill-Tile $tx $ty (New-Color 40 40 40)
  }
}

# Row 0
Draw-GrassTop 0 0
Draw-GrassSide 1 0
Draw-Dirt 2 0
Draw-Stone 3 0
Draw-Planks 4 0 183 137 79 7.2
Draw-LogSide 5 0
Draw-LogTop 6 0
Draw-Leaves 7 0

# Row 1
Draw-Sand 0 1
Draw-Brick 1 1
Draw-Bedrock 2 1
Draw-Water 3 1
Draw-TorchHead 4 1
Draw-Cobble 5 1
Draw-Glass 6 1
Draw-Planks 7 1 128 94 58 8.7

# Row 2
Draw-StoneBricks 0 2
Draw-Gravel 1 2
Draw-Snow 2 2
Draw-Clay 3 2
Draw-BookshelfSide 4 2
Draw-Planks 5 2 154 116 74 9.8
Draw-Obsidian 6 2
Draw-TorchStick 7 2

# Row 3
Draw-TorchHead 0 3

$output = Join-Path $PSScriptRoot "..\\assets\\textures\\atlas.png"
$output = [System.IO.Path]::GetFullPath($output)
$bmp.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Generated atlas: $output"
