-- NoiseUtil: Smooth noise + glitch-specific helpers (32-bit safe)

-- ─────────────────────────────────────────────
--  Core hash  →  [0, 1]
-- ─────────────────────────────────────────────
local function hash(n: number): number
	n = n % 2147483647
	if n <= 0 then n = n + 2147483646 end
	n = (n * 1664525 + 1013904223) % 4294967296
	n = (n * 1664525 + 1013904223) % 4294967296
	return (n % 100000) / 100000
end

-- ─────────────────────────────────────────────
--  1-D smooth gradient noise  →  [-1, 1]
-- ─────────────────────────────────────────────
local function smoothNoise1D(x: number): number
	local xi = math.floor(x)
	local xf = x - xi
	local u  = xf * xf * (3 - 2 * xf)           -- smoothstep
	local a  = hash(xi)     * 2 - 1
	local b  = hash(xi + 1) * 2 - 1
	return a + (b - a) * u
end

-- ─────────────────────────────────────────────
--  Fractal Brownian Motion  →  [-1, 1]
-- ─────────────────────────────────────────────
local function fbm(x: number, octaves: number, persistence: number, lacunarity: number): number
	local value    = 0
	local amplitude = 1
	local frequency = 1
	local maxValue  = 0
	for _ = 1, octaves do
		value    = value + smoothNoise1D(x * frequency) * amplitude
		maxValue = maxValue + amplitude
		amplitude = amplitude * persistence
		frequency = frequency * lacunarity
	end
	return value / maxValue
end

-- ─────────────────────────────────────────────
--  2-D smooth noise  →  [-1, 1]
-- ─────────────────────────────────────────────
local function smoothNoise2D(x: number, y: number): number
	local xi = math.floor(x)
	local yi = math.floor(y)
	local xf = x - xi
	local yf = y - yi
	local ux = xf * xf * (3 - 2 * xf)
	local uy = yf * yf * (3 - 2 * yf)
	local s  = xi + yi * 57
	local aa = hash(s)      * 2 - 1
	local ba = hash(s + 1)  * 2 - 1
	local ab = hash(s + 57) * 2 - 1
	local bb = hash(s + 58) * 2 - 1
	local x1 = aa + (ba - aa) * ux
	local x2 = ab + (bb - ab) * ux
	return x1 + (x2 - x1) * uy
end

-- ─────────────────────────────────────────────
--  White noise: instant random snap  →  [-1, 1]
--  Changes every ~interval seconds (staircase).
-- ─────────────────────────────────────────────
local function whiteNoise(t: number, interval: number, seed: number): number
	local frame = math.floor(t / interval)
	return hash(frame * 9337 + seed * 1193) * 2 - 1
end

-- ─────────────────────────────────────────────
--  Step noise: quantised smooth noise  →  [-1, 1]
--  Locks into discrete steps like a sample-and-hold.
-- ─────────────────────────────────────────────
local function stepNoise(t: number, steps: number, seed: number): number
	local raw = smoothNoise1D(t + seed)   -- [-1, 1]
	-- quantise into `steps` discrete levels
	local q = math.floor((raw * 0.5 + 0.5) * steps + 0.5) / steps
	return q * 2 - 1
end

-- ─────────────────────────────────────────────
--  Glitch pulse: rare sharp spike  →  [0, 1]
--  Returns a value near 1 only during short bursts,
--  otherwise 0.  frequency controls how often [0..1].
-- ─────────────────────────────────────────────
local function glitchPulse(t: number, frequency: number, seed: number): number
	-- quantise time into windows
	local window   = math.floor(t * 8 + seed * 37)
	local rand     = hash(window * 2311 + seed * 719)
	-- fire only when rand < frequency
	if rand > frequency then return 0 end
	-- within the window, ramp up sharply then decay
	local phase = (t * 8 + seed * 37) - math.floor(t * 8 + seed * 37)
	local spike = 1 - phase * phase * 4            -- sharp triangle-ish
	return math.max(0, spike)
end

return {
	hash          = hash,
	smoothNoise1D = smoothNoise1D,
	fbm           = fbm,
	smoothNoise2D = smoothNoise2D,
	whiteNoise    = whiteNoise,
	stepNoise     = stepNoise,
	glitchPulse   = glitchPulse,
}
