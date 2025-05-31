import { Viewer, CzmlDataSource } from "resium";
import { Ion, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useRef, useCallback } from "react";
import { Entity, PolylineGraphics, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";


const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

interface Props {
  czml: Record<string, unknown>[];
  onCoordinateSelected?: (coords: { lon: number; lat: number; height: number }) => void;
  onEntityPicked?: (id: string) => void;
  onFinishCoordinateInput?: () => void;
  interactiveCoords?: { lon: number; lat: number }[];
}

const ViewerPanel = ({ czml, onCoordinateSelected, onEntityPicked, onFinishCoordinateInput,interactiveCoords }: Props) => {
  const viewerRef = useRef<CesiumViewer | null>(null);

  const handleReady = useCallback((viewer: CesiumViewer) => {
    viewerRef.current = viewer;

    if (!viewer || !onCoordinateSelected) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    console.log("📡 Click handler attached");

    handler.setInputAction((event: { position: Cartesian2 }) => {
      const position = event.position;

      const picked = viewer.scene.pick(position);
      if (picked?.id && typeof picked.id.id === "string") {
        const entityId = picked.id.id;
        console.log("📍 Picked entity:", entityId);
        onEntityPicked?.(entityId);
        return;
      }

      if (onCoordinateSelected) {
        const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const height = cartographic.height ?? 0;

          console.log("👆 Map clicked at:", { lon, lat, height });
          onCoordinateSelected({ lon, lat, height });
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(() => {
      console.log("✅ Right-click: finish coordinate input");
      onFinishCoordinateInput?.();
    }, ScreenSpaceEventType.RIGHT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [onCoordinateSelected, onEntityPicked, onFinishCoordinateInput]);

  return (
    <Viewer
  style={{ width: "100%", height: "100%" }}
  ref={(e) => {
    if (e?.cesiumElement) handleReady(e.cesiumElement);
  }}
>
  <CzmlDataSource data={czml} key={JSON.stringify(czml)} />

  {/* ✅ 临时交互点和线 */}
  {interactiveCoords && interactiveCoords.length > 0 && (
    <>
      {/* 每个点显示为黄色小点 */}
      {interactiveCoords.map((coord, i) => (
        <Entity
          key={`temp-point-${i}`}
          position={Cartesian3.fromDegrees(coord.lon, coord.lat, 0)}
        >
          <PointGraphics pixelSize={8} color={Color.YELLOW} />
        </Entity>
      ))}

      {/* 两个以上点才显示临时 polyline */}
      {interactiveCoords.length >= 2 && (
        <Entity>
          <PolylineGraphics
            positions={interactiveCoords.map(p =>
              Cartesian3.fromDegrees(p.lon, p.lat, 0)
            )}
            width={2}
            material={Color.YELLOW}
            clampToGround={true}
          />
        </Entity>
      )}
    </>
  )}
</Viewer>

  );
};

export default ViewerPanel;
