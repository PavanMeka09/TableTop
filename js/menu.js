document.getElementById('mobile-menu-button').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
  });

let allMenuItems = [];
let cart = [];

// Fetch menu items and store for search
async function fetchMenuItems() {
    try {
        const response = await fetch('http://localhost/tabletop/backend/menu.php');
        const data = await response.json();
        if (data.status === 'error') {
            alert(data.message);
        } else {
            allMenuItems = data.data;
            renderMenuItems(allMenuItems);
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

// Render menu items dynamically with improved UI and hover
function renderMenuItems(items) {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.innerHTML = '';
    items.forEach(item => {
        const imgUrl = item.image_url;
        const menuItem = document.createElement('div');
        menuItem.className = 'bg-white rounded-xl shadow-md overflow-hidden menu-item border border-gray-100 w-full max-w-xs mx-auto transition-transform duration-300 ease-in-out hover:-translate-y-2';
        menuItem.innerHTML = `
            <div class="h-32 bg-cover bg-center" style="background-image: url('${imgUrl}')"></div>
            <div class="p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="text-lg font-bold mb-1">${item.name}</h3>
                        <p class="text-amber-600 font-semibold text-base">₹${item.price}</p>
                    </div>
                    <button class="add-to-cart text-amber-600 cursor-pointer focus:outline-none rounded-full p-2" title="Add to basket">
                        <i class="fas fa-plus-circle text-2xl"></i>
                    </button>
                </div>
                <p class="text-gray-600 mb-2 text-sm">${item.description}</p>
            </div>
        `;
        // Add event for add-to-cart
        menuItem.querySelector('.add-to-cart').addEventListener('click', () => addToCart(item.id, item.name, item.price));
        menuContainer.appendChild(menuItem);
    });
}

// Add to cart logic
function addToCart(id, name, price) {
    // Ensure id is unique and numeric
    id = Number(id);
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    saveCart();
    updateCartUI();
}

// Remove from cart
function removeFromCart(id) {
    id = Number(id);
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

// Update basket to order summary, add quantity controls, total calculation, and improved search bar
function updateCartUI() {
    const basketItems = document.getElementById('basketItems');
    const basketCount = document.getElementById('basketCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const orderTotal = document.getElementById('orderTotal');
    if (!basketItems || !basketCount || !checkoutBtn || !orderTotal) return;
    if (cart.length === 0) {
        basketItems.innerHTML = '<div class="text-gray-400 text-sm">No items in order</div>';
        orderTotal.textContent = '₹0';
    } else {
        let total = 0;
        basketItems.innerHTML = cart.map(item => {
            total += item.price * item.quantity;
            return `
                <div class="flex justify-between items-center py-2 border-b group gap-2">
                    <span class="font-medium">${item.name}</span>
                    <div class="flex items-center gap-2">
                        <button class="text-amber-600 border border-amber-300 rounded px-2 py-0.5 text-lg font-bold bg-amber-50 hover:bg-amber-100" onclick="window.changeQty(${item.id}, -1)">-</button>
                        <span class="w-6 text-center">${item.quantity}</span>
                        <button class="text-amber-600 border border-amber-300 rounded px-2 py-0.5 text-lg font-bold bg-amber-50 hover:bg-amber-100" onclick="window.changeQty(${item.id}, 1)">+</button>
                        <span class="text-amber-600 font-semibold ml-2">₹${item.price * item.quantity}</span>
                    </div>
                </div>
            `;
        }).join('');
        orderTotal.textContent = `₹${total}`;
    }
    basketCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    checkoutBtn.disabled = cart.length === 0;
    saveCart();
    updateCheckoutBtnState();
}

// Quantity change logic
window.changeQty = function(id, delta) {
    id = Number(id);
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        removeFromCart(id);
    } else {
        saveCart();
        updateCartUI();
    }
};

// Expose removeFromCart globally for inline onclick
window.removeFromCart = removeFromCart;

// Expose addToCart globally for inline onclick
window.addToCart = addToCart;

// Improved search bar clear button
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
if (searchInput && clearSearch) {
    searchInput.addEventListener('input', function() {
        clearSearch.classList.toggle('hidden', !this.value);
        const q = this.value.trim().toLowerCase();
        if (!q) {
            renderMenuItems(allMenuItems);
        } else {
            renderMenuItems(allMenuItems.filter(item =>
                item.name.toLowerCase().includes(q) ||
                (item.description && item.description.toLowerCase().includes(q))
            ));
        }
    });
    clearSearch.addEventListener('click', function() {
        searchInput.value = '';
        clearSearch.classList.add('hidden');
        renderMenuItems(allMenuItems);
        searchInput.focus();
    });
}

// Razorpay integration
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) return resolve();
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        document.body.appendChild(script);
    });
}

