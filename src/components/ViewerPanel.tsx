// src/components/ViewerPanel.tsx
import { Viewer, CzmlDataSource } from "resium";
import { Ion, ScreenSpaceEventHandler, ScreenSpaceEventType, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useRef, useCallback, useEffect } from "react";
import { Entity, PolylineGraphics, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";
import { useCzmlStore } from "../stores/useCzmlStore"; 

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

// 🔧 ViewerPanel专用的focus函数，带重试机制
const focusCommandInputFromViewer = (context: string, delay = 100, maxRetries = 3) => {
  let retryCount = 0;
  
  const tryFocus = () => {
    const input = document.querySelector('input[data-command-input="true"]') as HTMLInputElement;
    if (input) {
      input.focus();
      console.log(`🎯 ViewerPanel聚焦成功 (${context})`);
      return true;
    } else {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`🔄 ViewerPanel重试聚焦 (${retryCount}/${maxRetries}) - ${context}`);
        setTimeout(tryFocus, 50);
      } else {
        console.warn(`⚠️ ViewerPanel聚焦失败 - ${context}`);
      }
      return false;
    }
  };
  
  setTimeout(tryFocus, delay);
};

interface Props {
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
  const handlerRef = useRef<ScreenSpaceEventHandler | null>(null);
  
  const czml = useCzmlStore((state) => state.czml);

  // 🔧 将点击处理逻辑分离，避免重复绑定
  const setupEventHandlers = useCallback((viewer: CesiumViewer) => {
    // 清理旧的事件处理器
    if (handlerRef.current) {
      handlerRef.current.destroy();
    }

    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    console.log("📡 设置点击事件处理器");

    handler.setInputAction((event: { position: Cartesian2 }) => {
      const position = event.position;
      console.log("🖱️ 检测到点击事件");

      // 先检查是否点击了实体
      const picked = viewer.scene.pick(position);
      if (picked?.id && typeof picked.id.id === "string") {
        const entityId = picked.id.id;
        console.log("📍 选中实体:", entityId);
        onEntityPicked?.(entityId);
        
        // 🔧 实体选择后立即聚焦输入框
        if (currentInputType === "entityId") {
          focusCommandInputFromViewer("实体选择", 100);
        }
        return; // 重要：选中实体后直接返回，不处理坐标
      }

      // 只有在需要坐标输入时才处理地图点击
      if (onCoordinateSelected && (currentInputType === "coordinate" || currentInputType === "coordinates[]")) {
        const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const height = cartographic.height ?? 0;

          console.log("👆 地图点击坐标:", { lon, lat, height });
          onCoordinateSelected({ lon, lat, height });
          
          // 🔧 对于单个坐标选择，立即聚焦输入框
          if (currentInputType === "coordinate") {
            focusCommandInputFromViewer("坐标选择", 100);
          }
        }
      }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(() => {
      console.log("✅ 右键点击：完成坐标输入");
      onFinishCoordinateInput?.();
      
      // 🔧 右键完成坐标输入后聚焦
      focusCommandInputFromViewer("右键完成", 100);
    }, ScreenSpaceEventType.RIGHT_CLICK);

  }, [onCoordinateSelected, onEntityPicked, onFinishCoordinateInput, currentInputType]);

  const handleReady = useCallback((viewer: CesiumViewer) => {
    console.log("🌍 Cesium Viewer 准备就绪");
    viewerRef.current = viewer;
    setupEventHandlers(viewer);
  }, [setupEventHandlers]);

  // 🔧 当 currentInputType 改变时重新设置事件处理器
  useEffect(() => {
    if (viewerRef.current) {
      setupEventHandlers(viewerRef.current);
    }
  }, [setupEventHandlers]);

  // 🔧 组件卸载时清理事件处理器
  useEffect(() => {
    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
      }
    };
  }, []);

  return (
    <Viewer
      style={{ width: "100%", height: "100%" }}
      ref={(e) => {
        if (e?.cesiumElement) handleReady(e.cesiumElement);
      }}
    >
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