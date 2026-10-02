import { useState, useEffect } from "react";
import {
  MapPin, ChevronDown, Search, ShieldCheck, Truck, BadgeCheck,
  Tag, Heart, ShoppingCart, Pill, Smartphone, Home, Shirt,
  Sparkles, Package, MoreHorizontal, Star, ChevronLeft,
  ChevronRight, FileText, Cylinder, Headphones, Download
} from "lucide-react";
import "./App.css";

import heroReference from "./assets/hero-reference.png";
import greenMart from "./assets/green-mart.png";
import dailyNeeds from "./assets/daily-needs.png";
import medplus from "./assets/medplus.png";
import superStore from "./assets/super-store.png";
import freshBasket from "./assets/fresh-basket.png";
import qrCode from "./assets/qr-code.png";
import locationIcon from "./assets/location.png";

const categories = [
  ["Groceries", ShoppingCart, "green"],
  ["Healthcare", Pill, "blue"],
  ["Electronics", Smartphone, "sky"],
  ["Home & Kitchen", Home, "orange"],
  ["Fashion", Shirt, "purple"],
  ["Beauty", Sparkles, "pink"],
  ["Daily Needs", Package, "cyan"],
  ["More", MoreHorizontal, "gray"]
];

const shops = [
  ["Green Mart", greenMart, "4.6", "20 mins", "249+"],
  ["Daily Needs Store", dailyNeeds, "4.5", "15 mins", "199+"],
  ["MedPlus Pharmacy", medplus, "4.7", "25 mins", "199+"],
  ["Super Store", superStore, "4.4", "30 mins", "299+"],
  ["Fresh Basket", freshBasket, "4.6", "20 mins", "249+"]
];

