
document.getElementById('mobile-menu-button').addEventListener('click', function() {
  const mobileMenu = document.getElementById('mobile-menu');
  mobileMenu.classList.toggle('hidden');
});

let editingId = null;

function clearForm() {
  document.getElementById('menuId').value = '';
  document.getElementById('menuName').value = '';
  document.getElementById('menuDesc').value = '';
  document.getElementById('menuPrice').value = '';
  document.getElementById('menuImg').value = '';
  document.getElementById('menuSaveBtn').textContent = 'Add Item';
  document.getElementById('menuCancelBtn').classList.add('hidden');
  editingId = null;
}

function fillForm(item) {
  document.getElementById('menuId').value = item.id;
  document.getElementById('menuName').value = item.name;
  document.getElementById('menuDesc').value = item.description;
  document.getElementById('menuPrice').value = item.price;
  document.getElementById('menuImg').value = item.image_url || '';
  document.getElementById('menuSaveBtn').textContent = 'Update Item';
  document.getElementById('menuCancelBtn').classList.remove('hidden');
  editingId = item.id;
}

document.getElementById('menuCancelBtn').onclick = clearForm;

document.getElementById('menuForm').onsubmit = async function(e) {
  e.preventDefault();
  const id = document.getElementById('menuId').value;
  const name = document.getElementById('menuName').value.trim();
  const description = document.getElementById('menuDesc').value.trim();
  const price = parseFloat(document.getElementById('menuPrice').value);
  const image_url = document.getElementById('menuImg').value.trim();
  if (!name || !description || !price) {
      alert('Please fill all required fields.');
      return;
  }
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('price', price);
  formData.append('image_url', image_url);
  if (editingId) {
      formData.append('action', 'update_menu_item');
      formData.append('id', editingId);
  } else {
      formData.append('action', 'add_menu_item');
  }
  try {
      const res = await fetch('http://localhost/tabletop/backend/menu.php', {
          method: 'POST',
          body: formData
      });
      const data = await res.json();
      if (data.success || data.status === 'success') {
          alert('Menu item saved!');
          clearForm();
          loadMenuItems();
      } else {
          alert(data.error || data.message || 'Failed to save item');
      }
  } catch (error) {
      alert('Failed to save item');
  }
};

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) return;
  try {
      const res = await fetch('http://localhost/tabletop/backend/menu.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ action: 'delete_menu_item', id })
      });
      const data = await res.json();
      if (data.success) {
          alert('Menu item deleted!');
          loadMenuItems();
      } else {
          alert(data.error || 'Failed to delete item');
      }
  } catch (error) {
      alert('Failed to delete item');
  }
}

function loadMenuItems() {
  fetch('http://localhost/tabletop/backend/menu.php?action=get_menu')
      .then(res => res.json())
      .then(data => {
          const container = document.getElementById('menuItems');
          container.innerHTML = '';
          if (!data.data || data.data.length === 0) {
              container.innerHTML = '<p class="col-span-full text-center py-12 text-gray-500">No menu items found</p>';
              return;
          }
          data.data.forEach(item => {
              const div = document.createElement('div');
              div.className = 'bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col';
              div.innerHTML = `
                  <img src="${item.image_url || '../../assets/images/placeholder.png'}" alt="${item.name}" class="w-full h-40 object-cover rounded mb-4 bg-gray-100">
                  <div class="flex justify-between items-start mb-2">
                      <h3 class="text-xl font-bold text-gray-900">${item.name}</h3>
                      <div class="flex gap-4">
                          <button onclick='fillForm(${JSON.stringify(item)})' class="text-gray-600 hover:text-amber-600 transition-colors cursor-pointer" title="Edit"><i class="fas text-2xl fa-edit"></i></button>
                          <button onclick="deleteItem(${item.id})" class="text-gray-600 hover:text-red-600 transition-colors cursor-pointer" title="Delete"><i class="fas fa-trash text-2xl"></i></button>
                      </div>
                  </div>
                  <p class="text-gray-600 text-sm mb-2">${item.description}</p>
                  <p class="text-2xl font-bold text-amber-600">₹${item.price}</p>
              `;
              container.appendChild(div);
          });
      });
}

loadMenuItems();