let appData = {
  credentials: { login: 'developer1234', password: 'dev0987' },
  standardProducts: [],
  rareProducts: []
};

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  loadCartFromLocalStorage();
  setupEventListeners();
  
  try {
    const response = await fetch('data.json');
    if (!response.ok) throw new Error('Failed to fetch data.json');
    appData = await response.json();
    renderProducts();
  } catch (error) {
    console.warn('data.json fetch failed, using fallback data if available.', error);
  }
}

function renderProducts() {
  const standardGrid = document.getElementById('standard-grid');
  const rareGrid = document.getElementById('rare-grid');

  if (standardGrid && appData.standardProducts) {
    standardGrid.innerHTML = appData.standardProducts.map(p => createProductCardHTML(p, false)).join('');
  }

  if (rareGrid && appData.rareProducts) {
    rareGrid.innerHTML = appData.rareProducts.map(p => createProductCardHTML(p, true)).join('');
  }
}

function createProductCardHTML(product, isRare) {
  return `
    <article class="product-card-item">
      <div class="card-image-wrapper">
        <img src="${product.image}" alt="${product.name}" class="card-image-file" loading="lazy">
      </div>
      <h2 class="card-title-heading">${product.name}</h2>
      <p class="card-price-tag">$${product.price.toLocaleString('en-US')}</p>
      <p class="card-description-text">${product.description}</p>
      <p class="card-specs-details">${product.details}</p>
      <button type="button" class="btn ${isRare ? 'btn-secondary' : 'btn-primary'} btn-full" onclick="addToCart('${product.id}')">
        Add to Cart
      </button>
    </article>
  `;
}

function setupEventListeners() {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleSignIn);
  }

  const togglePassBtn = document.getElementById('toggle-password');
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', togglePasswordVisibility);
  }

  document.getElementById('open-cart-btn')?.addEventListener('click', openCartModal);
  document.getElementById('close-cart-btn')?.addEventListener('click', closeCartModal);
  document.getElementById('continue-shopping-btn')?.addEventListener('click', closeCartModal);

  document.getElementById('open-contact-btn')?.addEventListener('click', openContactModal);
  document.getElementById('close-contact-btn')?.addEventListener('click', closeContactModal);
  
  document.querySelectorAll('.trigger-contact').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openContactModal();
    });
  });

  document.getElementById('profile-toggle')?.addEventListener('click', () => {
    document.getElementById('profile-menu')?.classList.toggle('hidden');
  });

  document.getElementById('signout-btn')?.addEventListener('click', handleSignOut);

  document.getElementById('contact-form')?.addEventListener('submit', handleContactSubmit);
  document.getElementById('newsletter-form')?.addEventListener('submit', handleNewsletterSubmit);

  document.getElementById('back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('nav-menu')?.classList.toggle('open');
  });

  window.addEventListener('click', (e) => {
    const cartModal = document.getElementById('cart-modal');
    const contactModal = document.getElementById('contact-modal');
    if (e.target === cartModal) closeCartModal();
    if (e.target === contactModal) closeContactModal();
  });

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    showNotification('Demo Checkout: No payment processor connected in this frontend version.');
  });
}

function handleSignIn(e) {
  e.preventDefault();

  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');

  usernameError.textContent = '';
  passwordError.textContent = '';

  const enteredUsername = usernameInput.value.trim();
  const enteredPassword = passwordInput.value.trim();

  let isValid = true;

  if (!enteredUsername) {
    usernameError.textContent = 'Please enter your username.';
    isValid = false;
  }

  if (!enteredPassword) {
    passwordError.textContent = 'Please enter your password.';
    isValid = false;
  }

  if (!isValid) return;

  if (
    enteredUsername === appData.credentials.login &&
    enteredPassword === appData.credentials.password
  ) {
    document.getElementById('auth-page').classList.add('hidden');
    startLoadingAnimation();
  } else {
    passwordError.textContent = 'Invalid username or password. Please check demo credentials.';
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
  }
}

function handleSignOut() {
  document.getElementById('main-content').classList.add('hidden');
  document.getElementById('profile-menu').classList.add('hidden');
  document.getElementById('auth-page').classList.remove('hidden');
  
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  
  showNotification('You have signed out successfully.');
}

