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

      // Close other open dropdowns
      document.querySelectorAll('.dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });

      // Toggle .open on the parent .dropdown
      dropdown.classList.toggle('open');
    });

    // Close dropdown when mouse leaves
    dropdown.addEventListener('mouseleave', function () {
      dropdown.classList.remove('open');
    });

    // Close when clicking outside
    document.addEventListener('click', function () {
      dropdown.classList.remove('open');
    });
  });
});

// Supabase
let supabase; // declare globally so all functions can use it

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = 'https://pbekzjgteinnntprfzhm.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWt6amd0ZWlubm50cHJmemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM5MjYsImV4cCI6MjA2NDkxOTkyNn0.1yRQEisizC-MpDR6B5fJc2Z7Wzk1xcwsySyJMktSsF4';

  // ✅ Wait until supabase-js is loaded
  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  // Attach form listener
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await login();
    });
  }

  // Protect webpages before success login
  const protectedPages = ["index.html", "upload.html", "forecast.html", "sales.html", "inventory.html"];

  if (protectedPages.some(p => window.location.pathname.includes(p))) {
  protectPage();
  }

async function login() {
  console.log("Login function triggered");

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    alert("Login failed: " + error.message);
    console.error(error);
    return false;
  }

  window.location.href = "index.html";
  return false;
}

async function protectPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.href = "login.html";
  } else {
    document.body.style.display = "block";
  }
}
}); // <-- Add this to close the DOMContentLoaded event listener

// completely log user out
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "login.html";
}

