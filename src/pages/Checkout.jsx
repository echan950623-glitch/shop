import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Truck, Store, User, Phone, MessageCircle, CheckCircle, ArrowLeft, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function Checkout() {
    const { cart, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shippingMethod, setShippingMethod] = useState('store');

    const shippingCost = shippingMethod === 'home' ? 100 : 60;
    const finalTotal = totalPrice + shippingCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.target);
        const customerInfo = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email'),
            address: formData.get('address'),
            note: formData.get('note'),
            shipping_method: shippingMethod
        };

        // Prepare items for RPC
        // cart items struct: { id: product.id, variantId, size, price, name, quantity, ... }
        // RPC Expects: variant_id, product_id, quantity, name, size, price
        const orderItems = cart.map(item => ({
            variant_id: item.variantId,
            product_id: item.id,
            quantity: item.quantity,
            name: item.name,
            size: item.size,
            price: item.price
        }));

        try {
            const { data: orderId, error } = await supabase.rpc('create_order', {
                p_user_id: null, // Guest checkout
                p_customer_info: customerInfo,
                p_total_amount: finalTotal,
                p_items: orderItems
            });

            if (error) throw error;
            console.log('Order created:', orderId);

            setOrderPlaced(true); // 標記訂單已成立，防止被導回購物車
            clearCart();
            navigate('/success', { replace: true, state: { orderId } });
        } catch (error) {
            console.error('Checkout error:', error);
            alert('結帳失敗: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/600x400?text=No+Image";
        e.target.onerror = null;
    };

    // 注意：不在這裡檢查 cart.length，因為 clearCart 後會觸發重渲染
    // 改用 useEffect 處理初始導向
    const [orderPlaced, setOrderPlaced] = React.useState(false);

    React.useEffect(() => {
        if (cart.length === 0 && !orderPlaced) {
            navigate('/cart');
        }
    }, [cart.length, orderPlaced, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate('/cart')}
                    className="flex items-center text-gray-500 hover:text-black mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                    返回購物車
                </button>

                <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">結帳資訊</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. 訂單明細 */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                            <ShoppingCart className="w-5 h-5 text-gray-900" /> 訂單明細
                        </h3>
                        <div className="divide-y divide-gray-50">
                            {cart.map((item, idx) => (
                                <div key={`${item.variantId}-${idx}`} className="py-4 flex justify-between items-center group hover:bg-gray-50/50 transition-colors rounded-lg px-2 -mx-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" onError={handleImageError} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.size} x {item.quantity}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-sm text-gray-900">NT$ {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. 配送方式 */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                            <Truck className="w-5 h-5 text-gray-900" /> 配送方式
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['store', 'home'].map((method) => (
                                <label key={method} className={cn(
                                    "relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-200",
                                    shippingMethod === method
                                        ? "border-black bg-gray-50"
                                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                )}>
                                    <input
                                        type="radio"
                                        name="shipping"
                                        className="absolute opacity-0"
                                        checked={shippingMethod === method}
                                        onChange={() => setShippingMethod(method)}
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center border shadow-sm transition-colors",
                                            shippingMethod === method ? "bg-black border-black text-white" : "bg-white border-gray-100 text-gray-500"
                                        )}>
                                            {method === 'store' ? <Store className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <span className="font-bold block text-gray-900">{method === 'store' ? '超商取貨' : '宅配到府'}</span>
                                            <span className="text-sm text-gray-500">運費 NT$ {method === 'store' ? 60 : 100}</span>
                                        </div>
                                    </div>
                                    {shippingMethod === method && <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-black" />}
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* 3. 買家資料 */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                            <User className="w-5 h-5 text-gray-900" /> 買家資料
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">收件人姓名</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                                    <input
                                        required
                                        name="name"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                        placeholder="請輸入真實姓名"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700 ml-1">手機號碼</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                                    <input
                                        required
                                        name="phone"
                                        type="tel"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                        placeholder="09xx-xxx-xxx"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                                    <input
                                        required
                                        name="email"
                                        type="email"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                        placeholder="order@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">地址</label>
                                <input
                                    required
                                    name="address"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                    placeholder="請輸入完整收件地址"
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">訂單備註</label>
                                <textarea
                                    name="note"
                                    rows="3"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-400"
                                    placeholder="有什麼特殊需求嗎？例如：警衛室代收"
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* 結算總金額 & 送出 */}
                    <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm sticky bottom-4">
                        <div className="flex justify-between items-center mb-3 text-gray-500">
                            <span>商品總計</span>
                            <span>NT$ {totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6 text-gray-500">
                            <span>運費</span>
                            <span>NT$ {shippingCost}</span>
                        </div>
                        <div className="border-t border-gray-100 my-4"></div>
                        <div className="flex justify-between items-center mb-8">
                            <span className="text-xl font-bold text-gray-900">應付金額</span>
                            <span className="text-3xl font-extrabold text-black tracking-tight">NT$ {finalTotal.toLocaleString()}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-black text-white font-bold text-lg rounded-xl hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader className="animate-spin w-5 h-5" /> : '立即結帳'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
