-- Define the script's data and inputs.
type MyNode = {
  color: Input<Color>,
  path: Path,
  paint: Paint,
}

-- Called once when the script initializes.
function init(self: MyNode, context: Context): boolean
  self.path:moveTo(Vector.xy(0, 0))
  self.path:lineTo(Vector.xy(200, 0))
  self.path:lineTo(Vector.xy(200, 120))
  self.path:lineTo(Vector.xy(0, 120))
  self.path:close()

  self.paint.style = 'fill'
  self.paint.color = self.color

  return true
end

-- Called every frame to advance the simulation.
function advance(self: MyNode, seconds: number): boolean
  return false
end

-- Called when any input value changes.
function update(self: MyNode)
  self.paint.color = self.color
end

-- Called every frame (after advance) to render the content.
function draw(self: MyNode, renderer: Renderer)
  renderer:drawPath(self.path, self.paint)
end

-- Return a factory function that Rive uses to build the Node instance.
return function(): Node<MyNode>
  return {
    color = Color.rgb(255, 255, 255),
    path = Path.new(),
    paint = Paint.new(),
    init = init,
    advance = advance,
    update = update,
    draw = draw,
  }
end
