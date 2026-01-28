import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Upload, X, Plus, Loader, ArrowLeft, Save } from 'lucide-react'
import { CONFIG } from '../../config'

export default function ProductEditor() {
    const { id } = useParams()
    const isEdit = !!id
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image_url: '',
        description: '',
        is_active: true
    })
    const [variants, setVariants] = useState([{ size: 'F', stock: 10 }])
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true)
            const { data: product } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single()

            const { data: vs } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', id)

            if (product) {
                setFormData(product)
                if (vs && vs.length > 0) {
                    setVariants(vs)
                }
            }
            setLoading(false)
        }

        if (isEdit) {
            fetchProduct()
        }
    }, [id, isEdit])

    const handleImageUpload = async (e) => {
        try {
            setUploading(true)
            const file = e.target.files[0]
            if (!file) return

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            setFormData({ ...formData, image_url: data.publicUrl })
        } catch (error) {
            alert('圖片上傳失敗 (請確認已登入且有權限): ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...variants]
        newVariants[index][field] = value
        setVariants(newVariants)
    }

    const addVariant = () => {
        setVariants([...variants, { size: '', stock: 0 }])
    }

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const sizes = variants.map(v => v.size.trim())
        const uniqueSizes = new Set(sizes)
        if (uniqueSizes.size !== sizes.length) {
            alert('錯誤：規格尺寸 (Size) 不能重複，請檢查並修正。')
            return
        }

        setLoading(true)

        try {
            let productId = id

            const productData = {
                name: formData.name,
                price: parseInt(formData.price),
                image_url: formData.image_url,
                description: formData.description,
                is_active: formData.is_active
            }

            if (isEdit) {
                const { error } = await supabase.from('products').update(productData).eq('id', id)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('products').insert(productData).select().single()
                if (error) throw error
                productId = data.id
            }

            if (isEdit) {
                await supabase.from('product_variants').delete().eq('product_id', productId)
            }

            const insertData = variants.map(v => ({
                product_id: productId,
                size: v.size,
                stock: parseInt(v.stock)
            }))

            if (insertData.length > 0) {
                const { error: variantError } = await supabase
                    .from('product_variants')
                    .insert(insertData)
                if (variantError) throw variantError
            }

            navigate(`${CONFIG.ADMIN_PATH}/products`)
        } catch (error) {
            console.error('Submit Error:', error)
            alert('儲存失敗: ' + (error.message || '未知錯誤'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`${CONFIG.ADMIN_PATH}/products`)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{isEdit ? '編輯商品' : '新增商品'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">基本資訊</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品名稱</label>
                            <input
                                type="text"
                                required
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">價格</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品描述</label>
                            <textarea
                                rows="4"
                                className="block w-full border border-gray-200 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all resize-none"
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-sm font-bold text-gray-700">商品圖片</label>
                            <div className="mt-1 flex items-start gap-6">
                                <div className="h-32 w-32 bg-gray-100 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-gray-400 text-xs">預覽</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                        <Upload className="h-4 w-4 mr-2" />
                                        {uploading ? '上傳中...' : '選擇圖片'}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <p className="mt-2 text-xs text-gray-500">支援 JPG, PNG, WebP。建議尺寸 800x1000。</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants */}
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">規格與庫存</h3>
                        <button type="button" onClick={addVariant} className="text-sm font-bold text-blue-600 hover:text-blue-500 flex items-center bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                            <Plus className="w-4 h-4 mr-1" /> 新增規格
                        </button>
                    </div>

                    <div className="space-y-3">
                        {variants.map((variant, idx) => (
                            <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">尺寸/規格</label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full border border-gray-200 rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={variant.size}
                                        onChange={e => handleVariantChange(idx, 'size', e.target.value)}
                                        placeholder="例如: S, M, XL"
                                    />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase">庫存數量</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="block w-full border border-gray-200 rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={variant.stock}
                                        onChange={e => handleVariantChange(idx, 'stock', e.target.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeVariant(idx)}
                                    className="mt-6 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full md:w-auto inline-flex items-center justify-center py-4 px-8 border border-transparent shadow-lg text-lg font-bold rounded-xl text-white bg-black hover:bg-gray-800 transition-all hover:-translate-y-0.5"
                    >
                        {loading ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        {loading ? '處理中...' : '儲存變更'}
                    </button>
                </div>
            </form>
        </div>
    )
}
