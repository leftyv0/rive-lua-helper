// API Reference Panel — collapsible accordion sections

const API_REFERENCE = [
  {
    title: 'Renderer',
    entries: [
      { sig: 'renderer:save()', desc: 'Push current transform/clip state onto the stack.' },
      { sig: 'renderer:restore()', desc: 'Pop the last saved state from the stack.' },
      { sig: 'renderer:transform(matrix: Mat2D)', desc: 'Apply a 2D affine transform to the current state.' },
      { sig: 'renderer:translate(x: number, y: number)', desc: 'Translate the current transform.' },
      { sig: 'renderer:rotate(radians: number)', desc: 'Rotate the current transform.' },
      { sig: 'renderer:scale(sx: number, sy: number)', desc: 'Scale the current transform.' },
      { sig: 'renderer:drawPath(path: Path, paint: Paint)', desc: 'Draw a path with the given paint.' },
      { sig: 'renderer:drawImage(image: Image, paint: Paint?)', desc: 'Draw an image, optionally with paint (for blend modes, opacity).' },
      { sig: 'renderer:clipPath(path: Path)', desc: 'Clip all subsequent drawing to the given path.' },
      { sig: 'renderer:align(fit: Fit, alignment: Alignment, frame: AABB, content: AABB)', desc: 'Compute and apply a transform that fits content into a frame.' }
    ]
  },
  {
    title: 'Path',
    entries: [
      { sig: 'Path.new(): Path', desc: 'Create a new empty path.' },
      { sig: 'path:moveTo(x: number, y: number)', desc: 'Start a new contour at (x, y).' },
      { sig: 'path:lineTo(x: number, y: number)', desc: 'Add a line segment to (x, y).' },
      { sig: 'path:cubicTo(ox: number, oy: number, ix: number, iy: number, x: number, y: number)', desc: 'Add a cubic Bézier curve.' },
      { sig: 'path:close()', desc: 'Close the current contour.' },
      { sig: 'path:addRect(x: number, y: number, w: number, h: number)', desc: 'Add a rectangle sub-path.' },
      { sig: 'path:addOval(x: number, y: number, w: number, h: number)', desc: 'Add an oval sub-path inscribed in the given rect.' },
      { sig: 'path:addRoundRect(x: number, y: number, w: number, h: number, rx: number, ry: number)', desc: 'Add a rounded rectangle sub-path.' },
      { sig: 'path:contours(): iterator', desc: 'Iterate over all contours in the path. Each contour has :segments().' },
      { sig: 'path:measure(): PathMeasure', desc: 'Get a PathMeasure for calculating positions and tangents along the path.' },
      { sig: 'pathMeasure:length(): number', desc: 'Total length of the measured path.' },
      { sig: 'pathMeasure:position(distance: number): Vec2D', desc: 'Get position at the given distance along the path.' },
      { sig: 'pathMeasure:tangent(distance: number): Vec2D', desc: 'Get tangent at the given distance along the path.' },
      { sig: 'path:reset()', desc: 'Clear all contours from the path.' }
    ]
  },
  {
    title: 'Paint',
    entries: [
      { sig: 'Paint.new(): Paint', desc: 'Create a new paint with default settings.' },
      { sig: 'paint:with({ ... }): Paint', desc: 'Create a copy with modified properties: style, color, thickness, join, cap, blendMode.' },
      { sig: 'paint:copy(): Paint', desc: 'Create an exact copy of this paint.' },
      { sig: 'paint.style: PaintStyle', desc: '"fill" | "stroke" — how shapes are drawn.' },
      { sig: 'paint.color: Color', desc: 'The paint color.' },
      { sig: 'paint.thickness: number', desc: 'Stroke width (only applies when style is "stroke").' },
      { sig: 'paint.join: StrokeJoin', desc: '"miter" | "round" | "bevel" — how stroke corners are drawn.' },
      { sig: 'paint.cap: StrokeCap', desc: '"butt" | "round" | "square" — how stroke endpoints are drawn.' },
      { sig: 'paint.blendMode: BlendMode', desc: '"srcOver" | "screen" | "multiply" | ... — compositing mode.' },
      { sig: 'paint:linearGradient(sx, sy, ex, ey, colors, stops)', desc: 'Apply a linear gradient shader.' },
      { sig: 'paint:radialGradient(cx, cy, radius, colors, stops)', desc: 'Apply a radial gradient shader.' }
    ]
  },
  {
    title: 'Color',
    entries: [
      { sig: 'Color.rgb(r: number, g: number, b: number): Color', desc: 'Create a color from RGB (0–1 range).' },
      { sig: 'Color.rgba(r: number, g: number, b: number, a: number): Color', desc: 'Create a color from RGBA (0–1 range).' },
      { sig: 'Color.hex(hex: string): Color', desc: 'Create a color from a hex string like "#FF00AA" or "#FF00AA80".' },
      { sig: 'Color.lerp(a: Color, b: Color, t: number): Color', desc: 'Linearly interpolate between two colors.' },
      { sig: 'color.r / .g / .b / .a: number', desc: 'Read or write individual channels (0–1).' },
      { sig: 'color.opacity: number', desc: 'Shorthand for the alpha channel.' }
    ]
  },
  {
    title: 'Vec2D',
    entries: [
      { sig: 'Vec2D.xy(x: number, y: number): Vec2D', desc: 'Create a 2D vector.' },
      { sig: 'Vec2D.origin(): Vec2D', desc: 'Shorthand for Vec2D.xy(0, 0).' },
      { sig: 'Vec2D.lerp(a: Vec2D, b: Vec2D, t: number): Vec2D', desc: 'Linearly interpolate between two vectors.' },
      { sig: 'vec.x / .y: number', desc: 'Read or write components.' },
      { sig: 'vec:normalized(): Vec2D', desc: 'Return a unit-length copy.' },
      { sig: 'vec:length(): number', desc: 'Return the magnitude.' },
      { sig: 'Vec2D.distance(a: Vec2D, b: Vec2D): number', desc: 'Distance between two points.' },
      { sig: 'Vec2D.dot(a: Vec2D, b: Vec2D): number', desc: 'Dot product.' },
      { sig: 'Vec2D.cross(a: Vec2D, b: Vec2D): number', desc: 'Cross product (scalar in 2D).' },
      { sig: 'a + b, a - b, a * scalar, -a', desc: 'Arithmetic operators are overloaded.' }
    ]
  },
  {
    title: 'Gradient',
    entries: [
      { sig: 'paint:linearGradient(sx, sy, ex, ey, colors, stops)', desc: 'Set a linear gradient from (sx,sy) to (ex,ey).' },
      { sig: 'paint:radialGradient(cx, cy, radius, colors, stops)', desc: 'Set a radial gradient centered at (cx,cy).' },
      { sig: 'colors: { Color }', desc: 'Array of Color values for gradient stops.' },
      { sig: 'stops: { number }', desc: 'Array of positions (0–1) corresponding to each color.' }
    ]
  },
  {
    title: 'Context',
    entries: [
      { sig: 'context:viewModel(): ViewModel', desc: 'Get the view model bound to this component.' },
      { sig: 'context:rootViewModel(): ViewModel', desc: 'Get the root artboard view model.' },
      { sig: 'context:image(name: string): Image', desc: 'Load an embedded image asset by name.' },
      { sig: 'context:blob(name: string): string', desc: 'Load an embedded blob (text) asset by name.' },
      { sig: 'context:audio(name: string): Audio', desc: 'Load an embedded audio asset by name.' },
      { sig: 'context:markNeedsUpdate()', desc: 'Signal that this node needs to be re-rendered.' },
      { sig: 'context:artboard(): Artboard', desc: 'Get the artboard this component belongs to.' }
    ]
  },
  {
    title: 'ViewModel',
    entries: [
      { sig: 'vm:getNumber(name: string): Input<number>', desc: 'Get a numeric input binding.' },
      { sig: 'vm:getString(name: string): Input<string>', desc: 'Get a string input binding.' },
      { sig: 'vm:getBoolean(name: string): Input<boolean>', desc: 'Get a boolean input binding.' },
      { sig: 'vm:getColor(name: string): Input<Color>', desc: 'Get a color input binding.' },
      { sig: 'vm:getTrigger(name: string): Trigger', desc: 'Get a trigger — call :fire() to activate.' },
      { sig: 'vm:getList(name: string): List', desc: 'Get a list input binding.' },
      { sig: 'vm:getEnum(name: string): Input<number>', desc: 'Get an enum input binding (numeric index).' },
      { sig: 'input.value: T', desc: 'Read or write the current input value.' },
      { sig: 'input:addListener(callback: (T) -> ())', desc: 'Listen for value changes.' },
      { sig: 'trigger:fire()', desc: 'Fire the trigger.' },
      { sig: 'trigger:addListener(callback: () -> ())', desc: 'Listen for trigger events.' }
    ]
  },
  {
    title: 'Animation',
    entries: [
      { sig: 'animation.duration: number', desc: 'Total duration in seconds.' },
      { sig: 'animation:advance(dt: number)', desc: 'Advance the animation by delta time.' },
      { sig: 'animation:setTime(seconds: number)', desc: 'Jump to a specific time.' },
      { sig: 'animation:setTimeFrames(frame: number)', desc: 'Jump to a specific frame number.' },
      { sig: 'animation:setTimePercentage(pct: number)', desc: 'Jump to a percentage (0–1) of the duration.' }
    ]
  },
  {
    title: 'Artboard',
    entries: [
      { sig: 'artboard.width: number', desc: 'Artboard width in design pixels.' },
      { sig: 'artboard.height: number', desc: 'Artboard height in design pixels.' },
      { sig: 'artboard:node(name: string): Node', desc: 'Find a node by name.' },
      { sig: 'artboard:bounds(): AABB', desc: 'Get the artboard bounding box.' },
      { sig: 'artboard:instance(): Artboard', desc: 'Create a new instance of this artboard.' },
      { sig: 'artboard:pointerDown(x: number, y: number)', desc: 'Simulate a pointer press.' },
      { sig: 'artboard:pointerUp(x: number, y: number)', desc: 'Simulate a pointer release.' },
      { sig: 'artboard:pointerMove(x: number, y: number)', desc: 'Simulate a pointer move.' }
    ]
  },
  {
    title: 'Input & late()',
    entries: [
      { sig: 'Input<T>', desc: 'A reactive binding to a view model property. Has .value and :addListener().' },
      { sig: 'late(Input<T>): Input<T>', desc: 'Marks an input as late-bound — its value is resolved lazily at access time.' },
      { sig: 'late(value: T): T', desc: 'Can also wrap plain values for deferred initialization.' }
    ]
  },
  {
    title: 'Testing',
    entries: [
      { sig: 'test:case(name: string, fn: () -> ())', desc: 'Define a test case.' },
      { sig: 'test:group(name: string, fn: () -> ())', desc: 'Group related test cases together.' },
      { sig: 'test:expect(value: any): Expectation', desc: 'Create an expectation for assertions.' },
      { sig: 'expect:toBe(expected: any)', desc: 'Strict equality check.' },
      { sig: 'expect:toBeNil()', desc: 'Assert value is nil.' },
      { sig: 'expect:toBeTruthy()', desc: 'Assert value is truthy.' },
      { sig: 'expect:toBeFalsy()', desc: 'Assert value is falsy.' },
      { sig: 'expect:toBeGreaterThan(n: number)', desc: 'Assert value > n.' },
      { sig: 'expect:toBeLessThan(n: number)', desc: 'Assert value < n.' },
      { sig: 'expect:toBeCloseTo(n: number, delta: number)', desc: 'Assert value is within delta of n.' },
      { sig: 'expect:toContain(substring: string)', desc: 'Assert string contains substring.' },
      { sig: 'expect:toThrow()', desc: 'Assert function throws an error.' }
    ]
  }
];

