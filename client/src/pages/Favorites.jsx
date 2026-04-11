import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, ShoppingCart, X, ChevronRight, Star, Package, Trash2, Share2
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { mockProducts } from '../data/mockData'
import { useCart } from '../context/CartContext'

export default function Favorites() {
  const { addItem } = useCart()
  const [favorites, setFavorites] = useState(mockProducts.slice(0, 6))

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(item => item._id !== id))
  }

  const handleAddToCart = (product) => {
    addItem({
      _id: product._id,
      name: product.name?.ru || product.name,
      finalPrice: product.finalPrice || product.price,
      images: product.images || []
    })
  }

  return (
    <div className="min-h-screen bg-light-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
        <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-white/70 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Главная</Link>
            <ChevronRight size={14} />
            <span className="text-white font-medium">Избранное</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart size={32} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                Избранное
              </h1>
              <p className="text-white/80 text-lg">
                {favorites.length} {favorites.length === 1 ? 'товар' : favorites.length < 5 ? 'товара' : 'товаров'}
              </p>
            </div>
          </div>

          {favorites.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 bg-white text-primary-600 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all">
                Добавить все в корзину
              </button>
              <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/20 transition-all">
                Поделиться списком
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {favorites.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-6">
                <Heart size={48} className="text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-dark-900 mb-3">Список избранного пуст</h2>
              <p className="text-dark-500 mb-8 max-w-md mx-auto">
                Добавляйте товары в избранное, чтобы не потерять их и быстро оформить заказ позже
              </p>
              <Link
                to="/catalog"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-primary-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all"
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((product) => (
                <div
                  key={product._id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-2"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-light-100 to-primary-50 p-6">
                    {product.hasDiscount && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-secondary to-secondary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        -{product.discountPercent}%
                      </div>
                    )}
                    <button
                      onClick={() => removeFavorite(product._id)}
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-secondary-500 hover:text-white transition-all shadow-lg group/btn"
                    >
                      <X size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>

                    <Link to={`/catalog/${product._id}`} className="block h-full">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name.ru}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={64} className="text-dark-200" />
                        </div>
                      )}
                    </Link>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <Link to={`/catalog/${product._id}`}>
                      <h3 className="font-medium text-dark-900 mb-3 line-clamp-2 hover:text-primary transition-colors">
                        {product.name.ru}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-dark-300'}
                        />
                      ))}
                      <span className="text-dark-500 text-xs ml-1">({product.reviewCount})</span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-dark-900">
                        {product.finalPrice.toLocaleString()}
                      </span>
                      <span className="text-dark-600 text-sm">сум</span>
                      {product.hasDiscount && (
                        <span className="text-sm text-dark-400 line-through ml-auto">
                          {product.price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-primary-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
                      >
                        <ShoppingCart size={18} />
                        В корзину
                      </button>
                      <button className="w-12 h-12 flex items-center justify-center bg-light-100 text-dark-600 rounded-xl hover:bg-primary hover:text-white transition-all">
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {favorites.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-dark-900 mb-2">Вам может понравиться</h2>
                  <p className="text-dark-500">Похожие товары из вашего избранного</p>
                </div>
                <Link to="/catalog" className="text-primary font-bold hover:gap-2 flex items-center gap-1 transition-all">
                  Все товары <ChevronRight size={18} />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockProducts.slice(6, 10).map((product) => (
                  <Link
                    key={product._id}
                    to={`/catalog/${product._id}`}
                    className="group bg-white rounded-xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-square bg-light-50 p-4">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name.ru}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <Package size={48} className="text-dark-200 mx-auto mt-8" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-dark-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.name.ru}
                      </h3>
                      <p className="text-lg font-bold text-dark-900">
                        {product.finalPrice.toLocaleString()} <span className="text-xs text-dark-500">сум</span>
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
