let supabase;

document.addEventListener("DOMContentLoaded", () => {
  const supabaseUrl = 'https://pbekzjgteinnntprfzhm.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWt6amd0ZWlubm50cHJmemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDM5MjYsImV4cCI6MjA2NDkxOTkyNn0.1yRQEisizC-MpDR6B5fJc2Z7Wzk1xcwsySyJMktSsF4';

  supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

  const button = document.querySelector("#send-btn");
  if (button) {
    button.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const msg = document.getElementById("msg");

      if (!email) {
        msg.style.color = "red";
        msg.textContent = "Please enter your email.";
        return;
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
          msg.style.color = "red";
          msg.textContent = `Error: ${error.message}`;
        } else {
          msg.style.color = "blue";
          msg.textContent = "Check your email for the reset link.";
        }
      } catch (e) {
        msg.style.color = "red";
        msg.textContent = "Something went wrong. See console.";
        console.error(e);
      }
    });
  }
});
