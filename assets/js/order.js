// Order functionality

// Place an order
async function placeOrder(items) {
    if (!Array.isArray(items) || items.length === 0) {
        console.error('No items to order.');
        return;
    }
    const btn = document.getElementById('placeOrderBtn');
    const feedbackElement = document.getElementById('feedbackMessage');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Placing...';
    }
    feedbackElement.textContent = 'Placing order...';
    feedbackElement.className = 'text-blue-600';
    try {
        const response = await fetch('../backend/order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ action: 'place_order', items: JSON.stringify(items) })
        });
        const data = await response.json();
        if (data.error) {
            console.error(data.error);
            feedbackElement.textContent = data.error || 'Failed to place order';
            feedbackElement.className = 'text-red-600';
        } else {
            console.log('Order placed successfully!');
            feedbackElement.textContent = 'Order placed successfully!';
            feedbackElement.className = 'text-green-600';
            // Optionally redirect or update UI
        }
    } catch (error) {
        console.error('Error placing order.');
        feedbackElement.textContent = 'Error placing order.';
        feedbackElement.className = 'text-red-600';
    }
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Place Order';
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

// Add feedback modal
function showFeedbackModal(orderId) {
    const modalHtml = `
        <div id="feedbackModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 class="text-lg font-bold mb-4">Give Feedback</h3>
                <form id="feedbackForm">
                    <input type="hidden" name="order_id" value="${orderId}">
                    <div class="mb-4">
                        <label for="rating" class="block text-sm font-medium">Rating (1-5)</label>
                        <input type="number" id="rating" name="rating" min="1" max="5" class="w-full border rounded p-2">
                    </div>
                    <div class="mb-4">
                        <label for="message" class="block text-sm font-medium">Message (optional)</label>
                        <textarea id="message" name="message" rows="3" class="w-full border rounded p-2"></textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" onclick="closeFeedbackModal()" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-amber-600 text-white rounded">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('feedbackForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const orderId = document.getElementById('orderId').value;
        const message = document.getElementById('message').value;
        const rating = document.getElementById('rating').value;

        try {
            const response = await fetch('/backend/feedback.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'create_feedback',
                    order_id: orderId,
                    message: message,
                    rating: rating,
                }),
            });

            const result = await response.json();

            if (result.error) {
                if (result.prompt) {
                    if (confirm(result.prompt)) {
                        // Logic to handle updating feedback can be added here
                        alert('Redirecting to update feedback...');
                    }
                } else {
                    alert(result.error);
                }
            } else {
                alert(result.success);
            }
        } catch (error) {
            console.error('Error submitting feedback:', error);
            alert('An error occurred while submitting feedback.');
        }
    });
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.remove();
}

// Check if feedback has already been given for the order
async function checkFeedbackStatus(orderId) {
    try {
        const response = await fetch(`/backend/feedback.php?action=get_feedback_status&order_id=${orderId}`);
        const result = await response.json();

        if (result.feedbackExists) {
            const feedbackTag = document.createElement('span');
            feedbackTag.textContent = 'Feedback has been submitted';
            feedbackTag.className = 'feedback-tag';
            document.getElementById(`feedbackFormContainer-${orderId}`).replaceWith(feedbackTag);
        }
    } catch (error) {
        console.error('Error checking feedback status:', error);
    }
}

// Ensure feedback status is checked for each order
function initializeFeedbackChecks(orderIds) {
    orderIds.forEach(orderId => {
        checkFeedbackStatus(orderId);
    });
}

// Automatically check feedback status for all orders on page load
document.addEventListener('DOMContentLoaded', () => {
    const orderIds = [23]; // Replace with dynamic order IDs if available
    initializeFeedbackChecks(orderIds);
});

// Call this function for each order to check feedback status
// Example: checkFeedbackStatus(orderId);

// Example usage: initializeFeedbackChecks([23, 24, 25]);

// Example usage
// placeOrder([{ menu_id: 1, quantity: 2 }, { menu_id: 2, quantity: 1 }]);