function Navbar({ setShowChat }) {
  const [showLanguages, setShowLanguages] = useState(false);
  const [language, setLanguage] = useState("English");
  const [locationName, setLocationName] = useState("Detecting location...");

  useEffect(() => {
    const savedLocation = localStorage.getItem("user_location");
    if (savedLocation) {
      setLocationName(savedLocation);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || "Unknown Location";
              const state = data.address.state || "";
              const fullLocation = `${city}${state ? ', ' + state : ''}`;
              setLocationName(fullLocation);
              localStorage.setItem("user_location", fullLocation);
              localStorage.setItem("user_lat", position.coords.latitude);
              localStorage.setItem("user_lon", position.coords.longitude);
              document.cookie = `user_location=${fullLocation}; path=/; max-age=31536000`;
              document.cookie = `user_lat=${position.coords.latitude}; path=/; max-age=31536000`;
              document.cookie = `user_lon=${position.coords.longitude}; path=/; max-age=31536000`;
            } catch (err) {
              setLocationName("Location unavailable");
            }
          },
          () => {
            setLocationName("Location disabled");
          }
        );
      } else {
        setLocationName("Geolocation not supported");
      }
    }
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setShowLanguages(false);
    
    const langCodeMap = { "English": "en", "Hindi": "hi", "Telugu": "te", "Gujarati": "gu", "Tamil": "ta" };
    const langCode = langCodeMap[lang];
    
    // Most robust way in React: set the Google Translate cookie and reload
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    
    // Also try the combo box just in case
    const translateSelect = document.querySelector('select.goog-te-combo');
    if (translateSelect) {
        translateSelect.value = langCode;
        translateSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Reload to apply translation flawlessly without React conflicts
    window.location.reload();
  };

  return (
    <header className="navbar">
      <div className="brand">DUNDOO</div>

      <button className="location">
        <img src={locationIcon} alt="Location" />
        {locationName}
        <ChevronDown size={14} />
      </button>

      <nav className="navlinks">
        <a className="active" onClick={() => window.location.href = "/"}>Home</a>
        <a onClick={() => window.location.href = "/categories"}>Categories</a>
        <a onClick={() => window.location.href = "/services"}>Services</a>
        <a onClick={() => window.location.href = "/support"}>Support</a>
      </nav>

      <div className="nav-actions">
        <div className="language-wrapper">
          <button className="language" onClick={() => setShowLanguages(!showLanguages)}>
            {language}
            <ChevronDown size={13} />
          </button>

          {showLanguages && (
            <div className="language-menu">
              {["English", "Hindi", "Telugu", "Gujarati", "Tamil"].map((lang) => (
                <button key={lang} onClick={() => handleLanguageChange(lang)}>
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="login"
          onClick={() => window.location.href = "/user/login"}
        >
          Login
        </button>

        <button
          className="ai"
          onClick={() => setShowChat(true)}
        >
          AI
        </button>
      </div>
    </header>
  );
}

function Hero() {
  const [query, setQuery] = useState("");

  return (
    <section className="hero">
      <div className="hero-left">
        <h1>Your One-Stop Solution<br/>for <span>Daily Services</span></h1>
        <p className="subtitle">One place for every necessity</p>

        <div className="trust">
          <span><ShieldCheck/> Trusted Local Shops</span>
          <span><Truck/> Fast Delivery</span>
          <span><BadgeCheck/> Verified Providers</span>
          <span><Tag/> Great Offers</span>
        </div>

        <div className="searchbar">
          <button className="all-categories">All Categories <ChevronDown size={14}/></button>
          <Search size={18}/>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for products or services..."
          />
          <button className="search-btn">Search</button>
        </div>

        <div className="popular">
          <b>Popular searches:</b>
          {["Milk", "Grocery", "Medicine", "Vegetables", "Mobile Recharge"].map(x =>
            <span key={x}>{x}</span>
          )}
        </div>
      </div>

      <div className="hero-right">
        <img src={heroReference} alt="Dundoo shopper reference"/>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="categories card">
      {categories.map(([name, Icon, tone]) => (
        <button className="category" key={name}>
          <div className={`category-icon ${tone}`}><Icon/></div>
          <span>{name}</span>
        </button>
      ))}
    </section>
  );
}

function ShopCard({shop}) {
  const [name, image, rating, time, free] = shop;
  return (
    <article className="shop-card">
      <img src={image} alt={name}/>
      <div className="shop-body">
        <h3>{name}</h3>
        <div className="shop-meta">
          <span className="rating"><Star size={12} fill="currentColor"/> {rating}</span>
          <span>•</span>
          <span>{time}</span>
        </div>
        <span className="delivery">Free delivery ₹{free}</span>
      </div>
    </article>
  );
}

function Featured() {
  return (
    <section className="featured card">
      <div className="section-head">
        <h2>Featured Near You</h2>
        <button>View all <ChevronRight size={15}/></button>
      </div>

      <div className="shop-row">
        <button className="arrow left"><ChevronLeft/></button>
        {shops.map(shop => <ShopCard key={shop[0]} shop={shop}/>)}
        <button className="arrow right"><ChevronRight/></button>
      </div>
    </section>
  );
}

function SidePanel() {
  return (
    <aside className="side">
      <section className="side-section">
        <div className="section-head">
          <h2>Offers for You</h2>
          <button>View all</button>
        </div>
        <div className="offer">
          <div>
            <h3><span className="percent">%</span> Flat 10% OFF</h3>
            <p>On orders above ₹299</p>
            <span className="coupon">Use Code: DUNDOO10</span>
          </div>
          <div className="basket">🛒</div>
        </div>
      </section>

      <section className="side-section">
        <div className="section-head">
          <h2>Quick Services</h2>
          <button>View all</button>
        </div>
        <div className="quick">
          {[
            [Smartphone, "Mobile Recharge"],
            [FileText, "Bill Payments"],
            [Pill, "Medicine Delivery"],
            [Cylinder, "Book Cylinder"]
          ].map(([Icon, label]) => (
            <button key={label}>
              <span><Icon/></span>
              <small>{label}</small>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

function Benefits() {
  const [showQR, setShowQR] = useState(false);
  const items = [
    [Truck, "Lightning Fast Delivery", "Get your orders in 15–30 mins"],
    [ShieldCheck, "Verified & Trusted", "All shops & providers are verified"],
    [Tag, "Best Prices & Offers", "Exclusive deals & discounts for you"],
    [Headphones, "24/7 Customer Support", "We're here to help you anytime"]
  ];

  return (
    <section className="benefits card">
      {items.map(([Icon, title, text]) => (
        <div className="benefit" key={title}>
          <div className="benefit-icon"><Icon/></div>
          <div><b>{title}</b><p>{text}</p></div>
        </div>
      ))}
      <div className="download">
        <div>
          <b>Download the Dundoo App</b>
          <p>Better experience. Exclusive offers.</p>
          <button onClick={() => setShowQR(true)}>
            <Download size={13}/> Download Now
          </button>
        </div>
        <div className="qr">
          <img src={qrCode} alt="Dundoo App QR Code" />
        </div>
      </div>
       {showQR && (
        <div className="qr-popup">
          <div className="qr-popup-content">
            <button
              className="close-qr"
              onClick={() => setShowQR(false)}
            >
              ×
            </button>

            <h3>Download Dundoo App</h3>
            <p>Scan this QR code to download the app</p>

            <img src={qrCode} alt="Dundoo App QR Code" />

            <p>Scan with your phone camera</p>
          </div>
        </div>
      )}
    </section>
  );
}
export default function App() {
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "Hi! 👋 I'm Dundoo AI. How can I help you today?"
    }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: message
      }
    ]);

    setMessage("");
  };

  return (
    <>
      <Navbar setShowChat={setShowChat} />

      {showChat && (
        <div className="chatbot">
          <div className="chat-header">
            <div>
              <b>Dundoo AI</b>
              <small>AI Assistant</small>
            </div>

            <button onClick={() => setShowChat(false)}>×</button>
          </div>

          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.type === "user"
                    ? "user-message"
                    : "bot-message"
                }
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask Dundoo AI..."
            />

            <button onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}

      <main>
        <Hero />

        <div className="content-grid">
          <div>
            <Categories />
            <Featured />
          </div>

          <SidePanel />
        </div>

        <Benefits />
      </main>
    </>
  );
}
