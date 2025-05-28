import { Viewer, CzmlDataSource, Viewer as ResiumViewer } from "resium";
import { Ion, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useEffect, useRef, useCallback } from "react";

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

interface Props {
  czml: Record<string, unknown>[];
  onCoordinateSelected?: (coords: { lon: number; lat: number; height: number }) => void;
}

const ViewerPanel = ({ czml, onCoordinateSelected }: Props) => {
  const viewerRef = useRef<CesiumViewer | null>(null);

  const handleReady = useCallback((viewer: CesiumViewer) => {
    viewerRef.current = viewer;

    if (!viewer || !onCoordinateSelected) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    console.log("📡 Click handler attached");

    handler.setInputAction((event: { position: Cartesian2 }) => {
      const position = event.position;
      const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cartographic.fromCartesian(cartesian);
        const lon = CesiumMath.toDegrees(cartographic.longitude);
        const lat = CesiumMath.toDegrees(cartographic.latitude);
        const height = cartographic.height ?? 0;

        console.log("👆 Map clicked at:", { lon, lat, height });
        onCoordinateSelected({ lon, lat, height });
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [onCoordinateSelected]);

  return (
    <Viewer
      style={{ width: "100%", height: "100%" }}
      ref={(e) => {
        if (e?.cesiumElement) handleReady(e.cesiumElement);
      }}
    >
      <CzmlDataSource data={czml} key={JSON.stringify(czml)} />
    </Viewer>
  );
};

export default ViewerPanel;
