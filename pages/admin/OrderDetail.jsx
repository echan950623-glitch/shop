import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, User, MapPin, Phone, Mail, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../config'

export default function OrderDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true)
            const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq(id.includes('-') ? 'id' : 'id', id) // Handle potential UUID vs ID
                .single()

            const { data: itemData } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', id)

            setOrder(orderData)
            setItems(itemData || [])
            setLoading(false)
        }

        if (id) fetchOrderDetails()
    }, [id])

    const updateStatus = async (newStatus) => {
        if (!window.confirm(`確定要將狀態更改為 ${newStatus} 嗎？`)) return

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setOrder({ ...order, status: newStatus })
        }
    }

    if (loading) return <div className="p-12 text-center text-gray-500">載入中...</div>
    if (!order) return <div className="p-12 text-center text-gray-500">訂單不存在</div>

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`${CONFIG.ADMIN_PATH}/orders`)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        訂單 #{order.id.slice(0, 8).toUpperCase()}
                        <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-normal",
                            order.status === 'pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                order.status === 'paid' ? "bg-purple-50 text-purple-700 border-purple-200" :
                                    order.status === 'shipped' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                        "bg-gray-50 text-gray-600 border-gray-200"
                        )}>
                            {order.status}
                        </span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        建立時間: {format(new Date(order.created_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                </div>
            </div>

            {/* Status Selection */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <p className="text-sm font-bold text-gray-500 mb-3">訂單狀態</p>
                <div className="flex flex-wrap gap-2">
                    {[
                        { value: 'pending', label: '待處理', color: 'yellow' },
                        { value: 'paid', label: '已付款', color: 'purple' },
                        { value: 'shipped', label: '已出貨', color: 'blue' },
                        { value: 'completed', label: '已完成', color: 'green' },
                        { value: 'cancelled', label: '已取消', color: 'gray' }
                    ].map((status) => (
                        <button
                            key={status.value}
                            onClick={() => updateStatus(status.value)}
                            disabled={order.status === status.value}
                            className={cn(
                                "px-4 py-2 font-bold rounded-lg transition-all text-sm border-2",
                                order.status === status.value
                                    ? status.color === 'yellow' ? "bg-yellow-500 text-white border-yellow-500"
                                        : status.color === 'purple' ? "bg-purple-500 text-white border-purple-500"
                                            : status.color === 'blue' ? "bg-blue-500 text-white border-blue-500"
                                                : status.color === 'green' ? "bg-green-500 text-white border-green-500"
                                                    : "bg-gray-500 text-white border-gray-500"
                                    : status.color === 'yellow' ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                                        : status.color === 'purple' ? "border-purple-200 text-purple-700 hover:bg-purple-50"
                                            : status.color === 'blue' ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                                                : status.color === 'green' ? "border-green-200 text-green-700 hover:bg-green-50"
                                                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            )}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">商品明細</h3>
                        </div>
                        <ul className="divide-y divide-gray-100">
                            {items.map((item) => (
                                <li key={item.id} className="p-6 flex justify-between items-center group hover:bg-gray-50/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-gray-900">{item.name_snapshot}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">規格: {item.size_snapshot}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900">
                                            NT$ {item.price_snapshot.toLocaleString()} <span className="text-gray-400 text-sm">x {item.quantity}</span>
                                        </p>
                                        <p className="font-bold text-black mt-1">
                                            NT$ {(item.price_snapshot * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
                            <span className="font-bold text-gray-500">總金額</span>
                            <span className="text-2xl font-bold text-black">NT$ {order.total_amount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Customer Info */}
                <div className="space-y-6">
                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" /> 客戶資訊
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <span className="font-bold text-xs text-gray-500">{order.customer_info?.name?.[0]}</span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">姓名</p>
                                    <p className="font-bold text-gray-900">{order.customer_info?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">電話</p>
                                    <p className="font-bold text-gray-900">{order.customer_info?.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">Email</p>
                                    <p className="font-bold text-gray-900 break-all">{order.customer_info?.email || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-0.5">地址</p>
                                    <p className="font-bold text-gray-900">{order.customer_info?.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> 訂單備註
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {order.customer_info?.note || '無備註'}
                        </p>
                        {order.payment_note && (
                            <div className="mt-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">付款末五碼</p>
                                <p className="font-mono text-lg font-bold bg-black text-white inline-block px-2 py-1 rounded">{order.payment_note}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
