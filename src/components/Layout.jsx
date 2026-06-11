import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = () => {
  return (
    <div className="app-layout">
      <div className="app-content">
        <Outlet />
      </div>
      <Navbar />
    </div>
  )
}

export default Layout