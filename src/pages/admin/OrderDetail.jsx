import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { ArrowLeft, User, MapPin, Phone, Mail, FileText, Check, X, ArrowRight, Clock, Package, CreditCard, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../config'

const STATUS_CONFIG = {
    pending: { label: '待處理', color: 'yellow', icon: Clock, desc: '訂單剛成立，等待付款確認。' },
    paid: { label: '已付款', color: 'purple', icon: CreditCard, desc: '確認收款，準備出貨中。' },
    shipped: { label: '已出貨', color: 'blue', icon: Package, desc: '商品已寄出，運送中。' },
    completed: { label: '已完成', color: 'green', icon: CheckCircle, desc: '訂單已完成，交易結束。' },
    cancelled: { label: '已取消', color: 'gray', icon: X, desc: '訂單已取消，無效。' },
}

const STEPS = ['pending', 'paid', 'shipped', 'completed']

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
                .eq(id.includes('-') ? 'id' : 'id', id)
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
        const label = STATUS_CONFIG[newStatus].label
        if (!window.confirm(`確定要將狀態更改為「${label}」嗎？`)) return

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', id)

        if (!error) {
            setOrder({ ...order, status: newStatus })
        } else {
            alert('更新失敗')
        }
    }

    if (loading) return <div className="p-12 text-center text-gray-500">載入中...</div>
    if (!order) return <div className="p-12 text-center text-gray-500">訂單不存在</div>

    const currentStatus = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    const currentStepIndex = STEPS.indexOf(order.status)
    const isCancelled = order.status === 'cancelled'

    // Compute progress bar state
    // If cancelled, show process as stopped or greyed out?
    // Let's stick to the steps. If cancelled, we don't really highlight the steps after pending?
    // Or we just show the steps and none are "active" except maybe previous ones?
    // User image shows simple steps. Let's make a stepper.

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
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        建立時間: {format(new Date(order.created_at), 'yyyy/MM/dd HH:mm')}
                    </p>
                </div>
            </div>

            {/* Status Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">訂單狀態</h3>
                    <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border",
                        currentStatus.color === 'yellow' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                        currentStatus.color === 'purple' && "bg-purple-50 text-purple-700 border-purple-200",
                        currentStatus.color === 'blue' && "bg-blue-50 text-blue-700 border-blue-200",
                        currentStatus.color === 'green' && "bg-green-50 text-green-700 border-green-200",
                        currentStatus.color === 'gray' && "bg-gray-100 text-gray-600 border-gray-200",
                    )}>
                        <currentStatus.icon className="w-4 h-4" />
                        {currentStatus.label}
                    </div>
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-gray-400" />
                        {currentStatus.desc}
                    </p>
                </div>

                {/* Actions (Only show if not completed or cancelled) */}
                {!['completed', 'cancelled'].includes(order.status) && (
                    <div className="mb-10 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">變更狀態 (Next Actions)</p>
                        <div className="flex flex-wrap gap-3">
                            {order.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => updateStatus('paid')}
                                        className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        標記為「已付款」
                                    </button>
                                    <button
                                        onClick={() => updateStatus('cancelled')}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                        標記為「已取消」
                                    </button>
                                </>
                            )}
                            {order.status === 'paid' && (
                                <>
                                    <button
                                        onClick={() => updateStatus('shipped')}
                                        className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                                    >
                                        <ArrowRight className="w-4 h-4" />
                                        標記為「已出貨」
                                    </button>
                                    <button
                                        onClick={() => updateStatus('cancelled')}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                        標記為「已取消」 (退款/缺貨)
                                    </button>
                                </>
                            )}
                            {order.status === 'shipped' && (
                                <>
                                    <button
                                        onClick={() => updateStatus('completed')}
                                        className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
                                    >
                                        <Check className="w-4 h-4" />
                                        標記為「已完成」
                                    </button>
                                    <button
                                        onClick={() => updateStatus('cancelled')}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 border border-red-100 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95"
                                    >
                                        <X className="w-4 h-4" />
                                        標記為「已取消」 (退貨/遺失)
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Stepper / Progress Bar */}
                <div className="relative">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                    <div className="relative z-10 flex justify-between">
                        {STEPS.map((stepKey, index) => {
                            const config = STATUS_CONFIG[stepKey]
                            // Logic:
                            // - Completed steps: index < currentStepIndex (if not cancelled)
                            // - Current step: index === currentStepIndex
                            // - Future steps: index > currentStepIndex

                            let state = 'future' // future, current, completed
                            if (isCancelled) {
                                state = 'disabled'
                            } else {
                                if (index < currentStepIndex) state = 'completed'
                                else if (index === currentStepIndex) state = 'current'
                            }

                            // Special case: if cancelled, maybe just gray out everything?
                            // Let's highlight the current status if match? 
                            // Actually if cancelled, stepKey !== 'cancelled', so it won't match any step in the generic stepper.
                            // But usually users want to see where it stopped. 
                            // If Cancelled, let's just make everything gray.

                            return (
                                <div key={stepKey} className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-colors duration-300",
                                        state === 'completed' && "bg-green-500 border-green-500",
                                        state === 'current' && "bg-white border-black ring-4 ring-black/5",
                                        state === 'future' && "bg-white border-gray-300",
                                        state === 'disabled' && "bg-gray-100 border-gray-300"
                                    )}>
                                        {state === 'completed' && <Check className="w-full h-full text-white p-0.5" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold transition-colors duration-300",
                                        state === 'completed' && "text-green-600",
                                        state === 'current' && "text-black",
                                        state === 'future' && "text-gray-400",
                                        state === 'disabled' && "text-gray-300"
                                    )}>
                                        {config.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
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
