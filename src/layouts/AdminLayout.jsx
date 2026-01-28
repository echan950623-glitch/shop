import { useState } from 'react'
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { CONFIG } from '../config'

export default function AdminLayout() {
    const { user, signOut } = useAuth()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // 簡單的保護：如果沒有 User 就踢去 Login
    if (!user) {
        return <Navigate to={`${CONFIG.ADMIN_PATH}/login`} replace />
    }

    const navItems = [
        { href: CONFIG.ADMIN_PATH, icon: LayoutDashboard, label: '儀表板' },
        { href: `${CONFIG.ADMIN_PATH}/products`, icon: Package, label: '商品管理' },
        { href: `${CONFIG.ADMIN_PATH}/orders`, icon: ShoppingBag, label: '訂單管理' },
    ]

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-900">{CONFIG.STORE_NAME} 後台</h1>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm flex flex-col transition-transform duration-300 ease-in-out",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-bold text-gray-900">{CONFIG.STORE_NAME}</h1>
                    <p className="text-sm text-gray-500 mt-1 truncate">{user.email}</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-black text-white"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <button
                        onClick={signOut}
                        className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        登出
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
