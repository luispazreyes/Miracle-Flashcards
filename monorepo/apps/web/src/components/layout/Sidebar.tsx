import { useState } from 'react'
import { NavLink } from 'react-router'
import type { User } from '../../mocks'
import { Avatar } from '../ui/Avatar'
import { Icon, type IconName } from '../ui/Icon'
import { IconButton } from '../ui/IconButton'

export interface SidebarItem {
  label: string
  to: string
  icon: IconName
}

interface Props {
  items: SidebarItem[]
  user: User
}

export function Sidebar({ items, user }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <aside className="border-b border-borde bg-superficie md:flex md:w-(--ancho-panel-mazos) md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <div className="flex items-center justify-between px-4 py-2 md:py-4">
        <span className="text-lg font-semibold">Miracle Flashcards</span>
        <span className="md:hidden">
          <IconButton
            icon={open ? 'close' : 'menu'}
            label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            aria-controls="sidebar-nav"
            onClick={() => setOpen((v) => !v)}
          />
        </span>
      </div>

      <nav
        id="sidebar-nav"
        aria-label="Principal"
        className={`${open ? 'block' : 'hidden'} px-2 pb-2 md:block md:flex-1`}
      >
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex objetivo-min items-center gap-3 rounded-md px-3 py-2 font-semibold ${
                    isActive ? 'bg-primario text-sobre-primario' : 'text-texto hover:bg-fondo'
                  }`
                }
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`${open ? 'flex' : 'hidden'} items-center gap-3 border-t border-borde px-4 py-3 md:flex`}>
        <Avatar name={user.name} src={user.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-sm text-texto-suave">{user.email}</p>
        </div>
      </div>
    </aside>
  )
}
