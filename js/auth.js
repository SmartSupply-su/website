// Responsive Header
function toggleMenu() {
  const nav = document.getElementById("navLinks");
  nav.classList.toggle("show");
}

document.addEventListener('DOMContentLoaded', function () {
  const dropdowns = document.querySelectorAll('.dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();

      document.querySelectorAll('.dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });

      dropdown.classList.toggle('open');
    });

    dropdown.addEventListener('mouseleave', function () {
      dropdown.classList.remove('open');
    });

    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });
  });
});

// Supabase
let supabase; // global scope

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = 'https://pbekzjgteinnntprfzhm.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWt6amd0ZWlubm50cHJmemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM5MjYsImV4cCI6MjA2NDkxOTkyNn0.1yRQEisizC-MpDR6B5fJc2Z7Wzk1xcwsySyJMktSsF4';

  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  // Attach login form listener only on login page
  const form = document.querySelector("form");
  if (form && window.location.pathname.includes("login.html")) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await login();
    });
  }

  // Only protect certain pages
  const protectedPages = ["index.html", "upload.html", "forecast.html", "sales.html", "inventory.html"];
  const currentPage = window.location.pathname.split("/").pop();

  if (protectedPages.includes(currentPage)) {
    protectPage();
  }
});

// 🔐 Login function
async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
    console.error(error);
    return;
  }

  // ✅ Redirect to home page after login
  window.location.href = "index.html";
}

// 🔐 Protect restricted pages
async function protectPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
  } else {
    document.body.style.display = "block"; // show page after confirming login
  }
}

// 🔓 Logout function
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}
