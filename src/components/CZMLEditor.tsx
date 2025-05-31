// src/components/CzmlEditor.tsx

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const CzmlEditor = ({ value, onChange }: Props) => {
  return (
    <textarea
      style={{
        width: "100%",
        height: "60%",
        fontFamily: "monospace",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "8px",
        boxSizing: "border-box",
        color:"black"
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default CzmlEditor;
