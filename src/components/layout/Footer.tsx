
export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2>SkySync</h2>
          <p>
            Your trusted travel companion for seamless flight booking and
            unforgettable journeys.
          </p>
        </div>

        <div className="footer-column">
          <h3>Quick Links</h3>
          <a href="/">Home</a>
          <a href="/flights">Flights</a>
          <a href="/booking">Bookings</a>
          <a href="/login">Login</a>
        </div>

        <div className="footer-column">
          <h3>Support</h3>
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
          <a href="#">FAQs</a>
          <a href="#">Privacy Policy</a>
        </div>

        <div className="footer-column">
          <h3>Contact</h3>
          <p>📧 support@skysync.com</p>
          <p>📞 +91 98765 43210</p>
          <p>📍 Chennai, India</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 SkySync. All rights reserved.</p>

        <div className="footer-socials">
          <a href="#">Facebook</a>
          <a href="#">Instagram</a>
          <a href="#">Twitter</a>
        </div>
      </div>
    </footer>
  );
}