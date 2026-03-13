// All 8 Rive Luau protocol scaffolds — correct factory pattern

const TEMPLATES = {
  node: `-- Node Script
-- Attached to a Node. Can draw, animate, and respond to pointer events.

-- Define the script's data and inputs.
type MyNode = {
    path: Path,
    paint: Paint,
}

-- Called once when the script initializes.
function init(self: MyNode, context: Context): boolean
    return true
end

-- Called every frame to advance the simulation.
-- 'seconds' is the elapsed time since the previous frame.
function advance(self: MyNode, seconds: number): boolean
    return false -- return true to keep advancing
end

-- Called when any input value changes.
function update(self: MyNode) end

-- Called every frame (after advance) to render the content.
function draw(self: MyNode, renderer: Renderer)
    renderer:drawPath(self.path, self.paint)
end

-- Return a factory function that Rive uses to build the Node instance.
return function(): Node<MyNode>
    return {
        path    = Path.new(),
        paint   = Paint.new(),
        init    = init,
        advance = advance,
        update  = update,
        draw    = draw,
    }
end
`,

  layout: `-- Layout Script
-- Like a node script but also participates in layout (measure + resize).

-- Define the script's data and inputs.
type MyLayout = {
    path: Path,
    paint: Paint,
}

-- Called once when the script initializes.
function init(self: MyLayout, context: Context): boolean
    return true
end

-- Return desired (width, height) based on content.
-- widthMode/heightMode: "exactly" | "atMost" | "undefined"
function measure(self: MyLayout, width: number, widthMode: LayoutMeasureMode,
                 height: number, heightMode: LayoutMeasureMode,
                 context: Context): (number, number)
    return width, height
end

-- Called after layout resolves with final dimensions.
function resize(self: MyLayout, width: number, height: number, context: Context)
    -- Position children here
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
`,

  converter: `-- Converter Script
-- Transforms values between ViewModel bindings and display values.

type MyConverter = {}

function init(self: MyConverter, context: Context): boolean
    return true
end

-- Transform the source value for display.
function convert(self: MyConverter, value: any, context: Context): any
    return value
end

-- Transform a display value back to source format (for two-way bindings).
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
`,

  "path-effect": `-- Path Effect Script
-- Modifies paths before they are rendered (dashes, distortions, etc).

type MyEffect = {}

function init(self: MyEffect, context: Context): boolean
    return true
end

function update(self: MyEffect) end

function advance(self: MyEffect, seconds: number): boolean
    return false
end

-- Transform the input path and return the modified path.
function effect(self: MyEffect, path: Path, context: Context): Path
    local result = Path.new()
    for _, contour in path:contours() do
        for _, segment in contour:segments() do
            -- Process each segment
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
`,

  "transition-condition": `-- Transition Condition Script
-- Evaluates whether a state machine transition should fire.

type MyCondition = {}

function init(self: MyCondition, context: Context): boolean
    return true
end

-- Return true to allow the transition, false to block it.
-- Called each frame while the source state is active.
function evaluate(self: MyCondition, context: Context): boolean
    return false
end

return function(): TransitionCondition<MyCondition>
    return {
        init     = init,
        evaluate = evaluate,
    }
end
`,

  "listener-action": `-- Listener Action Script
-- Runs custom logic when a Rive listener event fires.

type MyAction = {}

function init(self: MyAction, context: Context): boolean
    return true
end

-- Called each time the listener event fires.
function perform(self: MyAction, context: Context)
    -- Use context:viewModel() to read/write state
end

return function(): ListenerAction<MyAction>
    return {
        init    = init,
        perform = perform,
    }
end
`,

  util: `-- Util Module
-- Shared utility functions importable by other scripts via require.

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
