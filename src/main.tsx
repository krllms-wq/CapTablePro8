// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login'

function Home() {
  return <div style={{padding:24}}>
    <h1>CapTablePro</h1>
    <p>Главная страница. Перейти на <a href="/login">/login</a></p>
  </div>
}

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
