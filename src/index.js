import React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";

function App() {
    return <div className="container" />;
}

const root = document.querySelector("#root");
const r = createRoot(root);
r.render(<App />);