// Checkout button logic
document.addEventListener('DOMContentLoaded', function() {
    // Helper: check if address is filled
    function isAddressValid() {
        const addressInput = document.getElementById('addressInput');
        return addressInput && addressInput.value.trim().length > 0;
    }

    // Update checkout button state based on address
    function updateCheckoutBtnState() {
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.disabled = cart.length === 0 || !isAddressValid();
    }

    // Listen for address input changes
    const addressInput = document.getElementById('addressInput');
    if (addressInput) {
        addressInput.addEventListener('input', updateCheckoutBtnState);
    }

    // Patch updateCartUI to also check address
    const _origUpdateCartUI = updateCartUI;
    updateCartUI = function() {
        _origUpdateCartUI();
        updateCheckoutBtnState();
    };

    // Patch checkout logic to send address
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            if (cart.length === 0 || !isAddressValid()) {
                alert('Address is required.');
                return;
            }
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Processing...';
            await loadRazorpayScript();
            const items = cart.map(item => ({ menu_id: item.id, quantity: item.quantity }));
            const address = addressInput.value.trim();
            try {
                // 1. Create Razorpay order on backend
                const orderRes = await fetch('http://localhost/tabletop/backend/payment.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ action: 'create_razorpay_order', items: JSON.stringify(items), address })
                });
                const orderData = await orderRes.json();
                if (orderData.error || !orderData.razorpay_order_id) {
                    alert(orderData.error || 'Failed to initiate payment.');
                    checkoutBtn.disabled = false;
                    checkoutBtn.textContent = 'Checkout';
                    return;
                }
                // 2. Open Razorpay Checkout
                const options = {
                    key: orderData.razorpay_key_id, // Test key
                    amount: orderData.amount,
                    currency: 'INR',
                    name: 'TableTop',
                    description: 'Order Payment',
                    order_id: orderData.razorpay_order_id,
                    handler: async function (response) {
                        // 3. On payment success, notify backend to place order and record payment
                        try {
                            const payRes = await fetch('http://localhost/tabletop/backend/payment.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    action: 'verify_razorpay_payment',
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_signature: response.razorpay_signature,
                                    items: JSON.stringify(items),
                                    address
                                })
                            });
                            const payData = await payRes.json();
                            if (payData.success) {
                                alert('Payment successful! Order placed.', 'success');
                                cart = [];
                                saveCart();
                                updateCartUI();
                                addressInput.value = '';
                            } else {
                                let msg = payData.error || 'Payment verification failed.';
                                if (msg.includes('Failed to place order after payment')) {
                                    msg += '\nIf this keeps happening, please contact support.';
                                }
                                alert(msg);
                            }
                        } catch (err) {
                            alert('Payment verification error.');
                        }
                    },
                    prefill: {},
                    theme: { color: '#ffb300' }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch (error) {
                alert('Failed to initiate payment.');
            }
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Checkout';
        });
    }

    // Initial state
    updateCheckoutBtnState();
});

// Cart persistence
function saveCart() {
    localStorage.setItem('tabletop_cart', JSON.stringify(cart));
}
function loadCart() {
    const c = localStorage.getItem('tabletop_cart');
    cart = c ? JSON.parse(c) : [];
}

// Inline feedback system for payment initiation
function initiatePayment(paymentData) {
    const feedbackElement = document.getElementById('feedbackMessage');
    feedbackElement.textContent = 'Initiating payment...';
    feedbackElement.className = 'text-blue-600';

    fetch('http://localhost/tabletop/backend/payment.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
    })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                feedbackElement.textContent = 'Payment successful! Order placed.';
                feedbackElement.className = 'text-green-600';
            } else {
                feedbackElement.textContent = response.error || 'Failed to initiate payment';
                feedbackElement.className = 'text-red-600';
            }
        })
        .catch(() => {
            feedbackElement.textContent = 'Failed to initiate payment.';
            feedbackElement.className = 'text-red-600';
        });
}

// Helper: check if address is filled
function isAddressValid() {
    const addressInput = document.getElementById('addressInput');
    return addressInput && addressInput.value.trim().length > 0;
}

// Update checkout button state based on address
function updateCheckoutBtnState() {
    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.disabled = cart.length === 0 || !isAddressValid();
}

// Listen for address input changes
const addressInput = document.getElementById('addressInput');
if (addressInput) {
    addressInput.addEventListener('input', updateCheckoutBtnState);
}

// Patch updateCartUI to also check address
const _origUpdateCartUI = updateCartUI;
updateCartUI = function() {
    _origUpdateCartUI();
    updateCheckoutBtnState();
};

// On load
loadCart();
fetchMenuItems();
updateCartUI();