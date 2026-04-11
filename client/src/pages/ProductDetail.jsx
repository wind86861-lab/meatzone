import { useState, useEffect } from 'react'
import { Minus, Plus, Package, X, ShoppingCart, Check, Star, Heart, Share2, Truck, Shield, ChevronRight } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { mockAPI, mockReviews } from '../data/mockData'

export default function ProductDetail() {
  const { addItem } = useCart()
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [similarProducts, setSimilarProducts] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      setLoading(true)
      mockAPI.products.getById(id).then(res => {
        setProduct(res.data)
        setSelectedImage(0)
        setLoading(false)
      }).catch(() => setLoading(false))

      mockAPI.products.getAll({ limit: 20 }).then(res => {
        const all = (res.data?.products || []).filter(p => p._id !== id)
        setSimilarProducts(all.sort(() => Math.random() - 0.5).slice(0, 4))
      })
    }
  }, [id])

  const handleAddToCart = () => {
    addItem({ _id: product._id, name: product.name.ru, finalPrice: product.finalPrice, images: product.images })
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2500)
  }

  if (loading || !product) return (
    <div className="min-h-screen bg-light-50">
      <Header />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-dark-200 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-96 bg-dark-200 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-12 bg-dark-200 rounded-xl"></div>
              <div className="h-8 bg-dark-200 rounded-xl w-2/3"></div>
              <div className="h-32 bg-dark-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-dark-100">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-dark-500">
            <Link to="/" className="hover:text-primary transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <Link to="/catalog" className="hover:text-primary transition-colors">Каталог</Link>
            <ChevronRight size={14} />
            <span className="text-dark-900 font-medium">{product.name.ru}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Left: Image Gallery */}
          <div className="space-y-4">
            <div className="relative bg-white border border-dark-200 rounded-2xl p-8 aspect-square flex items-center justify-center group overflow-hidden">
              {product.hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-accent-orange to-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  -{product.discountPercent}%
                </div>
              )}
              {product.isNew && (
                <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-primary to-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  NEW
                </div>
              )}
              {product.images?.[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name.ru}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <Package size={120} className="text-dark-200" />
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${selectedImage === idx
                      ? 'border-primary shadow-lg scale-105'
                      : 'border-dark-200 hover:border-primary/50'
                      }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            <h1 className="font-heading text-3xl md:text-4xl text-dark-900 font-bold mb-4">
              {product.name.ru}
            </h1>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-300'}
                  />
                ))}
              </div>
              <span className="text-dark-600 text-sm">
                {product.rating.toFixed(1)} ({product.reviewCount} отзывов)
              </span>
              {product.inStock && (
                <span className="text-accent-green text-sm font-medium flex items-center gap-1">
                  <Check size={16} /> В наличии
                </span>
              )}
            </div>

            {/* Price */}
            <div className="bg-light-50 border border-dark-200 rounded-2xl p-6 mb-6">
              <div className="flex items-baseline gap-4 mb-2">
                <span className="font-heading text-4xl text-dark-900 font-bold">
                  {product.finalPrice.toLocaleString()} сум
                </span>
                {product.hasDiscount && (
                  <span className="text-xl text-dark-400 line-through">
                    {product.price.toLocaleString()} сум
                  </span>
                )}
              </div>
              {product.hasDiscount && (
                <p className="text-accent-green text-sm font-medium">
                  Вы экономите {(product.price - product.finalPrice).toLocaleString()} сум
                </p>
              )}
            </div>

            {/* Quick Specs */}
            {product.specifications?.length > 0 && (
              <div className="bg-white border border-dark-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-dark-900 mb-4">Основные характеристики</h3>
                <div className="space-y-3">
                  {product.specifications.map((spec, i) => (
                    <div key={i} className="flex justify-between text-sm border-b border-dark-100 pb-2 last:border-0">
                      <span className="text-dark-600">{spec.label.ru}</span>
                      <span className="font-medium text-dark-900">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-dark-700 font-medium">Количество:</span>
                <div className="flex items-center border-2 border-dark-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-dark-700 hover:bg-light-50 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-x-2 border-dark-300 py-3 font-bold text-dark-900 focus:outline-none"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 flex items-center justify-center text-dark-700 hover:bg-light-50 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${addedToCart
                  ? 'bg-accent-green text-white'
                  : 'bg-gradient-to-r from-primary to-primary-600 text-white hover:shadow-hover hover:scale-[1.02] active:scale-[0.98]'
                  }`}
              >
                {addedToCart ? (
                  <><Check size={20} /> Добавлено в корзину</>
                ) : (
                  <><ShoppingCart size={20} /> Добавить в корзину</>
                )}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 border-2 border-dark-300 rounded-xl text-dark-700 font-medium hover:border-primary hover:text-primary transition-colors">
                  <Heart size={20} /> В избранное
                </button>
                <button className="flex items-center justify-center gap-2 py-3 border-2 border-dark-300 rounded-xl text-dark-700 font-medium hover:border-primary hover:text-primary transition-colors">
                  <Share2 size={20} /> Поделиться
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-light-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Truck size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-dark-900 font-bold text-sm">Быстрая доставка</p>
                  <p className="text-dark-500 text-xs">За 24 часа</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-light-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-accent-green/10 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-accent-green" />
                </div>
                <div>
                  <p className="text-dark-900 font-bold text-sm">Гарантия качества</p>
                  <p className="text-dark-500 text-xs">Официальная</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-dark-900 mb-4">Описание</h2>
          <div className="prose max-w-none">
            <p className="text-dark-700 leading-relaxed">
              {product.description?.ru || 'Описание товара будет добавлено позже.'}
            </p>
          </div>
        </div>

        {/* Specifications */}
        {product.specifications && product.specifications.length > 0 && (
          <div className="bg-white rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold text-dark-900 mb-6">Характеристики</h2>
            <div className="space-y-3">
              {product.specifications.map((spec, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-dark-100 last:border-0">
                  <span className="text-dark-600 font-medium">{spec.label.ru}</span>
                  <span className="text-dark-900 font-bold">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mb-12">
            <h2 className="font-heading text-3xl text-dark-900 font-bold mb-8">Похожие товары</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {similarProducts.map((sim) => (
                <Link
                  key={sim._id}
                  to={`/catalog/${sim._id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group bg-white border border-dark-200 rounded-2xl overflow-hidden hover:shadow-hover hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-light-50 flex items-center justify-center p-4">
                    {sim.hasDiscount && (
                      <div className="absolute top-2 left-2 bg-accent-orange text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{sim.discountPercent}%
                      </div>
                    )}
                    {sim.images?.[0] ? (
                      <img
                        src={sim.images[0]}
                        alt={sim.name.ru}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <Package size={64} className="text-dark-200" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-dark-900 text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {sim.name.ru}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < Math.floor(sim.rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-300'}
                        />
                      ))}
                      <span className="text-dark-500 text-xs ml-1">({sim.reviewCount})</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-dark-900">{sim.finalPrice.toLocaleString()} сум</span>
                      {sim.hasDiscount && (
                        <span className="text-xs text-dark-400 line-through">{sim.price.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
