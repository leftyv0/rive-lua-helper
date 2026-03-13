-- Rising Bars
-- Grid of cloned rectangles with noise-driven height and opacity variation.
-- Supports a two-stop vertical gradient per bar.

local NoiseUtil = require("noise-util")

type RisingBars = {
  rectWidth: Input<number>,
  rectHeight: Input<number>,
  canvasWidth: Input<number>,
  canvasHeight: Input<number>,
  xClones: Input<number>,
  yClones: Input<number>,
  colorStart: Input<Color>,     -- gradient bottom color
  colorEnd: Input<Color>,       -- gradient top color
  opacity: Input<number>,       -- base opacity 0–100
  seed: Input<number>,          -- change for a different pattern
  heightNoise: Input<number>,   -- how much noise affects height 0–100
  opacityNoise: Input<number>,  -- how much noise affects opacity 0–100
  noiseScale: Input<number>,    -- zoom into/out of noise field
  octaves: Input<number>,       -- fbm layers (1 = smooth, 4+ = detailed)
  persistence: Input<number>,   -- fbm amplitude decay per octave 0–100
  lacunarity: Input<number>,    -- fbm frequency multiplier per octave
  feather: Input<number>,       -- edge softness / blur amount (0 = sharp)

  drawPaths: { Path },
  buildPaths: { Path },
  paints: { Paint },
  barData: { { x: number, y: number, h: number, a: number } },
  paint: Paint,
  count: number,
}

local function buildRect(path: Path, x: number, y: number, w: number, h: number)
  path:reset()
  path:moveTo(Vector.xy(x, y))
  path:lineTo(Vector.xy(x + w, y))
  path:lineTo(Vector.xy(x + w, y + h))
  path:lineTo(Vector.xy(x, y + h))
  path:close()
end

local function ensurePaths(paths: { Path }, n: number)
  while #paths < n do
    table.insert(paths, Path.new())
  end
end

local function ensurePaints(paints: { Paint }, n: number)
  while #paints < n do
    table.insert(paints, Paint.with({ style = 'fill' }))
  end
end

local function ensureBarData(data: { { x: number, y: number, h: number, a: number } }, n: number)
  while #data < n do
    table.insert(data, { x = 0, y = 0, h = 0, a = 1 })
  end
end

local function sampleNoise(x: number, y: number, oct: number, pers: number, lac: number): number
  local n = NoiseUtil.fbm(x + y * 57.13, oct, pers, lac)
  return n * 0.5 + 0.5
end

local function buildGrid(self: RisingBars, paths: { Path })
  local cx = math.floor(self.xClones)
  if cx < 1 then cx = 1 end
  local cy = math.floor(self.yClones)
  if cy < 1 then cy = 1 end

  local total = cx * cy
  ensurePaths(paths, total)
  ensurePaints(self.paints, total)
  ensureBarData(self.barData, total)

  local rw = self.rectWidth
  local rh = self.rectHeight
  local cw = self.canvasWidth
  local ch = self.canvasHeight
  local s = math.floor(self.seed)
  local scale = self.noiseScale

  local oct = math.floor(self.octaves)
  if oct < 1 then oct = 1 end
  if oct > 8 then oct = 8 end

  local pers = self.persistence / 100
  if pers < 0 then pers = 0 end
  if pers > 1 then pers = 1 end

  local lac = self.lacunarity
  if lac < 1 then lac = 1 end

  local hNoise = self.heightNoise / 100
  if hNoise < 0 then hNoise = 0 end
  if hNoise > 1 then hNoise = 1 end

  local oNoise = self.opacityNoise / 100
  if oNoise < 0 then oNoise = 0 end
  if oNoise > 1 then oNoise = 1 end

  local baseAlpha = self.opacity / 100
  if baseAlpha < 0 then baseAlpha = 0 end
  if baseAlpha > 1 then baseAlpha = 1 end

  local xStep = 0
  local yStep = 0
  if cx > 1 then
    xStep = (cw - rw) / (cx - 1)
  end
  if cy > 1 then
    yStep = (ch - rh) / (cy - 1)
  end

  local idx = 0
  for row = 0, cy - 1 do
    for col = 0, cx - 1 do
      idx = idx + 1

      local nx = col * scale + s * 13.37
      local ny = row * scale + s * 17.71

      local n1 = sampleNoise(nx, ny, oct, pers, lac)
      local n2 = sampleNoise(nx + 100.5, ny + 200.3, oct, pers, lac)

      local hScale = 1 - hNoise + hNoise * n1
      local aScale = 1 - oNoise + oNoise * n2

      local h = rh * hScale
      local a = baseAlpha * aScale

      local x = col * xStep
      local yBase = row * yStep + rh
      local y = yBase - h

      buildRect(paths[idx], x, y, rw, h)

      -- Store bar geometry for gradient application in draw
      self.barData[idx].x = x
      self.barData[idx].y = y
      self.barData[idx].h = h
      self.barData[idx].a = a
    end
  end

  self.count = total
end

function init(self: RisingBars, context: Context): boolean
  buildGrid(self, self.drawPaths)
  return true
end

function advance(self: RisingBars, seconds: number): boolean
  buildGrid(self, self.buildPaths)

  local temp = self.drawPaths
  self.drawPaths = self.buildPaths
  self.buildPaths = temp

  return false
end

function update(self: RisingBars)
  -- inputs changed, advance will pick up new values
end

function draw(self: RisingBars, renderer: Renderer)
  local transparent = Color.rgba(0, 0, 0, 0)
  local cStart = self.colorStart
  local cEnd = self.colorEnd

  for i = 1, self.count do
    local bar = self.barData[i]
    local a = bar.a

    -- Apply opacity to gradient stops
    local c0 = Color.lerp(transparent, cStart, a)
    local c1 = Color.lerp(transparent, cEnd, a)

    -- Vertical gradient per bar: bottom (colorStart) to top (colorEnd)
    local midX = bar.x + self.rectWidth / 2
    local grad = Gradient.linear(
      Vector.xy(midX, bar.y + bar.h),
      Vector.xy(midX, bar.y),
      {
        { position = 0, color = c0 },
        { position = 1, color = c1 },
      }
    )

    self.paints[i] = Paint.with({ style = 'fill', gradient = grad, feather = self.feather })
    renderer:drawPath(self.drawPaths[i], self.paints[i])
  end
end

return function(): Node<RisingBars>
  return {
    rectWidth = 50,
    rectHeight = 50,
    canvasWidth = 500,
    canvasHeight = 500,
    xClones = 5,
    yClones = 5,
    colorStart = Color.rgb(255, 255, 255),
    colorEnd = Color.rgb(100, 100, 255),
    opacity = 100,
    seed = 0,
    heightNoise = 50,
    opacityNoise = 50,
    noiseScale = 1.5,
    octaves = 3,
    persistence = 50,
    lacunarity = 2,
    feather = 0,

    drawPaths = {},
    buildPaths = {},
    paints = {},
    barData = {},
    paint = Paint.with({ style = 'fill', color = Color.rgb(255, 255, 255) }),
    count = 0,

    init = init,
    advance = advance,
    update = update,
    draw = draw,
  }
end
