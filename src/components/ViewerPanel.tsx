import { Viewer, CzmlDataSource } from "resium";
import { Ion, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useRef, useCallback } from "react";
import { Entity, PolylineGraphics, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";
import { useCzmlStore } from "../stores/useCZMLStore"; 

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

interface Props {
  // 🎯 移除 czml prop，其他保持不变
  onCoordinateSelected?: (coords: { lon: number; lat: number; height: number }) => void;
  onEntityPicked?: (id: string) => void;
  onFinishCoordinateInput?: () => void;
  interactiveCoords?: { lon: number; lat: number }[];
  currentInputType?: "coordinate" | "entityId" | "coordinates[]" | null;
}

const ViewerPanel = ({ 
  onCoordinateSelected, 
  onEntityPicked, 
  onFinishCoordinateInput,
  interactiveCoords,
  currentInputType 
}: Props) => {
  const viewerRef = useRef<CesiumViewer | null>(null);
  
  // 🎯 从 store 获取 CZML 数据，而不是从 props
  const czml = useCzmlStore((state) => state.czml);

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
        
        if (currentInputType === "entityId") {
          setTimeout(() => {
            const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
            if (input) {
              input.focus();
            }
          }, 100);
        }
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
          
          if (currentInputType === "coordinate") {
            setTimeout(() => {
              const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
              if (input) {
                input.focus();
              }
            }, 100);
          }
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(() => {
      console.log("✅ Right-click: finish coordinate input");
      onFinishCoordinateInput?.();
      
      setTimeout(() => {
        const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
    }, ScreenSpaceEventType.RIGHT_CLICK);

    return () => {
      handler.destroy();
    };
  }, [onCoordinateSelected, onEntityPicked, onFinishCoordinateInput, currentInputType]);

  return (
    <Viewer
      style={{ width: "100%", height: "100%" }}
      ref={(e) => {
        if (e?.cesiumElement) handleReady(e.cesiumElement);
      }}
    >
      {/* 🎯 使用来自 store 的 czml 数据 */}
      <CzmlDataSource data={czml} key={JSON.stringify(czml)} />

      {interactiveCoords && interactiveCoords.length > 0 && (
        <>
          {interactiveCoords.map((coord, i) => (
            <Entity
              key={`temp-point-${i}`}
              position={Cartesian3.fromDegrees(coord.lon, coord.lat, 0)}
            >
              <PointGraphics pixelSize={8} color={Color.YELLOW} />
            </Entity>
          ))}

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