function initApiPanel() {
  const panel = document.getElementById('api-panel');
  const content = document.getElementById('api-content');
  const toggle = document.getElementById('api-toggle');
  const search = document.getElementById('api-search');

  // Build accordion
  function render(filter = '') {
    const lowerFilter = filter.toLowerCase();
    content.innerHTML = '';

    for (const section of API_REFERENCE) {
      const entries = filter
        ? section.entries.filter(e =>
            e.sig.toLowerCase().includes(lowerFilter) ||
            e.desc.toLowerCase().includes(lowerFilter))
        : section.entries;

      if (entries.length === 0) continue;

      const sectionEl = document.createElement('div');
      sectionEl.className = 'api-section';

      const header = document.createElement('div');
      header.className = 'api-section-header';
      header.innerHTML = `<span class="api-chevron">&#9656;</span> ${section.title} <span class="api-count">${entries.length}</span>`;
      header.addEventListener('click', () => {
        sectionEl.classList.toggle('expanded');
      });

      const body = document.createElement('div');
      body.className = 'api-section-body';

      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'api-entry';
        row.innerHTML = `<code class="api-sig">${escapeHtml(entry.sig)}</code><div class="api-desc">${escapeHtml(entry.desc)}</div>`;
        body.appendChild(row);
      }

      sectionEl.appendChild(header);
      sectionEl.appendChild(body);
      content.appendChild(sectionEl);

      // Auto-expand when filtering
      if (filter) sectionEl.classList.add('expanded');
    }
  }

  render();

  // Toggle panel visibility
  toggle.addEventListener('click', () => {
    panel.classList.toggle('collapsed');
    document.getElementById('app-layout').classList.toggle('api-collapsed');
    toggle.textContent = panel.classList.contains('collapsed') ? 'API >' : 'API <';
  });

  // Search
  search.addEventListener('input', (e) => {
    render(e.target.value);
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
