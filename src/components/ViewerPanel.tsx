import { Viewer, CzmlDataSource } from "resium";
import { Ion, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useRef, useCallback } from "react";

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

interface Props {
  czml: Record<string, unknown>[];
  onCoordinateSelected?: (coords: { lon: number; lat: number; height: number }) => void;
  onEntityPicked?: (id: string) => void;
  onFinishCoordinateInput?: () => void;
}

const ViewerPanel = ({ czml, onCoordinateSelected, onEntityPicked, onFinishCoordinateInput }: Props) => {
  const viewerRef = useRef<CesiumViewer | null>(null);

  const handleReady = useCallback((viewer: CesiumViewer) => {
    viewerRef.current = viewer;

    if (!viewer || !onCoordinateSelected) return;

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    console.log("📡 Click handler attached");

    handler.setInputAction((event: { position: Cartesian2 }) => {
      const position = event.position;

      // ✅ 尝试拾取实体
      const picked = viewer.scene.pick(position);
      if (picked?.id && typeof picked.id.id === "string") {
        const entityId = picked.id.id;
        console.log("📍 Picked entity:", entityId);
        onEntityPicked?.(entityId); // 🔥 通知外部
        return;
      }

      // ✅ 若未点到实体，则尝试取地理坐标
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

     // ✅ 新增：右键完成输入
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
    </Viewer>
  );
};

export default ViewerPanel;
