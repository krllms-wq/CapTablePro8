// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login'
import Login2 from './pages/Login2'

function Home() {
  return (
    <div style={{padding:24, fontFamily:'system-ui, sans-serif'}}>
      <h1>CapTablePro</h1>
      <p>
        Главная страница. Перейти на{' '}
        <a href="/login">/login</a> или <a href="/login2">/login2</a>
      </p>
    </div>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <Login /> },
  { path: '/login2', element: <Login2 /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
