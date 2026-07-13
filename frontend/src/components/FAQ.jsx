import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = [
    { q: "What are your delivery timings?", a: "We deliver from 11:00 AM to 11:00 PM, every day of the week including Sundays and holidays." },
    { q: "Do you offer bulk catering or party orders?", a: "Yes! We love feeding a crowd. For large orders or events, please call us at least 24 hours in advance so we can prepare the best experience for you." },
    { q: "Is all the food prepared fresh?", a: "Absolutely. Every dish at The New Mirch Masala is made to order using fresh, high-quality ingredients and authentic spices sourced locally." },
    { q: "How can I track my order?", a: "Once you place an order, you'll receive a unique Order ID. Enter that in the 'Track Order' section of the website to see real-time status updates." },
    { q: "Do you have a minimum order amount?", a: "No minimum order amount! Even a single Fry Papad for ₹20 can be ordered and we'll deliver it with love." },
  ];
  return (
    <section className="section">
      <div className="container">
        <div className="section-header" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className="faq-item" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
              <div className="faq-question">
                {faq.q}
                <ChevronDown size={20} className={`faq-icon ${openIndex === i ? 'open' : ''}`} />
              </div>
              <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
