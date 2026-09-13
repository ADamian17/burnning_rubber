import { Link, Outlet } from "react-router-dom"

const MainMenu = () => {
  return (
    <div>
      <Link to="/daily">Daily</Link>
      <Link to="/settings">Settings</Link>
      <Link to="/credits">Credits</Link>
      <Link to="/splash">Splash</Link>
      <Link to="/onboarding">Onboarding</Link>
      <Link to="/garage">Garage</Link>
      <Link to="/shop">Shop</Link>
      <Link to="/run">Run</Link>
      <Link to="/summary">Summary</Link>

      <Outlet />
    </div>
  )
}

export default MainMenu
