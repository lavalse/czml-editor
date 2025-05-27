import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Ion } from 'cesium';
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YWYwNGQzOC1iYmRiLTQzZWEtOTJkMC1lNTEwZGI3MDlhZjUiLCJpZCI6MjM3MzMsImlhdCI6MTc0ODM1NDA4M30.uPrrBjl_bEZUpSsed0_iro7A6WqrjmpddJhJf0K_tGk';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
