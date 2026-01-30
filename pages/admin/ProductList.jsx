import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Plus, Edit, Trash2, Loader, Package, Box } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CONFIG } from '../../config'

export default function ProductList() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchProducts = async () => {
        setLoading(true)
        // 取得所有商品 (包含下架的)，並計算總庫存
        const { data, error } = await supabase
            .from('products')
            .select('*, product_variants(stock), product_images(url, display_order)')
            .order('created_at', { ascending: false })
            .order('display_order', { ascending: true, foreignTable: 'product_images' })

        if (error) {
            console.error('Error fetching products:', error)
        } else {
            // 計算每個商品的總庫存並設定圖片 (優先使用 product_images)
            const productsWithStock = data.map(product => {
                const firstImage = product.product_images?.[0]?.url
                return {
                    ...product,
                    image_url: firstImage || product.image_url, // Prefer new table, fallback to old column
                    totalStock: product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0,
                    variantCount: product.product_variants?.length || 0
                }
            })
            setProducts(productsWithStock)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    const handleDelete = async (id) => {
        if (!window.confirm('確定要刪除此商品嗎？此操作無法復原！')) return

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Delete error:', error)
            alert('刪除失敗: ' + error.message)
        } else {
            setProducts(products.filter(p => p.id !== id))
        }
    }

    const handleToggleActive = async (e, product) => {
        e.stopPropagation()

        const newStatus = !product.is_active
        const { error } = await supabase
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', product.id)

        if (error) {
            console.error('Toggle error:', error)
            alert('更新失敗: ' + error.message)
        } else {
            setProducts(products.map(p =>
                p.id === product.id ? { ...p, is_active: newStatus } : p
            ))
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">商品列表</h2>
                    <p className="text-gray-500 mt-1 text-sm">管理您商店中的所有商品</p>
                </div>
                <Link
                    to={`${CONFIG.ADMIN_PATH}/products/new`}
                    className="inline-flex items-center px-4 md:px-6 py-2.5 md:py-3 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-black hover:bg-gray-800 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                    <Plus className="h-5 w-5 mr-1 md:mr-2" />
                    <span className="hidden md:inline">新增商品</span>
                    <span className="md:hidden">新增</span>
                </Link>
            </div>

            <div className="bg-white shadow-sm border border-gray-100 overflow-hidden rounded-2xl">
                {loading ? (
                    <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                        <Loader className="animate-spin h-8 w-8 mb-4 text-gray-400" />
                        載入中...
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <li
                                key={product.id}
                                onClick={() => window.location.href = `${CONFIG.ADMIN_PATH}/products/${product.id}`}
                                className={cn(
                                    "flex flex-col md:flex-row px-4 md:px-6 py-4 md:py-5 hover:bg-gray-50/50 transition-colors cursor-pointer gap-4",
                                    !product.is_active && "opacity-60"
                                )}
                            >
                                {/* 圖片 */}
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="relative h-16 w-16 md:h-20 md:w-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs font-medium">No Img</div>
                                        )}
                                        {!product.is_active && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">已下架</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* 商品資訊 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base md:text-lg font-bold text-gray-900 mb-1 truncate">{product.name}</div>
                                        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">NT$ {product.price.toLocaleString()}</span>
                                            <span className="hidden md:inline">•</span>
                                            <span className="hidden md:inline">{product.variantCount} 種規格</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 庫存 & 上架開關 & 操作 */}
                                <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4">
                                    {/* 總庫存 */}
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                                        <Box className={cn("w-5 h-5", product.totalStock > 0 ? "text-green-500" : "text-red-500")} />
                                        <div className="text-sm">
                                            <span className="text-gray-500">總庫存</span>
                                            <div>
                                                <span className={cn("font-bold text-lg", product.totalStock > 0 ? "text-green-600" : "text-red-600")}>
                                                    {product.totalStock}
                                                </span>
                                                <span className="text-gray-400 ml-1 text-xs">件 ({product.variantCount} 規格)</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 上架/下架開關 */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button
                                            onClick={(e) => handleToggleActive(e, product)}
                                            className={cn(
                                                "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
                                                product.is_active ? "bg-green-500" : "bg-gray-300"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                                                    product.is_active ? "translate-x-6" : "translate-x-1"
                                                )}
                                            />
                                        </button>
                                        <span className={cn("text-xs font-medium", product.is_active ? "text-green-600" : "text-gray-500")}>
                                            {product.is_active ? '上架中' : '已下架'}
                                        </span>
                                    </div>

                                    {/* 編輯 & 刪除按鈕 */}
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.location.href = `${CONFIG.ADMIN_PATH}/products/${product.id}`;
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                        >
                                            <Edit className="h-4 w-4" />
                                            編輯
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(product.id);
                                            }}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-red-600 font-bold rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-sm"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            刪除
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {products.length === 0 && (
                            <li className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Package className="w-8 h-8 text-gray-400" />
                                </div>
                                尚未建立任何商品，立即新增一個吧！
                            </li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    )
}
