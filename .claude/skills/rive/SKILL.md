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

## Mental Model

Think of a Rive script in three layers:

```
┌─────────────────────────────────────────┐
│  1. STATE   (your data / fields)        │  ← Defined in a Luau type
├─────────────────────────────────────────┤
│  2. LIFECYCLE (init → advance → draw)   │  ← Standalone functions you implement
├─────────────────────────────────────────┤
│  3. FACTORY  (return function)          │  ← Rive calls this to create
│                                         │    a new instance per node
└─────────────────────────────────────────┘
```

Key rules:
- `self` is your state table — store everything you need on it.
- `init` runs ONCE — set up resources, listeners, initial values. Return `true` on success.
- `advance` runs EVERY FRAME — update simulation. Return `false` when static.
- `draw` runs EVERY FRAME (after advance) — render using the Renderer.
- `update` runs when an `Input<T>` value changes — react to designer inputs.
- Do NOT mutate a Path and draw it in the same frame.
- Scripts run in LOCAL transform space of the node — (0,0) is the node's origin.

---

## Inputs vs ViewModel Data

**A. Inputs (`Input<T>`)** — Designer-configurable values set in the Rive editor.
- Defined as fields typed `Input<T>` on your state type.
- Given default values in the factory return table.
- When they change, `update(self)` is called.
- Accessed directly on self (e.g. `self.speed`).
- Best for: design-time configuration (size, color, speed, etc.)

**B. ViewModel (`context:viewModel()`)** — Live runtime data bound to the artboard.
- Retrieved inside `init` via the Context object.
- Use `addListener` to react to changes, call `context:markNeedsUpdate()` to schedule a re-draw.
- Best for: dynamic app data (score, username, health, etc.)

```luau
local vm = context:viewModel()
if vm then
  local health = vm:getNumber("health")
  if health then
    health:addListener(function()
      context:markNeedsUpdate()
    end)
  end
end
```

---

## Protocol Templates

Every Rive script defines standalone functions and returns a factory function. The factory returns a table with default field values and lifecycle function references.

### Node
Attached to a Node in the artboard. Can draw, animate, and respond to pointer events.

```luau
type MyNode = {
    -- Designer-configurable input
    size: Input<number>,

    -- Internal state
    path: Path,
    paint: Paint,
}

function init(self: MyNode, context: Context): boolean
    self.path:moveTo(Vector.xy(-self.size / 2, -self.size / 2))
    self.path:lineTo(Vector.xy( self.size / 2, -self.size / 2))
    self.path:lineTo(Vector.xy( self.size / 2,  self.size / 2))
    self.path:lineTo(Vector.xy(-self.size / 2,  self.size / 2))
    self.path:close()
    return true
end

function advance(self: MyNode, seconds: number): boolean
    return false -- static content
end

function update(self: MyNode)
    -- Rebuild when designer changes an input
    self.path:reset()
    self.path:moveTo(Vector.xy(-self.size / 2, -self.size / 2))
    self.path:lineTo(Vector.xy( self.size / 2, -self.size / 2))
    self.path:lineTo(Vector.xy( self.size / 2,  self.size / 2))
    self.path:lineTo(Vector.xy(-self.size / 2,  self.size / 2))
    self.path:close()
end

function draw(self: MyNode, renderer: Renderer)
    renderer:drawPath(self.path, self.paint)
end

return function(): Node<MyNode>
    return {
        size  = 100,
        path  = Path.new(),
        paint = Paint.with({
            style = "fill",
            color = Color.rgb(80, 160, 255),
        }),
        init    = init,
        update  = update,
        advance = advance,
        draw    = draw,
    }
end
```

### Layout
Like a node script but also participates in layout (measure + resize).

```luau
type MyLayout = {
    path: Path,
    paint: Paint,
}

function init(self: MyLayout, context: Context): boolean
    return true
end

function measure(self: MyLayout, width: number, widthMode: LayoutMeasureMode,
                 height: number, heightMode: LayoutMeasureMode,
                 context: Context): (number, number)
    return width, height
end

function resize(self: MyLayout, width: number, height: number, context: Context)
    -- Position children after layout resolves
end

function advance(self: MyLayout, seconds: number): boolean
    return false
end

function update(self: MyLayout) end

function draw(self: MyLayout, renderer: Renderer)
    renderer:drawPath(self.path, self.paint)
end

return function(): Layout<MyLayout>
    return {
        path    = Path.new(),
        paint   = Paint.new(),
        init    = init,
        measure = measure,
        resize  = resize,
        advance = advance,
        update  = update,
        draw    = draw,
    }
end
```

### Converter
Transforms values between ViewModel bindings and display values.

```luau
type MyConverter = {}

function init(self: MyConverter, context: Context): boolean
    return true
end

function convert(self: MyConverter, value: any, context: Context): any
    return value
end

function reverseConvert(self: MyConverter, value: any, context: Context): any
    return value
end

return function(): Converter<MyConverter>
    return {
        init           = init,
        convert        = convert,
        reverseConvert = reverseConvert,
    }
end
```

### Path Effect
Modifies paths before rendering (dashes, distortions, etc).

```luau
type MyEffect = {}

function init(self: MyEffect, context: Context): boolean
    return true
end

function update(self: MyEffect) end

function advance(self: MyEffect, seconds: number): boolean
    return false
end

function effect(self: MyEffect, path: Path, context: Context): Path
    local result = Path.new()
    for _, contour in path:contours() do
        for _, segment in contour:segments() do
            -- Process segments
        end
    end
    return result
end

return function(): PathEffect<MyEffect>
    return {
        init    = init,
        update  = update,
        advance = advance,
        effect  = effect,
    }
end
```

### Transition Condition
Evaluates whether a state machine transition should fire.

