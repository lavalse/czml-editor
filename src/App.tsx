import { Viewer, Entity, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";

function App() {
  return (
    <Viewer full>
      <Entity
        name="Tokyo"
        position={Cartesian3.fromDegrees(139.7670, 35.6814, 100)}
      >
        <PointGraphics pixelSize={10} color={Color.RED} />
      </Entity>
    </Viewer>
  );
}

export default App;
