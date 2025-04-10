import React, { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { FaUser } from 'react-icons/fa6'

import { ROUTES } from '../constants/CONSTANTS'
import { AuthContext } from '../contexts/auth'
import NavDropdownButton from './NavbarDropdownButton'
import Offcanvas from './Offcanvas'
import ProtectedComponent from './ProtectedComponent'
import SidebarItems from './SidebarItems'

const Navbar: React.FC = () => {
  const location = useLocation()

  const { setToken, self, setSelf } = useContext(AuthContext)

  const [sidebar, setSidebar] = useState(false)
  const collapseSidebar = () => setSidebar(false)
  const expandSidebar = () => setSidebar(true)

  useEffect(collapseSidebar, [location.pathname])

  return (
    <>
      <nav className='align-items-center bg-body d-flex navbar px-3 py-2 shadow-sm z-3'>
        <div className='container-fluid'>
          <button
            className='border-0 d-md-none navbar-toggler ps-0'
            aria-controls='offcanvasNavbar'
            onClick={expandSidebar}
          >
            <span className='navbar-toggler-icon' />
          </button>
          <h5 className='mb-0 text-muted'>
            <strong>HR Management</strong>
          </h5>
          <div className='align-items-center d-flex ms-auto'>
            <NavDropdownButton
              label='Profile'
              sublabel={self?.name || 'Unknown'}
              className='ms-2 pe-0'
              icon={<FaUser />}
            >
              <NavDropdownButton.NavDropdownItem to={ROUTES.password}>
                Update Password
              </NavDropdownButton.NavDropdownItem>
              <ProtectedComponent rolesAllowed={['SuperAdmin']}>
                <NavDropdownButton.NavDropdownItem to={ROUTES.user}>
                  Users
                </NavDropdownButton.NavDropdownItem>
              </ProtectedComponent>
              <li
                role='button'
                onClick={() => {
                  setToken(null)
                  setSelf(undefined)
                }}
              >
                <div className='dropdown-item'>Logout</div>
              </li>
            </NavDropdownButton>
          </div>
        </div>
      </nav>

      <Offcanvas
        directionClass='offcanvas-start'
        onClose={collapseSidebar}
        show={sidebar}
      >
        <SidebarItems />
      </Offcanvas>
    </>
  )
}

export default Navbar
