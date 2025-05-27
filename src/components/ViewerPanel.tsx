import { Viewer, CzmlDataSource } from "resium";
import { Ion, CzmlDataSource as CzmlDS } from "cesium";

Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YWYwNGQzOC1iYmRiLTQzZWEtOTJkMC1lNTEwZGI3MDlhZjUiLCJpZCI6MjM3MzMsImlhdCI6MTc0ODM1NDA4M30.uPrrBjl_bEZUpSsed0_iro7A6WqrjmpddJhJf0K_tGk";

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
