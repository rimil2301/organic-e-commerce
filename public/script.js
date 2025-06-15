// Global variables
let currentUser = null;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page based on which HTML file is loaded
    if (document.querySelector('#sellerForm')) {
        initSellerPage();
    } else if (document.querySelector('#productList')) {
        initBuyerPage();
    } else if (document.querySelector('#forumPosts')) {
        initForumPage();
    }
    
    // Load products on buyer page
    if (window.location.pathname.includes('buyer.html')) {
        fetchProducts();
    }
});

// ================== SELLER FUNCTIONS ================== //
function initSellerPage() {
    // Check if seller is already registered
    const savedSeller = localStorage.getItem('sheharvest_seller');
    if (savedSeller) {
        currentUser = JSON.parse(savedSeller);
        document.getElementById('sellerForm').style.display = 'none';
    }
}

async function registerSeller() {
    const name = document.getElementById('sellerName').value.trim();
    const location = document.getElementById('sellerLocation').value.trim();

    if (!name || !location) {
        alert('Please fill in all fields');
        return;
    }

    const sellerData = {
        name,
        location,
        registeredAt: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:3000/api/sellers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sellerData)
        });

        if (response.ok) {
            currentUser = sellerData;
            localStorage.setItem('sheharvest_seller', JSON.stringify(sellerData));
            alert('Seller registered successfully!');
            document.getElementById('sellerForm').style.display = 'none';
        } else {
            throw new Error('Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error registering seller. Please try again.');
    }
}

async function listProduct() {
    if (!currentUser) {
        alert('Please register as a seller first');
        return;
    }

    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const description = document.getElementById('productDescription').value.trim();

    if (!name || isNaN(price) || !description) {
        alert('Please fill all fields with valid data');
        return;
    }

    const productData = {
        name,
        price,
        description,
        seller: currentUser.name,
        location: currentUser.location,
        listedAt: new Date().toISOString()
    };

    try {
        const response = await fetch('http://localhost:3000/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            alert('Product listed successfully!');
            document.getElementById('productForm').reset();
            fetchSellerProducts();
        } else {
            throw new Error('Listing failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error listing product. Please try again.');
    }
}

async function fetchSellerProducts() {
    if (!currentUser) return;

    try {
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();
        
        const sellerProducts = products.filter(p => p.seller === currentUser.name);
        const container = document.getElementById('sellerProducts');
        
        if (sellerProducts.length === 0) {
            document.getElementById('noProductsMessage').style.display = 'block';
            return;
        }
        
        document.getElementById('noProductsMessage').style.display = 'none';
        container.innerHTML = '';
        
        sellerProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'bg-green-50 p-4 rounded-lg shadow';
            productCard.innerHTML = `
                <h4 class="font-bold text-lg mb-2">${product.name}</h4>
                <p class="text-gray-700 mb-2">${product.description}</p>
                <p class="text-green-600 font-bold">₹${product.price}/kg</p>
                <p class="text-sm text-gray-500 mt-2">Listed on ${new Date(product.listedAt).toLocaleDateString()}</p>
            `;
            container.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// ================== BUYER FUNCTIONS ================== //
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/products');
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        document.getElementById('noProductsMessage').textContent = 'Error loading products. Please try again.';
    }
}

function displayProducts(products) {
    const container = document.getElementById('productList');
    
    if (products.length === 0) {
        document.getElementById('noProductsMessage').textContent = 'No products available yet. Check back later!';
        return;
    }
    
    document.getElementById('noProductsMessage').style.display = 'none';
    container.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card bg-white rounded-lg shadow-md overflow-hidden';
        productCard.innerHTML = `
            <div class="p-6">
                <h3 class="font-bold text-xl mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-4">${product.description}</p>
                <div class="flex justify-between items-center">
                    <span class="font-bold text-green-600">₹${product.price}/kg</span>
                    <span class="text-sm text-gray-500">From ${product.seller}, ${product.location}</span>
                </div>
            </div>
        `;
        container.appendChild(productCard);
    });
}

async function placeOrder() {
    const product = document.getElementById('orderProduct').value.trim();
    const quantity = parseFloat(document.getElementById('orderQuantity').value);
    const address = document.getElementById('orderAddress').value.trim();

    if (!product || isNaN(quantity) || !address) {
        alert('Please fill all fields with valid data');
        return;
    }

    const orderData = {
        product,
        quantity,
        address,
        orderedAt: new Date().toISOString(),
        status: 'Pending'
    };

    try {
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert('Order placed successfully!');
            document.getElementById('orderForm').reset();
        } else {
            throw new Error('Order failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error placing order. Please try again.');
    }
}

// ================== FORUM FUNCTIONS ================== //
function initForumPage() {
    // Set up tab switching
    document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('[id^="tab-"]').forEach(t => {
                t.classList.remove('active-tab');
            });
            
            // Add active class to clicked tab
            this.classList.add('active-tab');
            
            // Here you would typically filter posts based on the tab
            // For now, we'll just show all posts
        });
    });
}

function createPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();

    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }

    // In a real app, this would send to the server
    alert('Post created successfully! (This is a demo - posts are not actually saved)');
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    
    // Here you would typically refresh the forum posts
}