import {
  Viewer,
  CzmlDataSource,
  Entity,
  PolylineGraphics,
} from "resium";
import {
  Ion,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  Viewer as CesiumViewer,
  Cartesian3,
  Color,
  PolylineDashMaterialProperty,
  defined, // Added for checking if a value is defined
} from "cesium";
import { useEffect, useRef, useCallback, useState } from "react";

const token = import.meta.env.VITE_CESIUM_TOKEN;
Ion.defaultAccessToken = token;

interface Props {
  czml: Record<string, unknown>[];
  onCoordinateSelected?: (coords: {
    lon: number;
    lat: number;
    height: number;
  }) => void;
  drawingMode: "select" | "point" | "polyline";
  onPolylineComplete?: (
    points: Array<[number, number, number]>
  ) => void;
}

const ViewerPanel = ({
  czml,
  onCoordinateSelected,
  drawingMode,
  onPolylineComplete,
}: Props) => {
  const viewerRef = useRef<CesiumViewer | null>(null);
  const eventHandlerRef = useRef<ScreenSpaceEventHandler | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPolylinePoints, setCurrentPolylinePoints] = useState<
    Array<[number, number, number]>
  >([]);
  // For rendering the polyline dynamically: positions are Cartesian3
  const [tempPolylineDisplayPositions, setTempPolylineDisplayPositions] =
    useState<Cartesian3[]>([]);

  // Reset drawing state if drawingMode changes
  useEffect(() => {
    setIsDrawing(false);
    setCurrentPolylinePoints([]);
    setTempPolylineDisplayPositions([]);
  }, [drawingMode]);

  const handleViewerReady = useCallback(
    (viewer: CesiumViewer) => {
      viewerRef.current = viewer;
      // Ensure previous handler is destroyed if one exists
      if (eventHandlerRef.current && !eventHandlerRef.current.isDestroyed()) {
        eventHandlerRef.current.destroy();
      }
      
      eventHandlerRef.current = new ScreenSpaceEventHandler(viewer.scene.canvas);
      console.log("📡 Cesium event handlers (re)attached");

      // LEFT CLICK Handler
      eventHandlerRef.current.setInputAction(
        (clickEvent: ScreenSpaceEventHandler.PositionedEvent) => {
          const pickedPosition = viewer.camera.pickEllipsoid(
            clickEvent.position,
            viewer.scene.globe.ellipsoid
          );
          if (!defined(pickedPosition)) return;

          const cartographic = Cartographic.fromCartesian(pickedPosition);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const height = cartographic.height; // Actual height from ellipsoid

          if (drawingMode === "polyline") {
            const newPoint: [number, number, number] = [lon, lat, 0]; // Use 0 for polyline height
            if (!isDrawing) {
              // First click starts drawing
              setIsDrawing(true);
              setCurrentPolylinePoints([newPoint]);
              setTempPolylineDisplayPositions(
                Cartesian3.fromDegreesArrayHeights([
                  ...newPoint, // lon, lat, height
                  ...newPoint, // lon, lat, height (to make a point visible for the start)
                ])
              );
            } else {
              // Subsequent clicks add points to the polyline
              const updatedPoints = [...currentPolylinePoints, newPoint];
              setCurrentPolylinePoints(updatedPoints);
              // Update display positions for visualization (dynamic segment will be handled by MOUSE_MOVE)
              const flatPoints = updatedPoints.reduce((acc, val) => acc.concat(val), []);
              setTempPolylineDisplayPositions(
                Cartesian3.fromDegreesArrayHeights(flatPoints)
              );
            }
          } else if (drawingMode === "point") {
            onCoordinateSelected?.({ lon, lat, height });
          }
        },
        ScreenSpaceEventType.LEFT_CLICK
      );

      // MOUSE MOVE Handler
      eventHandlerRef.current.setInputAction(
        (movement: ScreenSpaceEventHandler.MotionEvent) => {
          if (drawingMode !== "polyline" || !isDrawing || currentPolylinePoints.length === 0) {
            return;
          }

          const pickedPosition = viewer.camera.pickEllipsoid(
            movement.endPosition, // Use endPosition for MOUSE_MOVE
            viewer.scene.globe.ellipsoid
          );
          if (!defined(pickedPosition)) return;

          const cartographic = Cartographic.fromCartesian(pickedPosition);
          const lon = CesiumMath.toDegrees(cartographic.longitude);
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const height = 0; // Use 0 for polyline height

          // Flatten currentPolylinePoints and add current mouse position for rubber band effect
          const flatPointsSoFar = currentPolylinePoints.reduce((acc, val) => acc.concat(val), []);
          const rubberBandPositions = Cartesian3.fromDegreesArrayHeights([
            ...flatPointsSoFar,
            lon,
            lat,
            height,
          ]);
          setTempPolylineDisplayPositions(rubberBandPositions);
        },
        ScreenSpaceEventType.MOUSE_MOVE
      );

      // RIGHT CLICK Handler (to finalize polyline)
      eventHandlerRef.current.setInputAction(
        () => {
          if (
            drawingMode === "polyline" &&
            isDrawing &&
            currentPolylinePoints.length > 0 // Require at least one point (though polylines usually need >=2)
          ) {
            // If only one point was clicked, it's just a point, not a line.
            // Or, decide if a single click followed by right-click should still create a 1-point "polyline"
            // For now, let's assume we need at least two points to make sense for a polyline.
            if (currentPolylinePoints.length >= 2) {
                 onPolylineComplete?.(currentPolylinePoints);
            }
            setIsDrawing(false);
            setCurrentPolylinePoints([]);
            setTempPolylineDisplayPositions([]);
          }
        },
        ScreenSpaceEventType.RIGHT_CLICK
      );
    },
    [drawingMode, onCoordinateSelected, onPolylineComplete, isDrawing, currentPolylinePoints] // Dependencies for useCallback
  );
  
  // Cleanup event handler on component unmount or when handleViewerReady changes
  useEffect(() => {
    return () => {
      if (eventHandlerRef.current && !eventHandlerRef.current.isDestroyed()) {
        eventHandlerRef.current.destroy();
        eventHandlerRef.current = null;
        console.log("🧹 Cesium event handlers destroyed");
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  return (
    <Viewer
      full // Use full to take up parent container size
      ref={(e) => {
        if (e?.cesiumElement) {
          handleViewerReady(e.cesiumElement);
        }
      }}
      timeline={false} // Optional: hide timeline
      animation={false} // Optional: hide animation widget
      // baseLayerPicker={false} // Optional: hide base layer picker
      // geocoder={false} // Optional: hide geocoder
      // homeButton={false} // Optional: hide home button
      // sceneModePicker={false} // Optional: hide scene mode picker
      // navigationHelpButton={false} // Optional: hide navigation help
    >
      <CzmlDataSource data={czml} key={JSON.stringify(czml)} />
      {isDrawing && tempPolylineDisplayPositions.length > 0 && (
        <Entity>
          <PolylineGraphics
            positions={tempPolylineDisplayPositions}
            width={3} // Make temp line a bit thicker or styled
            material={
              new PolylineDashMaterialProperty({
                color: Color.YELLOW,
                dashLength: 16.0,
              })
            }
          />
        </Entity>
      )}
    </Viewer>
  );
};

export default ViewerPanel;
