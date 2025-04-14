// Menu functionality

// Fetch menu items
async function fetchMenuItems() {
    try {
        const response = await fetch('../backend/menu.php');
        const data = await response.json();
        if (data.status === 'error') {
            alert(data.message);
        } else {
            renderMenuItems(data.data);
        }
    } catch (error) {
        console.error('Error fetching menu items:', error);
    }
}

// Render menu items dynamically
function renderMenuItems(items) {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.innerHTML = '';
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'bg-white rounded-xl shadow-md overflow-hidden menu-item';
        menuItem.innerHTML = `
            <div class="h-48 bg-cover bg-center" style="background-image: url('${item.image_url || 'https://via.placeholder.com/150'}')"></div>
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold mb-2">${item.name}</h3>
                        <p class="text-amber-600 font-semibold text-lg">₹${item.price}</p>
                    </div>
                    <button class="add-to-cart text-amber-600 hover:text-amber-700" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
                        <i class="fas fa-plus-circle text-3xl"></i>
                    </button>
                </div>
                <p class="text-gray-600 mb-4">${item.description}</p>
            </div>
        `;
        menuContainer.appendChild(menuItem);
    });
}

// Example usage
fetchMenuItems();