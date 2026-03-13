-- Noise Effect
-- Generates a grid of objects with pseudo-random variation.
-- Effect types: 1 = dots, 2 = squares, 3 = lines

type NoiseEffect = {
  -- Inputs
  effectType: Input<number>,   -- 1 = dots, 2 = squares, 3 = lines
  countX: Input<number>,       -- number of objects horizontally
  countY: Input<number>,       -- number of objects vertically
  areaWidth: Input<number>,    -- total width of the noise field
  areaHeight: Input<number>,   -- total height of the noise field
  objectSize: Input<number>,   -- base size of each object
  chaos: Input<number>,        -- randomness amount (0 = uniform, 100 = full noise)
  seed: Input<number>,         -- change for a different pattern
  color: Input<Color>,         -- base color of objects

  -- Internal
  paths: { Path },
  paint: Paint,
  needsRebuild: boolean,
}

-- Simple hash-based pseudo-random (deterministic per grid cell + seed)
local function hash(x: number, y: number, s: number): number
  local n = x * 374761 + y * 668265 + s * 982451
  n = math.abs(n)
  n = (n * n * n) % 65536
  return n / 65536 -- returns 0..1
end

local function buildPaths(self: NoiseEffect)
  -- Clear old paths
  for _, p in self.paths do
    p:reset()
  end

  local cx = math.floor(self.countX)
  local cy = math.floor(self.countY)
  if cx < 1 or cy < 1 then return end

  local w = self.areaWidth
  local h = self.areaHeight
  local cellW = w / cx
  local cellH = h / cy
  local baseSize = self.objectSize
  local chaosAmt = math.clamp(self.chaos / 100, 0, 1)
  local s = math.floor(self.seed)
  local effectIdx = math.clamp(math.floor(self.effectType), 1, 3)

  -- Ensure we have enough paths
  local total = cx * cy
  while #self.paths < total do
    table.insert(self.paths, Path.new())
  end

  local idx = 0
  for row = 0, cy - 1 do
    for col = 0, cx - 1 do
      idx = idx + 1
      local path = self.paths[idx]
      path:reset()

      -- Center of this cell
      local centerX = cellW * (col + 0.5)
      local centerY = cellH * (row + 0.5)

      -- Noise values for this cell
      local n1 = hash(col, row, s)         -- size variation
      local n2 = hash(col + 100, row, s)   -- position offset X
      local n3 = hash(col, row + 100, s)   -- position offset Y
      local n4 = hash(col + 200, row + 200, s) -- rotation / extra

      -- Apply chaos
      local sizeScale = 1 - chaosAmt * (1 - n1)
      local offsetX = (n2 - 0.5) * cellW * 0.4 * chaosAmt
      local offsetY = (n3 - 0.5) * cellH * 0.4 * chaosAmt

      local px = centerX + offsetX
      local py = centerY + offsetY
      local sz = baseSize * sizeScale

      if effectIdx == 1 then
        -- Dots: approximate circle with 8-segment polygon
        local segments = 8
        for i = 0, segments - 1 do
          local angle = (i / segments) * math.pi * 2
          local vx = px + math.cos(angle) * sz * 0.5
          local vy = py + math.sin(angle) * sz * 0.5
          if i == 0 then
            path:moveTo(Vector.xy(vx, vy))
          else
            path:lineTo(Vector.xy(vx, vy))
          end
        end
        path:close()

      elseif effectIdx == 2 then
        -- Squares: rotated rectangle
        local rot = n4 * math.pi * chaosAmt
        local half = sz * 0.5
        local corners = {
          { -half, -half },
          {  half, -half },
          {  half,  half },
          { -half,  half },
        }
        for i, c in corners do
          local rx = c[1] * math.cos(rot) - c[2] * math.sin(rot) + px
          local ry = c[1] * math.sin(rot) + c[2] * math.cos(rot) + py
          if i == 1 then
            path:moveTo(Vector.xy(rx, ry))
          else
            path:lineTo(Vector.xy(rx, ry))
          end
        end
        path:close()

      elseif effectIdx == 3 then
        -- Lines: short stroke at random angle
        local rot = n4 * math.pi * chaosAmt
        local halfLen = sz * 0.5
        local x1 = px - math.cos(rot) * halfLen
        local y1 = py - math.sin(rot) * halfLen
        local x2 = px + math.cos(rot) * halfLen
        local y2 = py + math.sin(rot) * halfLen
        path:moveTo(Vector.xy(x1, y1))
        path:lineTo(Vector.xy(x2, y2))
      end
    end
  end
end

function init(self: NoiseEffect, context: Context): boolean
  self.paint.color = self.color

  -- Lines use stroke style
  if math.floor(self.effectType) == 3 then
    self.paint.style = "stroke"
    self.paint.thickness = 2
    self.paint.cap = "round"
  else
    self.paint.style = "fill"
  end

  buildPaths(self)
  return true
end

function advance(self: NoiseEffect, seconds: number): boolean
  if self.needsRebuild then
    buildPaths(self)
    self.needsRebuild = false
  end
  return false
end

function update(self: NoiseEffect)
  self.paint.color = self.color

  if math.floor(self.effectType) == 3 then
    self.paint.style = "stroke"
    self.paint.thickness = 2
    self.paint.cap = "round"
  else
    self.paint.style = "fill"
  end

  self.needsRebuild = true
end

function draw(self: NoiseEffect, renderer: Renderer)
  local total = math.floor(self.countX) * math.floor(self.countY)
  for i = 1, math.min(total, #self.paths) do
    renderer:drawPath(self.paths[i], self.paint)
  end
end

return function(): Node<NoiseEffect>
  return {
    effectType  = 1,
    countX      = 10,
    countY      = 10,
    areaWidth   = 500,
    areaHeight  = 500,
    objectSize  = 20,
    chaos       = 50,
    seed        = 0,
    color       = Color.rgb(255, 255, 255),

    paths       = {},
    paint       = Paint.new(),
    needsRebuild = false,

    init    = init,
    advance = advance,
    update  = update,
    draw    = draw,
  }
end
