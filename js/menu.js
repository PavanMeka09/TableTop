// Toggle mobile menu
const mobileMenuBtn = document.getElementById('mobile-menu-button');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) mobileMenu.classList.toggle('hidden');
    });
}

let menuItems = [];
let cart = [];

// Fetch menu items from backend
async function getMenu() {
    try {
        const res = await fetch('http://localhost/tabletop/backend/menu.php');
        const data = await res.json();
        if (data.status === 'error') alert(data.message);
        else {
            menuItems = data.data;
            showMenu(menuItems);
        }
    } catch (e) {
        console.error('Menu fetch error:', e);
    }
}

// Render menu
function showMenu(items) {
    const menuDiv = document.getElementById('menuItems');
    if (!menuDiv) return;
    menuDiv.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-xl shadow-md overflow-hidden menu-item border border-gray-100 w-full max-w-xs mx-auto transition-transform duration-300 ease-in-out hover:-translate-y-2';
        div.innerHTML = `
            <div class="h-32 bg-cover bg-center" style="background-image: url('${item.image_url}')"></div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-lg font-bold mb-1">${item.name}</h3>
                        <p class="text-amber-600 font-semibold text-base">₹${item.price}</p>
                    </div>
                    <button class="add-cart text-amber-600 cursor-pointer focus:outline-none rounded-full p-2" title="Add to basket">
                        <i class="fas fa-plus-circle text-2xl"></i>
                    </button>
                </div>
                <p class="text-gray-600 mb-2 text-sm">${item.description}</p>
            </div>
        `;
        div.querySelector('.add-cart').addEventListener('click', () => addCart(item));
        menuDiv.appendChild(div);
    });
}

// Add item to cart
function addCart(item) {
    const found = cart.find(i => i.id === Number(item.id));
    if (found) found.qty++;
    else cart.push({ id: Number(item.id), name: item.name, price: item.price, qty: 1 });
    saveCart();
    showCart();
}

// Remove item from cart
function removeCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    showCart();
}

// Change quantity
function changeQty(id, d) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += d;
    if (item.qty <= 0) removeCart(id);
    else {
        saveCart();
        showCart();
    }
}

// Render cart
function showCart() {
    const basket = document.getElementById('basketItems');
    const count = document.getElementById('basketCount');
    const total = document.getElementById('orderTotal');
    const checkout = document.getElementById('checkoutBtn');
    if (!basket || !count || !total || !checkout) return;
    if (!cart.length) {
        basket.innerHTML = '<div class="text-gray-400 text-sm">No items in order</div>';
        total.textContent = '₹0';
    } else {
        let sum = 0;
        basket.innerHTML = '';
        cart.forEach(item => {
            sum += item.price * item.qty;
            const row = document.createElement('div');
            row.className = 'flex justify-between items-center py-2 border-b gap-2';
            row.innerHTML = `
                <span class="font-medium">${item.name}</span>
                <div class="flex items-center gap-2">
                    <button class="qty-btn bg-yellow-200 p-2 cursor-pointer border-[1px] rounded" data-id="${item.id}" data-d="-1">-</button>
                    <span class="w-6 text-center">${item.qty}</span>
                    <button class="qty-btn bg-yellow-200 p-2 cursor-pointer border-[1px] rounded" data-id="${item.id}" data-d="1">+</button>
                    <span class="text-amber-600 font-semibold ml-2">₹${item.price * item.qty}</span>
                </div>
            `;
            basket.appendChild(row);
        });
        total.textContent = `₹${sum}`;
    }
    count.textContent = cart.reduce((s, i) => s + i.qty, 0);
    checkout.disabled = !cart.length || !validAddress();
    // Attach qty change events
    basket.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => changeQty(Number(btn.dataset.id), Number(btn.dataset.d)));
    });
}

// Save/load cart
function saveCart() {
    localStorage.setItem('tabletop_cart', JSON.stringify(cart));
}
function loadCart() {
    const c = localStorage.getItem('tabletop_cart');
    cart = c ? JSON.parse(c) : [];
}

// Address validation
function validAddress() {
    const addr = document.getElementById('addressInput');
    return addr && addr.value.trim().length > 0;
}

// Search
const search = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearSearch');
if (search && clearBtn) {
    search.addEventListener('input', function() {
        clearBtn.classList.toggle('hidden', !this.value);
        const q = this.value.trim().toLowerCase();
        showMenu(!q ? menuItems : menuItems.filter(i => i.name.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q))));
    });
    clearBtn.addEventListener('click', function() {
        search.value = '';
        clearBtn.classList.add('hidden');
        showMenu(menuItems);
        search.focus();
    });
}

// Razorpay script loader
function loadRazorpay() {
    return new Promise(res => {
        if (document.getElementById('razorpay-script')) return res();
        const s = document.createElement('script');
        s.id = 'razorpay-script';
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = res;
        document.body.appendChild(s);
    });
}

// Checkout
const checkoutBtn = document.getElementById('checkoutBtn');
const addressInput = document.getElementById('addressInput');
if (checkoutBtn && addressInput) {
    addressInput.addEventListener('input', () => {
        checkoutBtn.disabled = !cart.length || !validAddress();
    });
    checkoutBtn.addEventListener('click', async e => {
        e.preventDefault();
        if (!cart.length || !validAddress()) {
            alert('Address is required.');
            return;
        }
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';
        await loadRazorpay();
        const items = cart.map(i => ({ menu_id: i.id, quantity: i.qty }));
        const address = addressInput.value.trim();
        try {
            const orderRes = await fetch('http://localhost/tabletop/backend/payment.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'create_razorpay_order', items: JSON.stringify(items), address })
            });
            const orderData = await orderRes.json();
            if (orderData.error || !orderData.razorpay_order_id) throw new Error(orderData.error || 'Failed to initiate payment.');
            const options = {
                key: orderData.razorpay_key_id,
                amount: orderData.amount,
                currency: 'INR',
                name: 'TableTop',
                description: 'Order Payment',
                order_id: orderData.razorpay_order_id,
                handler: async function (resp) {
                    try {
                        const payRes = await fetch('http://localhost/tabletop/backend/payment.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: new URLSearchParams({
                                action: 'verify_razorpay_payment',
                                razorpay_payment_id: resp.razorpay_payment_id,
                                razorpay_order_id: resp.razorpay_order_id,
                                razorpay_signature: resp.razorpay_signature,
                                items: JSON.stringify(items),
                                address
                            })
                        });
                        const payData = await payRes.json();
                        if (payData.success) {
                            alert('Payment successful! Order placed.');
                            cart = [];
                            saveCart();
                            showCart();
                            addressInput.value = '';
                        } else {
                            alert(payData.error || 'Payment verification failed.');
                        }
                    } catch {
                        alert('Payment verification error.');
                    }
                },
                prefill: {},
                theme: { color: '#ffb300' }
            };
            new window.Razorpay(options).open();
        } catch (err) {
            alert(err.message || 'Failed to initiate payment.');
        }
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Checkout';
    });
}

// Init
loadCart();
getMenu();
showCart();