// Menu functionality

let allMenuItems = [];
let cart = [];

// Fetch menu items and store for search
async function fetchMenuItems() {
    try {
        const response = await fetch('../backend/menu.php');
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
        const menuItem = document.createElement('div');
        menuItem.className = 'bg-white rounded-xl shadow-md overflow-hidden menu-item transition-transform duration-200 hover:shadow-xl hover:-translate-y-1';
        menuItem.innerHTML = `
            <div class="h-48 bg-cover bg-center transition-transform duration-200 hover:scale-105" style="background-image: url('${item.image_url || 'https://via.placeholder.com/150'}')"></div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold mb-2">${item.name}</h3>
                        <p class="text-amber-600 font-semibold text-lg">₹${item.price}</p>
                    </div>
                    <button class="add-to-cart text-amber-600 hover:text-white hover:bg-amber-600 focus:outline-none rounded-full p-2 transition-colors duration-200" title="Add to basket">
                        <i class="fas fa-plus-circle text-3xl"></i>
                    </button>
                </div>
                <p class="text-gray-600 mb-4">${item.description}</p>
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

// Update cart/basket UI
function updateCartUI() {
    const basketItems = document.getElementById('basketItems');
    const basketCount = document.getElementById('basketCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (!basketItems || !basketCount || !checkoutBtn) return;
    basketItems.innerHTML = cart.length === 0 ? '<div class="text-gray-400 text-sm">No items in basket</div>' :
        cart.map(item => `
            <div class="flex justify-between items-center py-2 border-b group">
                <span>${item.name} <span class="text-xs text-gray-500">(${item.quantity}x)</span></span>
                <div class="flex items-center gap-2">
                    <span class="text-amber-600 font-semibold">₹${item.price * item.quantity}</span>
                    <button class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200" title="Remove" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    basketCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    checkoutBtn.disabled = cart.length === 0;
    saveCart();
}

// Expose removeFromCart globally for inline onclick
window.removeFromCart = removeFromCart;

// Expose addToCart globally for inline onclick
window.addToCart = addToCart;

// Search bar logic
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', function() {
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
}

// Checkout button logic
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async function() {
        if (cart.length === 0) return;
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Placing order...';
        const items = cart.map(item => ({ menu_id: item.id, quantity: item.quantity }));
        try {
            const response = await fetch('../backend/order.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ action: 'place_order', items: JSON.stringify(items) })
            });
            const data = await response.json();
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                showToast('Order placed successfully!', 'success');
                cart = [];
                saveCart();
                updateCartUI();
            }
        } catch (error) {
            showToast('Failed to place order.', 'error');
        }
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Checkout';
    });
}

// Cart persistence
function saveCart() {
    localStorage.setItem('tabletop_cart', JSON.stringify(cart));
}
function loadCart() {
    const c = localStorage.getItem('tabletop_cart');
    cart = c ? JSON.parse(c) : [];
}

// User-friendly toast feedback
function showToast(msg, type = 'info') {
    let toast = document.createElement('div');
    toast.className = `fixed bottom-8 right-8 z-50 px-6 py-3 rounded shadow-lg text-white font-semibold ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-amber-600'}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

// On load
loadCart();
fetchMenuItems();
updateCartUI();