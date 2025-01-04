import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

// Prevent flash of wrong theme
const theme = localStorage.getItem('theme') || 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
document.documentElement.classList.add(theme)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
