// src/components/ViewerPanel.tsx
import { Viewer, CzmlDataSource } from "resium";
import { Ion, Cartesian2, Cartographic, Math as CesiumMath, Viewer as CesiumViewer } from "cesium";
import { useRef, useCallback, useEffect } from "react";
import { Entity, PolylineGraphics, PointGraphics } from "resium";
import { Cartesian3, Color } from "cesium";
import { useCzmlStore } from "../stores/useCzmlStore";
import { useUnifiedInput } from "../providers/UnifiedInputProvider";
import { MOUSE_BUTTON } from "../hooks/useMouseManager";

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

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
  const czml = useCzmlStore((state) => state.czml);
  
  // 使用统一输入系统
  const { registerClickHandler, registerMouseBinding, focusCommandInput } = useUnifiedInput();

  // 设置 Cesium Viewer
  const handleReady = useCallback((viewer: CesiumViewer) => {
    console.log("🌍 Cesium Viewer 准备就绪");
    viewerRef.current = viewer;
  }, []);

  // 使用统一输入系统注册交互
  useEffect(() => {
    if (!viewerRef.current) return;

    const unsubscribers: (() => void)[] = [];
    
    // 添加拖拽状态跟踪
    let mouseDownPosition: { x: number; y: number } | null = null;
    let isDragging = false;
    const DRAG_THRESHOLD = 5; // 像素阈值，移动超过此距离视为拖拽

    // 鼠标按下 - 记录初始位置
    unsubscribers.push(
      registerMouseBinding({
        type: 'mousedown',
        button: MOUSE_BUTTON.LEFT,
        target: '.cesium-widget',
        description: '记录鼠标按下位置',
        action: (event) => {
          mouseDownPosition = { x: event.clientX, y: event.clientY };
          isDragging = false;
        }
      })
    );

    // 鼠标移动 - 检测是否在拖拽
    unsubscribers.push(
      registerMouseBinding({
        type: 'mousemove',
        target: '.cesium-widget',
        description: '检测拖拽',
        action: (event) => {
          if (mouseDownPosition) {
            const dx = event.clientX - mouseDownPosition.x;
            const dy = event.clientY - mouseDownPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > DRAG_THRESHOLD) {
              isDragging = true;
            }
          }
        }
      })
    );

    // 鼠标释放 - 清理状态
    unsubscribers.push(
      registerMouseBinding({
        type: 'mouseup',
        button: MOUSE_BUTTON.LEFT,
        target: '.cesium-widget',
        description: '清理拖拽状态',
        action: () => {
          // 延迟清理，确保 click 事件能读取到状态
          setTimeout(() => {
            mouseDownPosition = null;
            isDragging = false;
          }, 10);
        }
      })
    );

    // 左键点击 - 选择实体或坐标（非拖拽时）
    unsubscribers.push(
      registerClickHandler({
        target: '.cesium-widget',
        button: MOUSE_BUTTON.LEFT,
        context: 'viewer-select',
        onClick: (event) => {
          if (!viewerRef.current) return;
          
          // 如果是拖拽操作，不处理点击
          if (isDragging) {
            console.log("🖱️ 拖拽操作，忽略点击");
            return;
          }

          const viewer = viewerRef.current;
          const position = new Cartesian2(event.clientX, event.clientY);
          
          // 优先处理坐标选择（当正在输入坐标时）
          if (onCoordinateSelected && (currentInputType === "coordinate" || currentInputType === "coordinates[]")) {
            const cartesian = viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
            if (cartesian) {
              const cartographic = Cartographic.fromCartesian(cartesian);
              const lon = CesiumMath.toDegrees(cartographic.longitude);
              const lat = CesiumMath.toDegrees(cartographic.latitude);
              const height = cartographic.height ?? 0;

              console.log("👆 地图点击坐标:", { lon, lat, height });
              onCoordinateSelected({ lon, lat, height });
              
              // 单个坐标选择后聚焦
              if (currentInputType === "coordinate") {
                focusCommandInput();
              }
            }
            return; // 坐标输入模式下，不再检查实体
          }
          
          // 只有在需要选择实体时才检查实体
          if (currentInputType === "entityId") {
            const picked = viewer.scene.pick(position);
            if (picked?.id && typeof picked.id.id === "string") {
              const entityId = picked.id.id;
              console.log("📍 选中实体:", entityId);
              onEntityPicked?.(entityId);
              focusCommandInput();
            }
          }
        },
        onDoubleClick: (event) => {
          // 双击可以用于快速缩放到点击位置
          console.log("双击地图");
        }
      })
    );

    // 右键点击 - 完成坐标输入
    unsubscribers.push(
      registerMouseBinding({
        type: 'contextmenu',
        button: MOUSE_BUTTON.RIGHT,
        target: '.cesium-widget',
        description: '完成坐标输入',
        preventDefault: true,
        action: () => {
          console.log("✅ 右键点击：完成坐标输入");
          onFinishCoordinateInput?.();
          focusCommandInput();
        }
      })
    );

    // Ctrl+左键拖拽 - 旋转视图
    unsubscribers.push(
      registerMouseBinding({
        type: 'mousedown',
        button: MOUSE_BUTTON.LEFT,
        ctrl: true,
        target: '.cesium-widget',
        description: '旋转视图',
        action: () => {
          console.log("开始旋转视图");
          // Cesium 会自动处理 Ctrl+拖拽
        }
      })
    );

    // 清理函数
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [viewerRef.current, currentInputType, onCoordinateSelected, onEntityPicked, onFinishCoordinateInput, 
      registerClickHandler, registerMouseBinding, focusCommandInput]);

  return (
    <Viewer
      style={{ width: "100%", height: "100%" }}
      ref={(e) => {
        if (e?.cesiumElement) handleReady(e.cesiumElement);
      }}
      timeline={false}
      animation={false}
      baseLayerPicker={false}
      geocoder={false}
      fullscreenButton={false}
      homeButton={false}
      sceneModePicker={false}
      navigationHelpButton={false}
      vrButton={false}
    >
      <CzmlDataSource data={czml} key={JSON.stringify(czml)} />

      {/* 交互式坐标显示 */}
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