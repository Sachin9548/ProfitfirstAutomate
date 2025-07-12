import React, { useState } from 'react';
import { Link } from 'react-router-dom';
const Blogsection = () => {
 const blogs = [
    {
      id: 1,
      category: "Insights",
      title:
        "Higher ROAS Doesn’t Mean You Are Profitable: Don’t Fall for the ROAS Trap!",
      author: "Shubham Soni",
      date: "Apr 23, 2025",
      image: "https://res.cloudinary.com/dqdvr35aj/image/upload/v1748328891/blog1_ert6uc.png",
      content: `
  📈 <strong>Higher ROAS ≠ Profitability</strong> 📉<br/><br/>
  
  When running a business, it’s easy to get excited by a high Return on Ad Spend (ROAS). For example, a 5× ROAS might seem like you’re making a fortune from your ads. But there’s a big catch: ROAS doesn’t directly indicate profitability.<br/><br/>
  
  ROAS measures revenue per ad dollar, but it leaves out one critical factor—<strong>costs</strong>. If expenses are high, profits may be far lower than they appear.<br/><br/>
  
  <h3>The Reality of ROAS</h3>
  Imagine your ads bring in $5,000 at a 5× ROAS. Looks like a win—until you subtract <strong>product costs</strong>, <strong>shipping</strong>, <strong>transaction fees</strong>, and other <strong>overheads</strong>. They total $4,500, so real profit is only $500.<br/><br/>
  
  <h3>Why ROAS Can Be Misleading</h3>
  ROAS ignores operational costs, product costs, and shipping—all of which shrink margins. If you track only ROAS, you miss the full picture.<br/><br/>
  
  <h3>The Solution: Profit First</h3>
  <strong>Profit First</strong> tracks actual <strong>net profit</strong> in real time, showing:<br/>
  - Net profit<br/>
  - Detailed <strong>ads</strong>, <strong>COGS</strong>, and <strong>shipping</strong><br/>
  - Predictive metrics for growth and sustainability<br/><br/>
  
  Stop guessing. Focus on real <strong>profit</strong>, not just revenue.<br/><br/>
  
  Ready to level up? Visit <a href="http://profitfirst.co.in">profitfirst.co.in</a> and book a demo today.
      `,
    },
  
    {
      id: 2,
      category: "Insights",
      title: "90 % OF D2C BRANDS DIE FROM MESSY DATA",
      author: "Shubham Soni",
      date: "Apr 24, 2025",
      image: "https://res.cloudinary.com/dqdvr35aj/image/upload/v1748329491/blog2_ot3vmq.png",
      content: `
  💥 <strong>DATA CHAOS KILLS D2C DREAMS</strong> 💥<br/><br/>
  
  <strong>90 % of D2C brands fail</strong> because they’re overwhelmed by <strong>messy data</strong>. Customer‑acquisition cost (CAC), lifetime value (LTV), product costs, shipping fees—the numbers live in too many places.<br/><br/>
  
  <h3>The Problem: Scattered Metrics & Chaotic Data</h3>
  Juggling spreadsheets across <strong>Meta Ads</strong>, <strong>Shopify</strong>, and <strong>Shiprocket</strong> causes confusion and hides financial insights.<br/><br/>
  
  Result? Poor decisions and overspending because key metrics—<strong>CAC</strong>, <strong>LTV</strong>, <strong>shipping</strong>—aren’t visible in one place.<br/><br/>
  
  <h3>Why Messy Data Hurts</h3>
  Without a single source of truth you can’t see relationships, e.g. real CAC or profit after fees. Your business flies blind.<br/><br/>
  
  <h3>The Solution: Profit First 🚀</h3>
  <strong>Profit First</strong> unifies <strong>Meta Ads</strong>, <strong>Shopify</strong>, and <strong>Shiprocket</strong> into one dashboard for<br/>
  ✅ All metrics in one place<br/>
  ✅ Real‑time <strong>CAC</strong>, <strong>LTV</strong>, <strong>shipping</strong><br/>
  ✅ Data‑driven growth<br/><br/>
  
  Stop letting <strong>data chaos</strong> sink your brand. Book a demo at <a href="http://profitfirst.co.in">profitfirst.co.in</a>.
      `,
    },
  
    {
      id: 3,
      category: "Insights",
      title: "Forget Spreadsheets — Profit First Tracks It All",
      author: "Shubham Soni",
      date: "Apr 25, 2025",
      image: "https://res.cloudinary.com/dqdvr35aj/image/upload/v1748329491/blog3_b7u8sg.png",
      content: `
  📊 <strong>Forget Spreadsheets — Profit First Tracks It All</strong> 📊<br/><br/>
  
  Spreadsheets are fine—until data multiplies. A modern D2C brand needs <strong>real‑time insights</strong>, not static rows and columns.<br/><br/>
  
  <h3>Why Spreadsheets Aren’t Enough</h3>
  They’re slow, error‑prone, and disconnected from ad, sales, and logistics platforms.<br/><br/>
  
  <h3>Profit First Gives You Everything, Live</h3>
  Instant access to:<br/>
  - <strong>Ad spend</strong> performance<br/>
  - <strong>Net profit</strong> after all costs<br/>
  - <strong>COGS</strong>, <strong>shipping</strong>, <strong>fees</strong>, overhead<br/><br/>
  
  <h3>Scale Profitably — Fast</h3>
  Connect <strong>Meta Ads</strong>, <strong>Shopify</strong>, and <strong>Shiprocket</strong>; see every metric in one dashboard.<br/><br/>
  
  No more monthly report marathons. Make decisions quickly and profitably.<br/><br/>
  
  Ready to ditch spreadsheets? Visit <a href="http://profitfirst.co.in">profitfirst.co.in</a> and book your demo today.
      `,
    },
  ];
  

  const [selectedBlog, setSelectedBlog] = useState(null);

  return (
    <section id="BLOG" className="py-12 px-4 md:px-12 text-white overflow-x-hidden">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-4xl font-bold text-center mb-6 leading-snug px-2">
        Stay Connected on our <span className="my-gradient-text font-bold">Newsletter</span>
      </h2>

      <p className="text-center text-white max-w-2xl mx-auto mb-10 px-2 text-sm sm:text-base">
        You’ll get to know how Profit First can help scale your D2C brand and how others manage their KPIs.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((blog) => (
          <div
            key={blog.id}
            className="bg-[#161616] rounded-lg shadow hover:shadow-lg transition flex flex-col p-4"
          >
            <div className="relative">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-auto object-cover rounded-lg"
              />
              <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded">
                {blog.category}
              </span>
            </div>

            <div className="mt-4 flex flex-col flex-grow">
              <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                {blog.title}
              </h3>
              <div className="flex justify-between text-sm text-gray-400 mt-auto">
                <span>By {blog.author}</span>
                <span>{blog.date}</span>
              </div>
              <button
                onClick={() => setSelectedBlog(blog)}
                className="mt-3 text-sm text-green-500 hover:underline self-start"
              >
                Read More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Modal */}
    {selectedBlog && (
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center px-4">
        <div className="bg-[#1e1e1e] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg relative p-6 text-white">
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 text-2xl font-bold"
            onClick={() => setSelectedBlog(null)}
          >
            &times;
          </button>
          <div className="mt-6">
            <img
              src={selectedBlog.image}
              alt={selectedBlog.title}
              className="w-full h-auto object-cover rounded"
            />
            <h3 className="text-sm text-green-500 mt-4">{selectedBlog.category}</h3>
            <p className="text-sm text-gray-400 mb-2">
              By {selectedBlog.author} | {selectedBlog.date}
            </p>
            <h2 className="text-2xl font-bold mb-4">{selectedBlog.title}</h2>
            <div
              className="leading-relaxed text-gray-300 prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
            />
          </div>
        </div>
      </div>
    )}
  </section>
  );
};

export default Blogsection;
