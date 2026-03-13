// All 8 Rive Luau protocol scaffolds

const TEMPLATES = {
  node: `-- Node Script
-- Runs on a node each frame. Has access to self (the node), context, and renderer.

return function(artboard: Artboard): Node
    local node = artboard:node("NodeName")

    function node:init(context: Context)
        -- Called once when the script is first attached
        -- Use context:viewModel() to access data bindings
    end

    function node:advance(dt: number, context: Context)
        -- Called every frame with delta time
        -- Good for animation logic, state machines
    end

    function node:update(context: Context)
        -- Called when the node's transform needs updating
        -- Modify position, rotation, scale here
    end

    function node:draw(renderer: Renderer, context: Context)
        -- Called when rendering the node
        -- Use renderer:drawPath(), renderer:drawImage(), etc.
    end

    function node:pointerDown(x: number, y: number, context: Context)
        -- Called when a pointer press occurs on this node
    end

    function node:pointerUp(x: number, y: number, context: Context)
        -- Called when a pointer release occurs on this node
    end

    function node:pointerMove(x: number, y: number, context: Context)
        -- Called when a pointer moves over this node
    end

    return node
end
`,

  layout: `-- Layout Script
-- Extends Node with measure and resize for custom layout behavior.

return function(artboard: Artboard): Layout
    local layout = artboard:node("LayoutName")

    function layout:init(context: Context)
        -- Called once when the script is first attached
    end

    function layout:measure(width: number, widthMode: LayoutMeasureMode,
                            height: number, heightMode: LayoutMeasureMode,
                            context: Context): (number, number)
        -- Return desired (width, height) based on content
        -- widthMode/heightMode: "exactly" | "atMost" | "undefined"
        return width, height
    end

    function layout:resize(width: number, height: number, context: Context)
        -- Called after layout is resolved with final dimensions
        -- Position children here
    end

    function layout:advance(dt: number, context: Context)
        -- Called every frame with delta time
    end

    function layout:update(context: Context)
        -- Called when transform needs updating
    end

    function layout:draw(renderer: Renderer, context: Context)
        -- Called when rendering
    end

    return layout
end
`,

  converter: `-- Converter Script
-- Transforms values between view model properties and display values.

return function(): Converter
    local converter = {}

    function converter:init(context: Context)
        -- Called once when the converter is first attached
        -- Access context:viewModel() for data bindings
    end

    function converter:convert(value: any, context: Context): any
        -- Transform the source value for display
        -- Example: format a number as currency, convert units, etc.
        return value
    end

    function converter:reverseConvert(value: any, context: Context): any
        -- Transform a display value back to source format
        -- Used for two-way bindings
        return value
    end

    return converter
end
`,

  "path-effect": `-- Path Effect Script
-- Modifies paths before they are rendered (dashes, distortions, etc).

return function(artboard: Artboard): PathEffect
    local effect = {}

    function effect:init(context: Context)
        -- Called once when the effect is first attached
    end

    function effect:update(context: Context)
        -- Called when the effect parameters change
        -- Recalculate effect state here
    end

    function effect:advance(dt: number, context: Context)
        -- Called every frame with delta time
        -- Animate effect parameters here
    end

    function effect:effect(path: Path, context: Context): Path
        -- Transform the input path and return the modified path
        -- Use path:contours() to iterate segments
        local result = Path.new()
        for _, contour in path:contours() do
            for _, segment in contour:segments() do
                -- Process each segment
            end
        end
        return result
    end

    return effect
end
`,

  "transition-condition": `-- Transition Condition Script
-- Evaluates whether a state machine transition should fire.

return function(): TransitionCondition
    local condition = {}

    function condition:init(context: Context)
        -- Called once when the condition is first attached
        -- Set up any state needed for evaluation
    end

    function condition:evaluate(context: Context): boolean
        -- Return true to allow the transition, false to block it
        -- Called each frame while the source state is active
        return false
    end

    return condition
end
`,

  "listener-action": `-- Listener Action Script
-- Runs custom logic when a Rive listener event fires.

return function(): ListenerAction
    local action = {}

    function action:init(context: Context)
        -- Called once when the action is first attached
    end

    function action:perform(context: Context)
        -- Called each time the listener event fires
        -- Use context:viewModel() to read/write state
    end

    return action
end
`,

  util: `-- Util Module
-- Shared utility functions importable by other scripts.
-- Rive Luau uses \`require\` to import modules.

local M = {}

function M.clamp(value: number, min: number, max: number): number
    return math.max(min, math.min(max, value))
end

function M.lerp(a: number, b: number, t: number): number
    return a + (b - a) * t
end

function M.map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number
    return outMin + (value - inMin) / (inMax - inMin) * (outMax - outMin)
end

return M
`,

  test: `-- Test Script
-- Uses Rive's built-in test framework.

return function(test: Tester)
    test:group("Feature Name", function()
        test:case("should do something", function()
            local result = 1 + 1
            test:expect(result):toBe(2)
        end)

        test:case("should handle edge case", function()
            test:expect(true):toBeTruthy()
            test:expect(nil):toBeNil()
        end)

        test:case("should compare values", function()
            test:expect(10):toBeGreaterThan(5)
            test:expect(3.14):toBeCloseTo(math.pi, 0.01)
        end)
    end)
end
`
};

const PROTOCOL_LABELS = {
  'node': 'Node',
  'layout': 'Layout',
  'converter': 'Converter',
  'path-effect': 'Path Effect',
  'transition-condition': 'Transition Condition',
  'listener-action': 'Listener Action',
  'util': 'Util',
  'test': 'Test'
};
