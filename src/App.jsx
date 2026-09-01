import React, { useState } from 'react';
import initialProducts from './data/products.json';

const godmanLogo = "/logo.jpeg";

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'register' or 'login'
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('buyer');

  // Vendor Bank State
  const [vendorBank, setVendorBank] = useState({
    accountNumber: '',
    bankName: '',
    accountName: ''
  });

  const [authForm, setAuthForm] = useState({
    fullName: '',
    brandName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    nin: ''
  });

  // Product Reviews State
  const [reviews, setReviews] = useState({});
  const [newComment, setNewComment] = useState({});

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSizes, setSelectedSizes] = useState({});

  const categories = [
    'All',
    'Fabrics & Custom Apparel',
    'Footwear & Shoes',
    'Bags & Leatherwork',
    'Furniture & Decor',
    'Artworks & Wallframes',
    'Beadwork & Crafts'
  ];

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Fabrics & Custom Apparel',
    price: '',
    image: '',
    description: '',
    sizes: 'Standard, Custom Bespoke'
  });

  const handleAuthInputChange = (e) => {
    const { name, value } = e.target;
    setAuthForm((prev) => ({ ...prev, [name]: value }));
  };

  // REGISTER USER TO BACKEND
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://godman-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authForm, role: selectedRole })
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsAuthOpen(false);
        alert(`Account Created & Saved to Database! Welcome to GODMAN, ${data.user.fullName}`);
      } else {
        alert(data.message || 'Registration failed.');
      }
    } catch (err) {
      // Local Fallback if server isn't reachable during test
      const generatedVendorId = selectedRole === 'vendor' ? `GM-VND-${Math.floor(10000 + Math.random() * 90000)}` : null;
      setUser({
        fullName: authForm.fullName,
        brandName: authForm.brandName,
        email: authForm.email,
        role: selectedRole,
        vendorId: generatedVendorId,
        isVerified: true
      });
      setIsAuthOpen(false);
      alert(`Registered locally! Welcome, ${authForm.fullName}`);
    }
  };

  // LOGIN USER WITH PASSWORD
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password })
      });
      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        setIsAuthOpen(false);
        alert(`Welcome back, ${data.user.fullName}!`);
      } else {
        alert(data.message || 'Invalid email or password.');
      }
    } catch (err) {
      alert('Could not connect to Node server. Starting local session.');
      setUser({ fullName: authForm.email.split('@')[0], email: authForm.email, role: 'buyer' });
      setIsAuthOpen(false);
    }
  };

  const handleSaveBankDetails = (e) => {
    e.preventDefault();
    setUser({ ...user, bankDetails: vendorBank });
    setIsBankModalOpen(false);
    alert('Bank Payout details saved successfully!');
  };

  const handleAddReview = (productId) => {
    if (!user) {
      alert('Security Policy: Only registered members can leave feedback and reviews.');
      setIsAuthOpen(true);
      return;
    }

    const commentText = newComment[productId] || '';
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\.[a-z]{2,})/gi;
    const phonePattern = /(\+?\d{1,4}?[\s-]?\(?\d{1,3}?\)?[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,9})/g;

    if (urlPattern.test(commentText) || phonePattern.test(commentText)) {
      alert('Security Policy Violation: Phone numbers and website links are not permitted in comments.');
      return;
    }

    if (!commentText.trim()) return;

    setReviews((prev) => ({
      ...prev,
      [productId]: [...(prev[productId] || []), { user: user.brandName || user.fullName, text: commentText }]
    }));

    setNewComment({ ...newComment, [productId]: '' });
  };

  const handleSizeChange = (productId, size) => {
    setSelectedSizes({ ...selectedSizes, [productId]: size });
  };

  const addToCart = (product) => {
    const chosenSize = selectedSizes[product.id] || (product.sizes ? product.sizes[0] : 'Standard');
    const cartItemId = `${product.id}-${chosenSize}`;

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prevCart.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, selectedSize: chosenSize, cartItemId, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, amount) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + amount;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!user || user.role !== 'vendor') {
      alert('Only verified Vendor/Merchant profiles can publish items.');
      return;
    }

    const basePrice = Number(newProduct.price);
    const createdProduct = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      price: basePrice,
      image: newProduct.image,
      description: newProduct.description,
      sizes: newProduct.sizes.split(',').map((s) => s.trim()),
      vendorName: user?.brandName || user?.fullName || 'GODMAN Merchant',
      vendorId: user?.vendorId,
      artisan: user?.brandName || user?.fullName
    };

    setProducts([createdProduct, ...products]);
    setIsAddProductOpen(false);
    alert(`Visual Pin Published! Platform commission (15%) will process automatically on order completion.`);

    setNewProduct({
      name: '',
      category: 'Fabrics & Custom Apparel',
      price: '',
      image: '',
      description: '',
      sizes: 'Standard, Custom Bespoke'
    });
  };

  const triggerCheckout = () => {
    if (!user) {
      alert('Security Policy: Only registered users can proceed to checkout.');
      setIsAuthOpen(true);
      return;
    }

    if (totalCartPrice === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!window.PaystackPop) {
      alert('Paystack SDK is loading. Please refresh the page.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: 'pk_test_21b7fbbf9bf4c8cf2c874e3880672efe05af66f9',
      email: user.email,
      amount: totalCartPrice * 100,
      currency: 'NGN',
      callback: async (response) => {
        const bookingCode = `GM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        alert(`Payment Successful! Booking Code: ${bookingCode} (Ref: ${response.reference})`);
        setCart([]);
        setIsCartOpen(false);
      },
      onClose: () => {
        alert('Transaction cancelled.');
      }
    });

    handler.openIframe();
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div style={styles.container}>
      {/* Top Customer Care Bar */}
      <div style={styles.topBar}>
        <span>📞 Customer Support: +234 800 GODMAN | ✉️ quinndaniel100@gmail.com</span>
      </div>

      {/* NAVBAR */}
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <img src={godmanLogo} alt="GODMAN Monogram Logo" style={styles.brandLogoImg} />
          <div>
            <h1 style={styles.brandTitle}>GODMAN</h1>
            <p style={styles.brandMotto}>Elegance by Divine Design • Visual Discovery Marketplace</p>
          </div>
        </div>

        <div style={styles.headerActions}>
          <input
            type="text"
            placeholder="Search art, clothes, furniture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />

          {!user ? (
            <button style={styles.authBtn} onClick={() => setIsAuthOpen(true)}>
              Login / Register
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.userInfo}>
                👤 {user.brandName || user.fullName} 
                <small style={{ color: '#d4af37' }}>
                  ({user.role === 'vendor' ? `Merchant [${user.vendorId || 'GM-VND'}]` : 'Shopper'})
                </small>
              </span>

              {user.role === 'vendor' && (
                <button style={styles.bankBtn} onClick={() => setIsBankModalOpen(true)}>
                  🏦 Bank Details
                </button>
              )}
            </div>
          )}

          {user?.role === 'vendor' && (
            <button style={styles.adminButton} onClick={() => setIsAddProductOpen(true)}>
              + Pin Product
            </button>
          )}

          <button style={styles.cartButton} onClick={() => setIsCartOpen(true)}>
            🛒 Cart ({totalCartCount})
          </button>
        </div>
      </header>

      {/* CATEGORY NAV */}
      <nav style={styles.categoryNav}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.categoryBtn,
              ...(selectedCategory === cat ? styles.activeCategoryBtn : {})
            }}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* MASONRY GRID */}
      <main style={styles.mainContent}>
        <div style={styles.pinGrid}>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} style={styles.pinCard}>
                <div style={styles.imageContainer}>
                  <img src={product.image} alt={product.name} style={styles.pinImage} />
                  <span style={styles.badge}>{product.category}</span>
                </div>
                <div style={styles.pinInfo}>
                  <p style={styles.artisanTag}>By: {product.artisan || product.vendorName || 'GODMAN Merchant'}</p>
                  <h3 style={styles.productName}>{product.name}</h3>
                  <p style={styles.productDesc}>{product.description}</p>

                  {product.sizes && product.sizes.length > 0 && (
                    <div style={styles.sizeContainer}>
                      <label style={styles.sizeLabel}>Select Option / Variant:</label>
                      <select
                        style={styles.sizeSelect}
                        value={selectedSizes[product.id] || product.sizes[0]}
                        onChange={(e) => handleSizeChange(product.id, e.target.value)}
                      >
                        {product.sizes.map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={styles.priceRow}>
                    <span style={styles.priceTag}>₦{product.price?.toLocaleString()}</span>
                    <button style={styles.addBtn} onClick={() => addToCart(product)}>
                      + Save & Buy
                    </button>
                  </div>

                  {/* COMMENTS & REVIEWS SECTION */}
                  <div style={styles.reviewSection}>
                    <h5 style={{ color: '#d4af37', margin: '10px 0 5px 0', fontSize: '0.8rem' }}>Customer Reviews:</h5>
                    <div style={styles.reviewList}>
                      {(reviews[product.id] || []).length > 0 ? (
                        reviews[product.id].map((rev, idx) => (
                          <p key={idx} style={styles.reviewText}>
                            <strong>{rev.user}:</strong> {rev.text}
                          </p>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.72rem', color: '#666', margin: '2px 0' }}>No reviews yet. Registered buyers can leave feedback below.</p>
                      )}
                    </div>
                    <div style={styles.commentInputRow}>
                      <input
                        type="text"
                        placeholder={user ? "Add review (No links/phones)..." : "Login required to review..."}
                        style={styles.commentInput}
                        value={newComment[product.id] || ''}
                        onChange={(e) => setNewComment({ ...newComment, [product.id]: e.target.value })}
                      />
                      <button style={styles.commentBtn} onClick={() => handleAddReview(product.id)}>Post</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.noResults}>No visual pins found in this section.</p>
          )}
        </div>
      </main>

      {/* AUTHENTICATION MODAL (REGISTER & LOGIN WITH PASSWORD) */}
      {isAuthOpen && (
        <div style={styles.cartOverlay} onClick={() => setIsAuthOpen(false)}>
          <div style={styles.adminModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h2>GODMAN Account Portal</h2>
              <button style={styles.closeBtn} onClick={() => setIsAuthOpen(false)}>✕</button>
            </div>

            {/* Toggle Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                type="button"
                style={{ ...styles.categoryBtn, flex: 1, backgroundColor: authMode === 'register' ? '#d4af37' : '#1a1a1a', color: authMode === 'register' ? '#000' : '#fff' }}
                onClick={() => setAuthMode('register')}
              >
                Create Account
              </button>
              <button
                type="button"
                style={{ ...styles.categoryBtn, flex: 1, backgroundColor: authMode === 'login' ? '#d4af37' : '#1a1a1a', color: authMode === 'login' ? '#000' : '#fff' }}
                onClick={() => setAuthMode('login')}
              >
                Log In
              </button>
            </div>

            {authMode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} style={styles.adminForm}>
                <label style={{ color: '#d4af37', fontSize: '0.85rem' }}>Select Account Type:</label>
                <select style={styles.formInput} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="buyer">Buyer / Customer Account</option>
                  <option value="vendor">Vendor / Merchant Profile</option>
                </select>

                <input type="text" name="fullName" placeholder="Full Name" required style={styles.formInput} value={authForm.fullName} onChange={handleAuthInputChange} />
                <input type="text" name="brandName" placeholder={selectedRole === 'vendor' ? "Brand Name" : "Display Name"} required style={styles.formInput} value={authForm.brandName} onChange={handleAuthInputChange} />
                <input type="email" name="email" placeholder="Email Address" required style={styles.formInput} value={authForm.email} onChange={handleAuthInputChange} />
                <input type="tel" name="phone" placeholder="Phone Number" required style={styles.formInput} value={authForm.phone} onChange={handleAuthInputChange} />
                <input type="password" name="password" placeholder="Create Password" required style={styles.formInput} value={authForm.password} onChange={handleAuthInputChange} />
                <input type="text" name="address" placeholder={selectedRole === 'vendor' ? "Business Address" : "Home Address"} required style={styles.formInput} value={authForm.address} onChange={handleAuthInputChange} />

                {selectedRole === 'vendor' && (
                  <input type="text" name="nin" placeholder="National Identification Number (NIN)" required style={styles.formInput} value={authForm.nin} onChange={handleAuthInputChange} />
                )}

                <button type="submit" style={styles.checkoutBtn}>Create & Save Account</button>
              </form>
            ) : (
              <form onSubmit={handleLoginSubmit} style={styles.adminForm}>
                <input type="email" name="email" placeholder="Email Address" required style={styles.formInput} value={authForm.email} onChange={handleAuthInputChange} />
                <input type="password" name="password" placeholder="Enter Password" required style={styles.formInput} value={authForm.password} onChange={handleAuthInputChange} />
                <button type="submit" style={styles.checkoutBtn}>Log In to Profile</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VENDOR BANK DETAILS MODAL */}
      {isBankModalOpen && (
        <div style={styles.cartOverlay} onClick={() => setIsBankModalOpen(false)}>
          <div style={styles.adminModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h2>Merchant Payout Bank Details</h2>
              <button style={styles.closeBtn} onClick={() => setIsBankModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveBankDetails} style={styles.adminForm}>
              <input type="text" placeholder="Account Holder Name" required style={styles.formInput} value={vendorBank.accountName} onChange={(e) => setVendorBank({ ...vendorBank, accountName: e.target.value })} />
              <input type="text" placeholder="10-Digit Account Number" maxLength="10" required style={styles.formInput} value={vendorBank.accountNumber} onChange={(e) => setVendorBank({ ...vendorBank, accountNumber: e.target.value })} />
              <input type="text" placeholder="Bank Name (e.g., GTBank, Zenith)" required style={styles.formInput} value={vendorBank.bankName} onChange={(e) => setVendorBank({ ...vendorBank, bankName: e.target.value })} />
              <button type="submit" style={styles.checkoutBtn}>Save Bank Info</button>
            </form>
          </div>
        </div>
      )}

      {/* VENDOR ADD PRODUCT MODAL */}
      {isAddProductOpen && (
        <div style={styles.cartOverlay} onClick={() => setIsAddProductOpen(false)}>
          <div style={styles.adminModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h2>GODMAN Merchant Upload</h2>
              <button style={styles.closeBtn} onClick={() => setIsAddProductOpen(false)}>✕</button>
            </div>

            <div style={styles.commissionBanner}>
              ℹ️ <strong>Automated Payout:</strong> GODMAN receives a <strong>15% Platform Commission</strong> per order.
            </div>

            <form onSubmit={handleAddProduct} style={styles.adminForm}>
              <input type="text" placeholder="Product Title" required style={styles.formInput} value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              <select style={styles.formInput} value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input type="number" placeholder="Price in Naira (₦)" required style={styles.formInput} value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              <input type="url" placeholder="High-Res Image URL" required style={styles.formInput} value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
              <textarea placeholder="Item Details & Description" required style={{ ...styles.formInput, height: '70px' }} value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} />
              <input type="text" placeholder="Available Options / Sizes (Comma-separated)" style={styles.formInput} value={newProduct.sizes} onChange={(e) => setNewProduct({ ...newProduct, sizes: e.target.value })} />
              <button type="submit" style={styles.checkoutBtn}>+ Publish Visual Pin</button>
            </form>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <div style={styles.cartOverlay} onClick={() => setIsCartOpen(false)}>
          <div style={styles.cartModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.cartHeader}>
              <h2>Your Saved Cart</h2>
              <button style={styles.closeBtn} onClick={() => setIsCartOpen(false)}>✕</button>
            </div>

            <div style={styles.cartBody}>
              {cart.length === 0 ? (
                <p style={styles.emptyCart}>Your cart is currently empty.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} style={styles.cartItem}>
                    <img src={item.image} alt={item.name} style={styles.cartThumb} />
                    <div style={styles.cartItemInfo}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{item.name}</h4>
                      <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#aaa' }}>
                        Option: <span style={{ color: '#d4af37' }}>{item.selectedSize}</span>
                      </p>
                      <p style={styles.goldText}>₦{item.price?.toLocaleString()}</p>
                      <div style={styles.qtyControls}>
                        <button onClick={() => updateQuantity(item.cartItemId, -1)} style={styles.qtyBtn}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.cartItemId, 1)} style={styles.qtyBtn}>+</button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.cartItemId)} style={styles.removeBtn}>🗑️</button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={styles.cartFooter}>
                <div style={styles.totalRow}>
                  <span>Total Amount:</span>
                  <span style={styles.goldText}>₦{totalCartPrice.toLocaleString()}</span>
                </div>
                <button style={styles.checkoutBtn} onClick={triggerCheckout}>
                  Pay Now with Paystack / Bank Card
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© 2026 <strong>GODMAN</strong>. All Rights Reserved.</p>
        <p style={{ fontSize: '0.85rem', color: '#888' }}>
          Customer Service: +234 800 GODMAN | quinndaniel100@gmail.com
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0d0d0d', color: '#f5f5f5', minHeight: '100vh', fontFamily: "'Playfair Display', Georgia, serif" },
  topBar: { backgroundColor: '#000', color: '#d4af37', padding: '6px 20px', textAlign: 'center', fontSize: '0.8rem', borderBottom: '1px solid #222' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', borderBottom: '1px solid #2a2a2a', backgroundColor: '#121212', flexWrap: 'wrap', gap: '20px' },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '15px' },
  brandLogoImg: { width: '55px', height: '55px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #d4af37', backgroundColor: '#000' },
  brandTitle: { margin: 0, fontSize: '1.6rem', letterSpacing: '2px', color: '#ffffff' },
  brandMotto: { margin: 0, fontSize: '0.8rem', color: '#d4af37', fontStyle: 'italic' },
  goldText: { color: '#d4af37' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  searchInput: { padding: '9px 14px', borderRadius: '20px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', outline: 'none', width: '200px' },
  authBtn: { backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #444', padding: '8px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem' },
  bankBtn: { backgroundColor: '#1a1a1a', color: '#d4af37', border: '1px solid #d4af37', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', fontSize: '0.78rem' },
  userInfo: { fontSize: '0.85rem', color: '#eee' },
  adminButton: { backgroundColor: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  cartButton: { backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '8px 18px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' },
  categoryNav: { display: 'flex', justifyContent: 'center', gap: '12px', padding: '20px 10px', flexWrap: 'wrap', borderBottom: '1px solid #1f1f1f' },
  categoryBtn: { backgroundColor: '#1a1a1a', color: '#ccc', border: '1px solid #333', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem' },
  activeCategoryBtn: { backgroundColor: '#d4af37', color: '#000', borderColor: '#d4af37', fontWeight: 'bold' },
  mainContent: { maxWidth: '1300px', margin: '0 auto', padding: '20px' },
  pinGrid: { columnCount: 3, columnGap: '20px' },
  pinCard: { backgroundColor: '#141414', borderRadius: '16px', overflow: 'hidden', border: '1px solid #262626', marginBottom: '20px', breakInside: 'avoid', display: 'inline-block', width: '100%' },
  imageContainer: { position: 'relative' },
  pinImage: { width: '100%', display: 'block', borderRadius: '16px 16px 0 0', objectFit: 'cover' },
  badge: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.85)', color: '#d4af37', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid #d4af37' },
  pinInfo: { padding: '16px' },
  artisanTag: { margin: '0 0 5px 0', fontSize: '0.75rem', color: '#d4af37', fontWeight: 'bold' },
  productName: { fontSize: '1.05rem', margin: '0 0 8px 0', color: '#fff' },
  productDesc: { fontSize: '0.82rem', color: '#888', marginBottom: '12px' },
  sizeContainer: { marginBottom: '12px' },
  sizeLabel: { display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '4px' },
  sizeSelect: { width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1a1a1a', color: '#d4af37', border: '1px solid #333', outline: 'none' },
  priceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
  priceTag: { fontSize: '1.1rem', fontWeight: 'bold', color: '#d4af37' },
  addBtn: { backgroundColor: 'transparent', color: '#d4af37', border: '1px solid #d4af37', padding: '7px 12px', borderRadius: '16px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' },
  reviewSection: { marginTop: '15px', borderTop: '1px solid #222', paddingTop: '10px' },
  reviewList: { maxHeight: '80px', overflowY: 'auto', marginBottom: '8px' },
  reviewText: { fontSize: '0.75rem', color: '#bbb', margin: '3px 0' },
  commentInputRow: { display: 'flex', gap: '6px' },
  commentInput: { flexGrow: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '0.75rem' },
  commentBtn: { backgroundColor: '#d4af37', border: 'none', borderRadius: '4px', padding: '0 10px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' },
  noResults: { columnSpan: 'all', textAlign: 'center', color: '#888', padding: '40px' },
  cartOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  cartModal: { position: 'fixed', right: 0, top: 0, width: '100%', maxWidth: '400px', backgroundColor: '#121212', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', boxShadow: '-5px 0 25px rgba(0,0,0,0.5)' },
  adminModal: { width: '90%', maxWidth: '480px', backgroundColor: '#121212', borderRadius: '12px', border: '1px solid #333', padding: '25px' },
  commissionBanner: { backgroundColor: '#1a180e', border: '1px solid #d4af37', color: '#d4af37', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', marginTop: '12px' },
  adminForm: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  formInput: { padding: '10px 12px', borderRadius: '6px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', outline: 'none' },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #262626', paddingBottom: '12px' },
  closeBtn: { backgroundColor: 'transparent', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' },
  cartBody: { flexGrow: 1, overflowY: 'auto', padding: '15px 0' },
  emptyCart: { color: '#777', textAlign: 'center', marginTop: '40px' },
  cartItem: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '8px' },
  cartThumb: { width: '55px', height: '55px', objectFit: 'cover', borderRadius: '6px' },
  cartItemInfo: { flexGrow: 1 },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' },
  qtyBtn: { backgroundColor: '#262626', color: '#fff', border: 'none', width: '22px', height: '22px', borderRadius: '4px', cursor: 'pointer' },
  removeBtn: { backgroundColor: 'transparent', border: 'none', cursor: 'pointer' },
  cartFooter: { borderTop: '1px solid #262626', paddingTop: '15px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '15px' },
  checkoutBtn: { width: '100%', backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem', cursor: 'pointer' },
  footer: { textAlign: 'center', padding: '30px', borderTop: '1px solid #222', backgroundColor: '#0a0a0a', color: '#666', marginTop: '40px' }
};