function startLoadingAnimation() {
  const loadingScreen = document.getElementById('loading-screen');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const mainContent = document.getElementById('main-content');

  loadingScreen.classList.remove('hidden');

  let progress = 0;
  const interval = setInterval(() => {
    progress += 4;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        mainContent.classList.remove('hidden');
      }, 300);
    }
  }, 80);
}

function addToCart(productId) {
  const allProducts = [...(appData.standardProducts || []), ...(appData.rareProducts || [])];
  const product = allProducts.find(p => p.id === productId);

  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCartUI();
  saveCartToLocalStorage();
  showNotification(`${product.name} added to your cart.`);
}

function updateQuantity(productId, change) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    updateCartUI();
    saveCartToLocalStorage();
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  updateCartUI();
  saveCartToLocalStorage();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-badge').textContent = totalCount;

  const cartItemsList = document.getElementById('cart-items-list');
  const cartEmptyMsg = document.getElementById('cart-empty-msg');
  const cartFooter = document.getElementById('cart-footer');
  const subtotalElement = document.getElementById('cart-subtotal-price');

  if (cart.length === 0) {
    cartItemsList.innerHTML = '';
    cartEmptyMsg.classList.remove('hidden');
    cartFooter.classList.add('hidden');
  } else {
    cartEmptyMsg.classList.add('hidden');
    cartFooter.classList.remove('hidden');

    cartItemsList.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
        <div>
          <div class="cart-item-title-text">${item.name}</div>
          <div class="cart-item-unit-price">$${item.price.toLocaleString('en-US')} each</div>
        </div>
        <div class="cart-qty-box">
          <button type="button" class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button type="button" class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
        </div>
        <div>
          <span>$${(item.price * item.quantity).toLocaleString('en-US')}</span>
          <button type="button" class="cart-item-delete-btn" onclick="removeFromCart('${item.id}')">&times;</button>
        </div>
      </div>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    subtotalElement.textContent = `$${subtotal.toLocaleString('en-US')}`;
  }
}

function saveCartToLocalStorage() {
  localStorage.setItem('spoonora_cart', JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
  const saved = localStorage.getItem('spoonora_cart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      updateCartUI();
    } catch (e) {
      cart = [];
    }
  }
}

function openCartModal() {
  document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.add('hidden');
}

function openContactModal() {
  document.getElementById('contact-modal').classList.remove('hidden');
}

function closeContactModal() {
  document.getElementById('contact-modal').classList.add('hidden');
}

function handleContactSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('contact-name');
  const email = document.getElementById('contact-email');
  const subject = document.getElementById('contact-subject');
  const message = document.getElementById('contact-message');

  let isValid = true;

  if (!name.value.trim()) {
    document.getElementById('contact-name-error').textContent = 'Full name is required.';
    isValid = false;
  } else {
    document.getElementById('contact-name-error').textContent = '';
  }

  if (!email.value.trim() || !validateEmail(email.value.trim())) {
    document.getElementById('contact-email-error').textContent = 'Valid email is required.';
    isValid = false;
  } else {
    document.getElementById('contact-email-error').textContent = '';
  }

  if (!subject.value.trim()) {
    document.getElementById('contact-subject-error').textContent = 'Subject is required.';
    isValid = false;
  } else {
    document.getElementById('contact-subject-error').textContent = '';
  }

  if (!message.value.trim()) {
    document.getElementById('contact-message-error').textContent = 'Message body cannot be empty.';
    isValid = false;
  } else {
    document.getElementById('contact-message-error').textContent = '';
  }

  if (isValid) {
    showNotification('Your message has been submitted successfully.');
    document.getElementById('contact-form').reset();
    closeContactModal();
  }
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('newsletter-email');
  const errorElement = document.getElementById('newsletter-error');

  if (!emailInput.value.trim() || !validateEmail(emailInput.value.trim())) {
    errorElement.textContent = 'Please enter a valid email address.';
  } else {
    errorElement.textContent = '';
    showNotification('Thank you for subscribing to SPOONORA private updates.');
    emailInput.value = '';
  }
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function showNotification(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 4000);
}