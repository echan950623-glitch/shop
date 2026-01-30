import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { cn } from '../../lib/utils'
import { Loader, Eye, User, Calendar, Package, Clock, CreditCard, Truck, CheckCircle, XCircle, Filter } from 'lucide-react'
import { CONFIG } from '../../config'

export default function OrderList() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [showFilter, setShowFilter] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true)
            let query = supabase
                .from('orders')
                .select('*, order_items(count)')
                .order('created_at', { ascending: false })

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query

            if (error) console.error('Error fetching orders:', error)
            else setOrders(data)
            setLoading(false)
        }

        fetchOrders()
    }, [filter])

    const getStatusConfig = (status) => {
        switch (status) {
            case 'pending': return {
                label: '待處理',
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-600',
                icon: Clock
            }
            case 'paid': return {
                label: '已付款',
                bg: 'bg-purple-500/10',
                text: 'text-purple-600',
                icon: CreditCard
            }
            case 'shipped': return {
                label: '已出貨',
                bg: 'bg-blue-500/10',
                text: 'text-blue-600',
                icon: Truck
            }
            case 'completed': return {
                label: '已完成',
                bg: 'bg-green-500/10',
                text: 'text-green-600',
                icon: CheckCircle
            }
            case 'cancelled': return {
                label: '已取消',
                bg: 'bg-gray-500/10',
                text: 'text-gray-500',
                icon: XCircle
            }
            default: return {
                label: status,
                bg: 'bg-gray-100',
                text: 'text-gray-600',
                icon: Package
            }
        }
    }

    const filterOptions = [
        { value: 'all', label: '全部' },
        { value: 'pending', label: '待處理' },
        { value: 'paid', label: '已付款' },
        { value: 'shipped', label: '已出貨' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' },
    ]

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">訂單管理</h2>
                <p className="text-gray-500 mt-1 text-sm">查看與管理所有客戶訂單</p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Filter className="w-4 h-4" />
                        <span>{filterOptions.find(f => f.value === filter)?.label || '篩選'}</span>
                    </button>

                    {showFilter && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        setFilter(option.value)
                                        setShowFilter(false)
                                    }}
                                    className={cn(
                                        "w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors",
                                        filter === option.value ? "bg-gray-100 font-bold" : ""
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Orders Cards */}
            {loading ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                    <Loader className="animate-spin h-8 w-8 mb-4 text-gray-400" />
                    載入中...
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    目前沒有訂單
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const statusConfig = getStatusConfig(order.status)
                        const StatusIcon = statusConfig.icon
                        const itemCount = order.order_items?.[0]?.count || 0

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => navigate(`${CONFIG.ADMIN_PATH}/orders/${order.id}`)}
                            >
                                {/* Header: Order ID & Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">ORDER ID</p>
                                        <p className="text-lg font-bold text-gray-900 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                    <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold", statusConfig.bg, statusConfig.text)}>
                                        <StatusIcon className="w-4 h-4" />
                                        {statusConfig.label}
                                    </div>
                                </div>

                                {/* Customer & Date */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span>{order.customer_info?.name || 'Guest'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{format(new Date(order.created_at), 'yyyy/MM/dd HH:mm')}</span>
                                    </div>
                                </div>

                                {/* Items & Total */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-gray-500">共 {itemCount} 件商品</span>
                                    <span className="text-xl font-bold text-gray-900">NT$ {order.total_amount.toLocaleString()}</span>
                                </div>

                                {/* Action Button */}
                                <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
                                    <Eye className="w-4 h-4" />
                                    查看詳情
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
