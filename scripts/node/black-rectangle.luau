-- Define the script's data and inputs.
type MyNode = {
  paint: Paint,
  path: Path,
}

-- Called once when the script initializes.
function init(self: MyNode, context: Context): boolean
  self.paint = Paint.new()
  self.paint.style = "fill"
  self.paint.color = Color.rgb(0, 0, 0)

  self.path = Path.new()
  self.path:moveTo(Vector.xy(0, 0))
  self.path:lineTo(Vector.xy(200, 0))
  self.path:lineTo(Vector.xy(200, 120))
  self.path:lineTo(Vector.xy(0, 120))
  self.path:close()

  return true
end

-- Called every frame to advance the simulation.
-- 'seconds' is the elapsed time since the previous frame.
function advance(self: MyNode, seconds: number): boolean
  return false
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
    init = init,
    advance = advance,
    update = update,
    draw = draw,
  }
end
