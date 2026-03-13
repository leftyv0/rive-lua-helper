---
name: rive
description: Write Rive Luau scripts using the correct protocol patterns, API, and type annotations. Use when the user asks to create, edit, or debug any Rive scripting code (.luau files).
argument-hint: "[protocol-type] [script-name]"
---

# Rive Luau Scripting Skill

You are an expert Rive Luau script author. Rive uses Luau (Roblox's typed Lua variant) for scripting interactive animations. When writing Rive scripts, always use correct protocol patterns, lifecycle hooks, type annotations, and API calls.

Scripts are stored in `scripts/{protocol-type}/` as `.luau` files. Use the server API at `/api/scripts` for CRUD operations if the playground is running, otherwise write files directly.

## Arguments

If `$ARGUMENTS` is provided, parse it as `[protocol-type] [script-name]`. Create a new script of that protocol type with that name. If only a protocol type is given, ask for a name. If no arguments, ask what the user wants to build.

Valid protocol types: `node`, `layout`, `converter`, `path-effect`, `transition-condition`, `listener-action`, `util`, `test`

---

## Protocol Templates

Every Rive script follows a factory-function pattern. The factory returns a table with lifecycle methods. Use the correct pattern for each protocol type.

### Node
Runs on a node each frame. Access to self, context, and renderer.

```luau
return function(artboard: Artboard): Node
    local node = artboard:node("NodeName")

    function node:init(context: Context)
        -- Called once when the script is first attached
    end

    function node:advance(dt: number, context: Context)
        -- Called every frame with delta time
    end

    function node:update(context: Context)
        -- Called when the node's transform needs updating
    end

    function node:draw(renderer: Renderer, context: Context)
        -- Called when rendering the node
    end

    function node:pointerDown(x: number, y: number, context: Context) end
    function node:pointerUp(x: number, y: number, context: Context) end
    function node:pointerMove(x: number, y: number, context: Context) end

    return node
end
```

### Layout
Extends Node with `measure` and `resize` for custom layout behavior.

```luau
return function(artboard: Artboard): Layout
    local layout = artboard:node("LayoutName")

    function layout:init(context: Context) end

    function layout:measure(width: number, widthMode: LayoutMeasureMode,
                            height: number, heightMode: LayoutMeasureMode,
                            context: Context): (number, number)
        -- widthMode/heightMode: "exactly" | "atMost" | "undefined"
        return width, height
    end

    function layout:resize(width: number, height: number, context: Context)
        -- Position children after layout resolves
    end

    function layout:advance(dt: number, context: Context) end
    function layout:update(context: Context) end
    function layout:draw(renderer: Renderer, context: Context) end

    return layout
end
```

### Converter
Transforms values between view model properties and display values.

```luau
return function(): Converter
    local converter = {}

    function converter:init(context: Context) end

    function converter:convert(value: any, context: Context): any
        return value
    end

    function converter:reverseConvert(value: any, context: Context): any
        return value
    end

    return converter
end
```

### Path Effect
Modifies paths before rendering (dashes, distortions, etc).

```luau
return function(artboard: Artboard): PathEffect
    local effect = {}

    function effect:init(context: Context) end
    function effect:update(context: Context) end
    function effect:advance(dt: number, context: Context) end

    function effect:effect(path: Path, context: Context): Path
        local result = Path.new()
        for _, contour in path:contours() do
            for _, segment in contour:segments() do
                -- Process segments
            end
        end
        return result
    end

    return effect
end
```

### Transition Condition
Evaluates whether a state machine transition should fire.

```luau
return function(): TransitionCondition
    local condition = {}

    function condition:init(context: Context) end

    function condition:evaluate(context: Context): boolean
        return false
    end

    return condition
end
```

### Listener Action
Runs custom logic when a Rive listener event fires.

```luau
return function(): ListenerAction
    local action = {}

    function action:init(context: Context) end

    function action:perform(context: Context)
        -- Runs each time the listener event fires
    end

    return action
end
```

### Util (Module)
Shared utilities importable via `require`.

```luau
local M = {}

function M.myFunction(arg: number): number
    return arg * 2
end

return M
```

### Test
Uses Rive's built-in test framework.

```luau
return function(test: Tester)
    test:group("Group Name", function()
        test:case("should do something", function()
            test:expect(1 + 1):toBe(2)
        end)
    end)
end
```

---

## Full API Reference

### Renderer
| Method | Description |
|--------|-------------|
| `renderer:save()` | Push current transform/clip state onto the stack |
| `renderer:restore()` | Pop the last saved state |
| `renderer:transform(matrix: Mat2D)` | Apply a 2D affine transform |
| `renderer:translate(x, y)` | Translate current transform |
| `renderer:rotate(radians)` | Rotate current transform |
| `renderer:scale(sx, sy)` | Scale current transform |
| `renderer:drawPath(path: Path, paint: Paint)` | Draw a path with paint |
| `renderer:drawImage(image: Image, paint: Paint?)` | Draw an image |
| `renderer:clipPath(path: Path)` | Clip subsequent drawing to path |
| `renderer:align(fit, alignment, frame, content)` | Fit content into a frame |

### Path
| Method | Description |
|--------|-------------|
| `Path.new(): Path` | Create new empty path |
| `path:moveTo(x, y)` | Start new contour |
| `path:lineTo(x, y)` | Add line segment |
| `path:cubicTo(ox, oy, ix, iy, x, y)` | Add cubic Bezier curve |
| `path:close()` | Close current contour |
| `path:addRect(x, y, w, h)` | Add rectangle sub-path |
| `path:addOval(x, y, w, h)` | Add oval sub-path |
| `path:addRoundRect(x, y, w, h, rx, ry)` | Add rounded rectangle |
| `path:contours(): iterator` | Iterate contours (each has `:segments()`) |
| `path:measure(): PathMeasure` | Get PathMeasure for positions/tangents |
| `pathMeasure:length(): number` | Total path length |
| `pathMeasure:position(distance): Vec2D` | Position at distance |
| `pathMeasure:tangent(distance): Vec2D` | Tangent at distance |
| `path:reset()` | Clear all contours |

### Paint
| Method | Description |
|--------|-------------|
| `Paint.new(): Paint` | Create paint with defaults |
| `paint:with({ ... }): Paint` | Copy with modified props (style, color, thickness, join, cap, blendMode) |
| `paint:copy(): Paint` | Exact copy |
| `paint.style` | `"fill"` or `"stroke"` |
| `paint.color` | The paint Color |
| `paint.thickness` | Stroke width |
| `paint.join` | `"miter"` / `"round"` / `"bevel"` |
| `paint.cap` | `"butt"` / `"round"` / `"square"` |
| `paint.blendMode` | `"srcOver"` / `"screen"` / `"multiply"` / etc. |
| `paint:linearGradient(sx, sy, ex, ey, colors, stops)` | Linear gradient shader |
| `paint:radialGradient(cx, cy, radius, colors, stops)` | Radial gradient shader |

### Color
| Method | Description |
|--------|-------------|
| `Color.rgb(r, g, b): Color` | From RGB (0-1 range) |
| `Color.rgba(r, g, b, a): Color` | From RGBA (0-1 range) |
| `Color.hex(hex: string): Color` | From hex string like `"#FF00AA"` |
| `Color.lerp(a, b, t): Color` | Interpolate between colors |
| `color.r / .g / .b / .a` | Read/write channels (0-1) |
| `color.opacity` | Shorthand for alpha |

### Vec2D
| Method | Description |
|--------|-------------|
| `Vec2D.xy(x, y): Vec2D` | Create 2D vector |
| `Vec2D.origin(): Vec2D` | Shorthand for (0, 0) |
| `Vec2D.lerp(a, b, t): Vec2D` | Interpolate between vectors |
| `vec.x / .y` | Read/write components |
| `vec:normalized(): Vec2D` | Unit-length copy |
| `vec:length(): number` | Magnitude |
| `Vec2D.distance(a, b): number` | Distance between points |
| `Vec2D.dot(a, b): number` | Dot product |
| `Vec2D.cross(a, b): number` | Cross product (scalar in 2D) |
| `a + b, a - b, a * scalar, -a` | Arithmetic operators overloaded |

### Context
| Method | Description |
|--------|-------------|
| `context:viewModel(): ViewModel` | Get bound view model |
| `context:rootViewModel(): ViewModel` | Get root artboard view model |
| `context:image(name): Image` | Load embedded image asset |
| `context:blob(name): string` | Load embedded blob (text) asset |
| `context:audio(name): Audio` | Load embedded audio asset |
| `context:markNeedsUpdate()` | Signal node needs re-render |
| `context:artboard(): Artboard` | Get parent artboard |

### ViewModel
| Method | Description |
|--------|-------------|
| `vm:getNumber(name): Input<number>` | Numeric input binding |
| `vm:getString(name): Input<string>` | String input binding |
| `vm:getBoolean(name): Input<boolean>` | Boolean input binding |
| `vm:getColor(name): Input<Color>` | Color input binding |
| `vm:getTrigger(name): Trigger` | Trigger (call `:fire()`) |
| `vm:getList(name): List` | List input binding |
| `vm:getEnum(name): Input<number>` | Enum binding (numeric index) |
| `input.value: T` | Read/write current value |
| `input:addListener(callback: (T) -> ())` | Listen for changes |
| `trigger:fire()` | Fire the trigger |
| `trigger:addListener(callback: () -> ())` | Listen for trigger events |

### Animation
| Method | Description |
|--------|-------------|
| `animation.duration: number` | Total duration in seconds |
| `animation:advance(dt)` | Advance by delta time |
| `animation:setTime(seconds)` | Jump to specific time |
| `animation:setTimeFrames(frame)` | Jump to specific frame |
| `animation:setTimePercentage(pct)` | Jump to percentage (0-1) |

### Artboard
| Method | Description |
|--------|-------------|
| `artboard.width / .height` | Dimensions in design pixels |
| `artboard:node(name): Node` | Find node by name |
| `artboard:bounds(): AABB` | Bounding box |
| `artboard:instance(): Artboard` | Create new instance |
| `artboard:pointerDown(x, y)` | Simulate pointer press |
| `artboard:pointerUp(x, y)` | Simulate pointer release |
| `artboard:pointerMove(x, y)` | Simulate pointer move |

### Input & late()
| Method | Description |
|--------|-------------|
| `Input<T>` | Reactive binding — has `.value` and `:addListener()` |
| `late(Input<T>): Input<T>` | Late-bound input, resolved lazily at access time |
| `late(value: T): T` | Wrap plain values for deferred init |

### Testing
| Method | Description |
|--------|-------------|
| `test:case(name, fn)` | Define a test case |
| `test:group(name, fn)` | Group related cases |
| `test:expect(value): Expectation` | Create expectation |
| `expect:toBe(expected)` | Strict equality |
| `expect:toBeNil()` | Assert nil |
| `expect:toBeTruthy()` | Assert truthy |
| `expect:toBeFalsy()` | Assert falsy |
| `expect:toBeGreaterThan(n)` | Assert > n |
| `expect:toBeLessThan(n)` | Assert < n |
| `expect:toBeCloseTo(n, delta)` | Assert within delta |
| `expect:toContain(substring)` | Assert string contains |
| `expect:toThrow()` | Assert function throws |

### Gradient (applied via Paint)
| Method | Description |
|--------|-------------|
| `paint:linearGradient(sx, sy, ex, ey, colors, stops)` | Linear gradient from (sx,sy) to (ex,ey) |
| `paint:radialGradient(cx, cy, radius, colors, stops)` | Radial gradient centered at (cx,cy) |
| `colors: { Color }` | Array of Color values |
| `stops: { number }` | Array of positions (0-1) per color |

---

## Key Patterns & Tips

1. **Factory pattern**: Every protocol script returns a function that constructs and returns a table of lifecycle methods.
2. **`late()` sentinel**: Use `late()` to defer initialization of inputs that aren't available at `init` time. The value resolves on first access.
3. **`context:markNeedsUpdate()`**: Call this when you change state that should trigger a re-render.
4. **`require` for modules**: Import util scripts with `require("path/to/module")`.
5. **Type annotations**: Always use Luau type annotations (`x: number`, `-> boolean`, etc.) for clarity and editor support.
6. **Pointer events**: Only available on Node and Layout protocols. Coordinates are in local node space.
7. **Paint immutability**: `paint:with()` returns a new Paint — it doesn't mutate. Use it for one-off style variations.
8. **Path contour iteration**: `path:contours()` yields contours, each with `:segments()` for the actual geometry.
9. **Renderer save/restore**: Always pair `save()` with `restore()` to avoid transform leaks.
10. **ViewModel reactivity**: Use `input:addListener()` to respond to data changes rather than polling `.value` every frame.

---

## Script File Organization

```
scripts/
  node/           -- Node scripts (per-node behavior, drawing, pointer events)
  layout/         -- Layout scripts (custom measure/resize)
  converter/      -- Converters (value transformation for bindings)
  path-effect/    -- Path effects (modify geometry before render)
  transition-condition/  -- State machine transition guards
  listener-action/       -- Event-driven actions
  util/           -- Shared modules (require-able)
  test/           -- Test scripts (Tester framework)
```

When creating a script, always place it in the correct protocol directory and use the `.luau` extension.
