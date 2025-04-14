// Order functionality

// Place an order
async function placeOrder(items) {
    try {
        const response = await fetch('../backend/order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'place_order', items: JSON.stringify(items) })
        });
        const data = await response.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert('Order placed successfully!');
            console.log(data); // Replace with redirect or UI update
        }
    } catch (error) {
        console.error('Error placing order:', error);
    }
}

// Add item to cart
let cart = [];
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }
    updateCartUI();
}

// Update cart UI
function updateCartUI() {
    const basketItems = document.getElementById('basketItems');
    const basketCount = document.getElementById('basketCount');
    const continueBtn = document.getElementById('continueBtn');

    basketItems.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center py-2 border-b">
            <span>${item.name} (${item.quantity}x)</span>
            <span class="text-amber-600 font-semibold">₹${item.price * item.quantity}</span>
        </div>
    `).join('');

    basketCount.textContent = cart.length;
    continueBtn.disabled = cart.length === 0;
}

// Example usage
// placeOrder([{ menu_id: 1, quantity: 2 }, { menu_id: 2, quantity: 1 }]);