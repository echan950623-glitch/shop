import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Copy, Check, Loader, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';

// 賣家銀行資訊 - 從 .env 讀取
const BANK_INFO = {
    bankName: import.meta.env.VITE_BANK_NAME || '請設定銀行名稱',
    bankCode: import.meta.env.VITE_BANK_CODE || '000',
    accountNumber: import.meta.env.VITE_BANK_ACCOUNT || '請設定帳號',
    accountName: import.meta.env.VITE_BANK_HOLDER || '請設定戶名'
};

export default function Success() {
    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.state?.orderId;

    const [paymentCode, setPaymentCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // 簡單的慶祝動畫
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmitPayment = async () => {
        if (paymentCode.length !== 5) {
            alert('請輸入帳號後5碼');
            return;
        }

        if (!orderId) {
            alert('訂單資訊遺失，請聯繫客服');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('orders')
                .update({ payment_note: paymentCode })
                .eq('id', orderId);

            if (error) throw error;

            setIsSubmitted(true);
        } catch (error) {
            console.error('Submit payment error:', error);
            alert('提交失敗: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-500">
            <div className="max-w-md w-full space-y-6">
                {/* 訂單成立卡片 */}
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-3">訂單成立！</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        感謝您的購買，請於 24 小時內完成匯款。<br />
                        {orderId && (
                            <span className="mt-2 block">
                                訂單編號: <span className="font-mono font-bold text-black bg-gray-100 px-2 py-1 rounded">{orderId.slice(0, 8).toUpperCase()}</span>
                            </span>
                        )}
                    </p>
                </div>

                {/* 銀行匯款資訊 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        匯款資訊
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">銀行名稱</span>
                            <span className="font-medium text-gray-900">{BANK_INFO.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">銀行代碼</span>
                            <span className="font-mono font-bold text-gray-900">{BANK_INFO.bankCode}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-gray-500">帳號</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-900">{BANK_INFO.accountNumber}</span>
                                <button
                                    onClick={() => handleCopy(BANK_INFO.accountNumber)}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-gray-500">戶名</span>
                            <span className="font-medium text-gray-900">{BANK_INFO.accountName}</span>
                        </div>
                    </div>
                </div>

                {/* 回報匯款 */}
                {!isSubmitted ? (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">回報匯款</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            匯款完成後，請輸入您匯款帳號的<strong>後5碼</strong>，以便我們核對款項。
                        </p>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                maxLength={5}
                                value={paymentCode}
                                onChange={(e) => setPaymentCode(e.target.value.replace(/\D/g, ''))}
                                placeholder="輸入帳號後5碼"
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-center font-mono text-lg tracking-widest"
                            />
                            <button
                                onClick={handleSubmitPayment}
                                disabled={isSubmitting || paymentCode.length !== 5}
                                className="px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : '送出'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                        <p className="font-bold text-green-800">匯款資訊已送出！</p>
                        <p className="text-green-600 text-sm mt-1">我們會盡快核對並為您出貨。</p>
                    </div>
                )}

                {/* 繼續購物按鈕 */}
                <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
                >
                    繼續購物
                </button>
            </div>
        </div>
    );
}
