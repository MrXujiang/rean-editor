export const initialElements = [
  {
    id: "element-1",
    type: "text",
    properties: {
      text: "Hello Remotion",
      fontSize: 60,
      color: "#000000",
      fontWeight: "bold",
    },
    position: { x: 400, y: 200 },
    animations: [
      { property: "opacity", frame: 0, value: 0 },
      { property: "opacity", frame: 30, value: 1 },
      { property: "y", frame: 0, value: 250 },
      { property: "y", frame: 30, value: 200 },
    ],
    startFrame: 0,
    endFrame: 150,
  },
  {
    id: "element-2",
    type: "shape",
    properties: {
      shape: "circle",
      width: 100,
      height: 100,
      color: "#3b82f6",
    },
    position: { x: 400, y: 350 },
    animations: [
      { property: "opacity", frame: 20, value: 0 },
      { property: "opacity", frame: 50, value: 1 },
      { property: "scale", frame: 50, value: 0.5 },
      { property: "scale", frame: 70, value: 1.2 },
      { property: "scale", frame: 90, value: 1 },
    ],
    startFrame: 0,
    endFrame: 150,
  },
  {
    id: "element-3",
    type: "image",
    properties: {
      src: "/abstract-digital-animation-pattern.png",
      width: 250,
      height: 150,
    },
    position: { x: 100, y: 100 },
    animations: [
      { property: "opacity", frame: 40, value: 0 },
      { property: "opacity", frame: 70, value: 1 },
      { property: "rotation", frame: 70, value: 0 },
      { property: "rotation", frame: 100, value: 360 },
    ],
    startFrame: 0,
    endFrame: 150,
  },
]
