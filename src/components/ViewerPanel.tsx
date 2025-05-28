import { Viewer, CzmlDataSource } from "resium";
import { Ion, CzmlDataSource as CzmlDS } from "cesium";
const token = import.meta.env.VITE_CESIUM_TOKEN;

Ion.defaultAccessToken = token;

interface Props {
  czml: Record<string, unknown>[];
}

const ViewerPanel = ({ czml }: Props) => {

  return (
    <Viewer style={{ width: "100%", height: "100%" }}>
      <CzmlDataSource data={czml} key={JSON.stringify(czml)} />
    </Viewer>
  );
};

export default ViewerPanel;