```luau
type MyCondition = {}

function init(self: MyCondition, context: Context): boolean
    return true
end

function evaluate(self: MyCondition, context: Context): boolean
    return false
end

return function(): TransitionCondition<MyCondition>
    return {
        init     = init,
        evaluate = evaluate,
    }
end
```

### Listener Action
Runs custom logic when a Rive listener event fires.

```luau
type MyAction = {}

function init(self: MyAction, context: Context): boolean
    return true
end

function perform(self: MyAction, context: Context)
    -- Runs each time the listener event fires
end

return function(): ListenerAction<MyAction>
    return {
        init    = init,
        perform = perform,
    }
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

## Lifecycle Reference

| Function | Signature | When called |
|----------|-----------|-------------|
| `init` | `(self, context: Context) → boolean` | Once on creation. Return `true` = success. |
| `advance` | `(self, seconds: number) → boolean` | Every frame. `seconds` = delta time. Return `false` to stop. |
| `update` | `(self)` | When any `Input<T>` value changes. No context parameter. |
| `draw` | `(self, renderer: Renderer)` | Every frame after advance. No context parameter. |
| `measure` | `(self, w, wMode, h, hMode, context) → (number, number)` | Layout only. |
| `resize` | `(self, w, h, context)` | Layout only. After layout resolves. |

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
| `path:moveTo(vec: Vector)` | Start new contour at vector position |
| `path:lineTo(vec: Vector)` | Add line segment to vector position |
| `path:cubicTo(out: Vector, in: Vector, to: Vector)` | Add cubic Bezier curve |
| `path:close()` | Close current contour |
| `path:reset()` | Clear all contours (do NOT reset and draw same frame) |
| `path:contours(): iterator` | Iterate contours (each has `:segments()`) |
| `path:measure(): PathMeasure` | Get PathMeasure for positions/tangents |
| `pathMeasure:length(): number` | Total path length |
| `pathMeasure:position(distance): Vector` | Position at distance |
| `pathMeasure:tangent(distance): Vector` | Tangent at distance |

### Paint
| Method | Description |
|--------|-------------|
| `Paint.new(): Paint` | Create paint with defaults |
| `Paint.with({ ... }): Paint` | Create paint with initial props (style, color, thickness, join, cap, blendMode) |
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
| `Color.rgb(r, g, b): Color` | From RGB (0–255 range) |
| `Color.rgba(r, g, b, a): Color` | From RGBA (0–255 range, alpha 0–255) |
| `Color.lerp(a, b, t): Color` | Interpolate between colors |
| `color.r / .g / .b / .a` | Read/write channels |
| `color.opacity` | Shorthand for alpha |

### Vector
| Method | Description |
|--------|-------------|
| `Vector.xy(x, y): Vector` | Create 2D vector |
| `Vector.origin(): Vector` | Shorthand for (0, 0) |
| `Vector.lerp(a, b, t): Vector` | Interpolate between vectors |
| `vec.x / .y` | Read/write components |
| `vec:normalized(): Vector` | Unit-length copy |
| `vec:length(): number` | Magnitude |
| `Vector.distance(a, b): number` | Distance between points |
| `Vector.dot(a, b): number` | Dot product |
| `Vector.cross(a, b): number` | Cross product (scalar in 2D) |
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

### Artboard
| Method | Description |
|--------|-------------|
| `artboard.width / .height` | Dimensions in design pixels |
| `artboard:node(name): Node` | Find node by name |
| `artboard:bounds(): AABB` | Bounding box |
| `artboard:instance(): Artboard` | Create new instance |

### Animation
| Method | Description |
|--------|-------------|
| `animation.duration: number` | Total duration in seconds |
| `animation:advance(dt)` | Advance by delta time |
| `animation:setTime(seconds)` | Jump to specific time |
| `animation:setTimeFrames(frame)` | Jump to specific frame |
| `animation:setTimePercentage(pct)` | Jump to percentage (0-1) |

### Pointer Events
| Method | Description |
|--------|-------------|
| `pointerDown(self, event: PointerEvent)` | Pointer pressed |
| `pointerMove(self, event: PointerEvent)` | Pointer moved |
| `pointerUp(self, event: PointerEvent)` | Pointer released |
| `pointerExit(self, event: PointerEvent)` | Pointer left the node |
| `event.position: Vector` | Position in local coordinates |
| `event.id: number` | Pointer identifier |
| `event:hit()` | Consume the event (stop propagation) |
| `event:hit(true)` | Mark hit but stay translucent (continue propagating) |

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

---

## Common Pitfalls

- **DO NOT** use `Vec2D` — the correct global is `Vector` (e.g. `Vector.xy(10, 20)`)
- **DO NOT** use `Color.hex()` — it does not exist. Use `Color.rgb(r, g, b)` with 0–255 values.
- **DO NOT** pass separate `(x, y)` numbers to `moveTo`/`lineTo` — pass a `Vector`.
- **DO NOT** mutate a Path and draw it in the same frame — mutate in `advance`/`update`, draw in `draw`.
- **DO NOT** use `artboard:node()` in the factory — the factory returns a plain table.
- **DO NOT** add `context` parameter to `update` or `draw` — they don't receive it.
- **DO NOT** use `rive.` namespace prefix — `Vector`, `Path`, `Paint`, `Color` are direct globals.
- **DO NOT** use Roblox libraries — Rive Luau is pure Luau.
- **DO** call `context:markNeedsUpdate()` from a ViewModel listener to trigger a redraw.
- **DO** use `Input<T>` for designer-editable values, ViewModel for runtime data.
- **DO** return `false` from `advance` when content is static to save CPU.
- **DO** use `renderer:save()` / `renderer:restore()` around any transform or clip.
- **DO** initialize fields (path, paint) with defaults in the factory return table.

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
